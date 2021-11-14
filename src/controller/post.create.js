const { ModelPost, Model, ModelSetting, ModelProgressing, ModelPostingStatus, ModelTimerSetting, ModelForumSetting, ModelBackLink, ModelProgressingPostStatus } = require("../db");
const moment = require("moment");

async function postCreate(data, db, rabbitmq) {
  const { post, settings } = data.params;
  const { id: user_id } = data.meta.user
  const model = new Model(db);

  const modelPost = new ModelPost(db);

  const timerSettings = settings.reduce((list, setting) => {
    if (setting.timers) {
      list.push(...setting.timers.map(timer => ({ ...timer, account_id: setting.account_id })));
    } 
    return list
  }, [])

  const forumSettings = settings.reduce((list, setting) => {
    if (setting.forums) {
      list.push(...setting.forums.map(forum => ({ forum_id: forum.id, account_id: setting.account_id })));
    } 
    return list
  }, [])

  const result = await model.openTransaction(async (trx) => {
    const modelPost = new ModelPost(db, trx);
    const modelSetting = new ModelSetting(db, trx);
    const modelProgressing = new ModelProgressing(db, trx);
    const modelPostingStatus = new ModelPostingStatus(db, trx);
    const modelProgressingPostStatus = new ModelProgressingPostStatus(db, trx);
    const modelTimerSetting = new ModelTimerSetting(db, trx);
    const modelForumSetting = new ModelForumSetting(db, trx);

    // create post;
    const newPost = await modelPost.insertOne({ ...post, user_id });
    
    const settingPost = await modelSetting.query().insert(settings.map((setting) => ({ account_id: setting.account_id, post_id: newPost.id }))).returning(["*"]);
    if (timerSettings.length) {
      await modelTimerSetting.query().insert(timerSettings.map(timerSetting => {
        const setting = settingPost.filter((setting) => setting.account_id === timerSetting.account_id)[0];
        return {
          setting_id: setting.id,
          forum_id: timerSetting.forum_id,
          timer_at: moment(timerSetting.timer_at).startOf("minute").format("HH:mm"),
          from_date: moment(timerSetting.from_date).startOf("date"),
          to_date: moment(timerSetting.to_date).endOf("date")
        }
      }))
    }

    if (forumSettings.length) {
      await modelForumSetting.query().insert(forumSettings.map(forumSetting => {
        const setting = settingPost.filter((setting) => setting.account_id === forumSetting.account_id)[0];
        return {
          setting_id: setting.id,
          forum_id: forumSetting.forum_id
        }
      }))
    }


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
      const progressing = await modelProgressing.insertOne({ post_id: newPost.id, total: postings.length, done: 0, status: "waiting" });
      
      const postingStatuses = await modelPostingStatus.query().insert(postings.map((posting) => ({ ...posting }))).returning(["id"]);

      await modelProgressingPostStatus.query().insert(postingStatuses.map((postStatus) => ({ posting_status_id: postStatus.id, progressing_id: progressing.id })))
      
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