const { ModelPost, ModelSetting, ModelPostForum, ModelProgressing } = require("../db");

async function postGet(data, db) {
  const { id } = data.params;

  const modelPost = new ModelPost(db);
  const modelSetting = new ModelSetting(db);
  const modelPostForum = new ModelPostForum(db);
  const modelProgressing = new ModelProgressing(db);

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

  const forums = await modelPostForum.query()
    .select(
      modelPostForum.DB.raw(`
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

  const progressing = await modelProgressing.findOne({ post_id });

  return { status: 200, data: { post, accountSettings, forums, progressing } };
}

module.exports = postGet;