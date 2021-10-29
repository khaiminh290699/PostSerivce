const { PostModel, Model, SettingModel, PostForumModel, ProgressingModel, PostingStatusModel, TimerSettingModel } = require("../db");
const moment = require("moment");

async function postCreate(data, db, rabbitmq) {
  const { post, forums, settings } = data.params;
  const { id: user_id } = data.meta.user
  const model = new Model(db);

  const postModel = new PostModel(db);
  const existTitle = await postModel.query().joinRaw(`
      JOIN post_forum ON post_forum.post_id = posts.id
    `)
    .whereRaw(`
      posts.title = :title
      AND posts.is_deleted = false
    `, { title: post.title })
    .whereIn(postModel.DB.raw(`post_forum.forum_id`), forums)
    .first();

  if (existTitle) {
    return { status: 400, message: "Title exists in this forum !" }
  }

  const result = await model.openTransaction(async (trx) => {
    const postModel = new PostModel(db, trx);
    const settingModal = new SettingModel(db, trx);
    const postForumModel = new PostForumModel(db, trx);
    const progressingModel = new ProgressingModel(db, trx);
    const postingStatusModel = new PostingStatusModel(db, trx);
    const timerSettingModel = new TimerSettingModel(db, trx);

    const timerSettings = settings.reduce((list, setting) => {
      if (setting.timers) {
        list.push(...setting.timers.map(timer => ({ ...timer, account_id: setting.account_id })));
      } 
      return list
    }, [])

    // create post;
    const newPost = await postModel.insertOne({ ...post, user_id });
    
    const settingPost = await settingModal.query().insert(settings.map((setting) => ({ account_id: setting.account_id, create_type: setting.create_type, post_id: newPost.id }))).returning(["*"]);
    await timerSettingModel.query().insert(timerSettings.map(timerSetting => {
      const setting = settingPost.filter((setting) => setting.account_id === timerSetting.account_id)[0];
      return {
        setting_id: setting.id,
        timer_at: moment(timerSetting.timer_at).startOf("minute").format("HH:mm"),
        from_date: moment(timerSetting.from_date).startOf("date"),
        to_date: moment(timerSetting.to_date).endOf("date")
      }
    }))
    await postForumModel.query().insert(forums.map((forum) => ({ forum_id: forum, post_id: newPost.id }))).returning(["*"])

    // create processing for posting;
    const postings = await postModel.query()
    .select(
      postModel.DB.raw(`
        settings.id AS setting_id,
        forums.id AS forum_id
      `)
    )
    .joinRaw(`
      JOIN settings ON ( settings.post_id = posts.id AND settings.create_type = 'create_and_post' )
      JOIN post_forum ON ( post_forum.post_id = posts.id )
      JOIN forums ON ( forums.id = post_forum.forum_id )
      JOIN accounts ON ( accounts.id = settings.account_id )
    `).whereRaw(`
      accounts.web_id = forums.web_id
      AND posts.id = :post_id
    `, { post_id: newPost.id })

    if (postings.length) {
      const progressing = await progressingModel.insertOne({ post_id: newPost.id, type: "posting", progressing_total: postings.length, progressing_amount: 0, status: "waiting" });
      await postingStatusModel.query().insert(postings.map((posting) => ({ ...posting, progressing_id: progressing.id })))
      return { post: newPost, progressing }
    }
    return { post: newPost }
  })

  if (result.progressing) {
    await rabbitmq.produce(result, { exchange: "background", queue: "create_post" })
  }
  return {status: 200, data: result }
}

module.exports = postCreate;