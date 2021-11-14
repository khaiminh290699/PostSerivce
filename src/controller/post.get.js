const { ModelPost, ModelSetting, ModelProgressing, ModelTimerSetting, ModelForumSetting, ModelStatisticBackLink } = require("../db");

async function postGet(data, db) {
  const { id } = data.params;

  const modelPost = new ModelPost(db);
  const modelSetting = new ModelSetting(db);
  const modelProgressing = new ModelProgressing(db);
  const modelTimerSetting = new ModelTimerSetting(db);
  const modelForumSetting = new ModelForumSetting(db);
  const modelStatisticBackLink = new ModelStatisticBackLink(db);

  const post = await modelPost.findOne({ id });

  if (!post) {
    return { status: 404, message: "Post not found" };
  }
  const { id: post_id } = post;

  const accountSettings = await modelSetting.query()
    .select(
      modelSetting.DB.raw(`
        settings.id AS setting_id,
        accounts.id AS account_id,
        accounts.username,
        accounts.password,
        webs.web_name,
        webs.web_url,
        webs.web_key,
        webs.id AS web_id
      `)
    )
    .join("accounts", "accounts.id", "settings.account_id")
    .join("webs", "webs.id", "accounts.web_id")
    .where({ post_id });

  const timerSettings = await modelTimerSetting.query()
    .select(
      modelTimerSetting.DB.raw(`
        timer_setting.*,
        forum_name,
        forum_url,
        web_name,
        web_url
      `)
    )
    .join("forums", "forums.id", "timer_setting.forum_id")
    .join("webs", "webs.id", "forums.web_id")
    .whereIn("setting_id", accountSettings.map(accountSetting => accountSetting.setting_id))
    .whereRaw(`
      forums.is_deleted = false
    `)
    .whereRaw(`timer_setting.is_deleted = false`);
    
  const forumSettings = await modelForumSetting.query()
    .select(
      modelForumSetting.DB.raw(`
        forum_setting.*,
        webs.id AS web_id,
        webs.web_url,
        webs.web_key,
        webs.web_name,
        forums.forum_name,
        forums.forum_url
      `)
    )
    .join("forums", "forums.id", "forum_setting.forum_id")
    .join("webs", "webs.id", "forums.web_id")
    .whereIn("setting_id", accountSettings.map(accountSetting => accountSetting.setting_id))
    .whereRaw(`
      forums.is_deleted = false
    `);

  accountSettings.map(accountSetting => {
    accountSetting.timerSettings = timerSettings.filter((timerSetting) => timerSetting.setting_id === accountSetting.setting_id);
    accountSetting.forumSettings = forumSettings.filter((forumSetting) => forumSetting.setting_id === accountSetting.setting_id)
    return accountSetting;
  })

  const progressing = await modelProgressing.query().where({ post_id }).where("status", "!=", "removed").first();

  const { total_click } = await modelStatisticBackLink.query()
    .select(
      modelStatisticBackLink.DB.raw(`
        COUNT(*) AS total_click
      `)
    )
    .where({
      post_id
    })
    .first() || { total_click: 0 }

  return { status: 200, data: { post, accountSettings, progressing, total_click } };
}

module.exports = postGet;