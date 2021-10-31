const { ModelPost, Model, ModelSetting, ModelPostForum, ModelProgressing, ModelPostingStatus, ModelTimerSetting, ModelForumSetting } = require("../db");
const moment = require("moment");

async function postCreate(data, db, rabbitmq) {
  const { post, forums, settings } = data.params;
  const { id: user_id } = data.meta.user
  const model = new Model(db);

  const modelPost = new ModelPost(db);
  const existTitle = await modelPost.query().joinRaw(`
      JOIN post_forum ON post_forum.post_id = posts.id
    `)
    .whereRaw(`
      posts.title = :title
      AND posts.is_deleted = false
    `, { title: post.title })
    .whereIn(modelPost.DB.raw(`post_forum.forum_id`), forums)
    .first();

  if (existTitle) {
    return { status: 400, message: "Title exists in this forum !" }
  }

  const timerSettings = settings.reduce((list, setting) => {
    if (setting.timers) {
      list.push(...setting.timers.map(timer => ({ ...timer, account_id: setting.account_id })));
    } 
    return list
  }, [])

  let invalid = false;
  const forumSettings = settings.reduce((list, setting) => {
    if (!setting.forums || !setting.forums.length) {
      invalid = true;
    }
    if (setting.forums) {
      list.push(...setting.forums.map(forum => ({ forum_id: forum.id, account_id: setting.account_id })));
    } 
    return list
  }, [])

  if (invalid) {
    return { status: 400, message: "Bad request" };
  }

  const result = await model.openTransaction(async (trx) => {
    const modelPost = new ModelPost(db, trx);
    const modelSetting = new ModelSetting(db, trx);
    const modelPostForum = new ModelPostForum(db, trx);
    const modelProgressing = new ModelProgressing(db, trx);
    const modelPostingStatus = new ModelPostingStatus(db, trx);
    const modelTimerSetting = new ModelTimerSetting(db, trx);
    const modelForumSetting = new ModelForumSetting(db, trx);


    // create post;
    const newPost = await modelPost.insertOne({ ...post, user_id });
    
    const settingPost = await modelSetting.query().insert(settings.map((setting) => ({ account_id: setting.account_id, post_id: newPost.id }))).returning(["*"]);
    await modelTimerSetting.query().insert(timerSettings.map(timerSetting => {
      const setting = settingPost.filter((setting) => setting.account_id === timerSetting.account_id)[0];
      return {
        setting_id: setting.id,
        timer_at: moment(timerSetting.timer_at).startOf("minute").format("HH:mm"),
        from_date: moment(timerSetting.from_date).startOf("date"),
        to_date: moment(timerSetting.to_date).endOf("date")
      }
    }))
    await modelForumSetting.query().insert(forumSettings.map(forumSetting => {
      const setting = settingPost.filter((setting) => setting.account_id === forumSetting.account_id)[0];
      return {
        setting_id: setting.id,
        forum_id: forumSetting.forum_id
      }
    }))

    await modelPostForum.query().insert(forums.map((forum) => ({ forum_id: forum, post_id: newPost.id }))).returning(["*"])

    // create processing for posting;
    const postings = await modelPost.query()
    .select(
      modelPost.DB.raw(`
        settings.id AS setting_id,
        forums.id AS forum_id
      `)
    )
    .joinRaw(`
      JOIN settings ON ( settings.post_id = posts.id )
      JOIN forum_setting ON ( forum_setting.setting_id = settings.id )
      JOIN forums ON ( forums.id = forum_setting.forum_id )
      JOIN accounts ON ( accounts.id = settings.account_id )
    `).whereRaw(`
      accounts.web_id = forums.web_id
      AND posts.id = :post_id
      AND forum_setting.is_deleted = false
    `, { post_id: newPost.id })

    if (postings.length) {
      const progressing = await modelProgressing.insertOne({ post_id: newPost.id, type: "posting", progressing_total: postings.length, progressing_amount: 0, status: "waiting" });
      await modelPostingStatus.query().insert(postings.map((posting) => ({ ...posting, progressing_id: progressing.id })))
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