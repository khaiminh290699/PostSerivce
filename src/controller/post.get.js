const { PostModel, SettingModel, PostForumModel, ProgressingModel } = require("../db");

async function postGet(data, db) {
  const { id } = db.params;

  const postModel = new PostModel(db);
  const settingModel = new SettingModel(db);
  const postForumModel = new PostForumModel(db);
  const progressingModel = new ProgressingModel(db);

  const post = await postModel.findOne({ id, is_deleted: false });

  if (!post) {
    return { status: 404, message: "Post not found" };
  }
  const { id: post_id } = post;

  const accountSettings = await settingModel.query()
    .select(
      settingModel.DB.raw(`
        settings.id AS setting_id,
        accounts.id AS account_id,
        timer_setting.id AS timer_id,
        accounts.username,
        accounts.password,
        settings.create_type,
        timer_setting.timer_at,
        timer_setting.from_date,
        timer_setting.to_date
      `)
    )
    .join("accounts", "accounts.id", "settings.account_id")
    .leftJoin("timer_setting", "timer_setting.setting_id", "settings.id")
    .where({ post_id });

  const forums = await postForumModel.query()
    .select(
      postForumModel.DB.raw(`
        forums.id AS forum_id,
        webs.id AS web_id,
        forums.forum_name,
        forums.forum_url,
        webs.web_name,
        webs.web_url,
        webs.web_key
      `)
    )
    .join("forums", "forums.id", "post_forum.forum_id")
    .join("webs", "webs.id", "forums.web_id")
    .where({ post_id });

  const progressing;
}

module.exports = postGet;