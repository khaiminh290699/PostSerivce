const { ModelPost, ModelProgressing, ModelPostingStatus } = require("../db");

async function progressingGet(data, db) {
  const { id } = data.params;
  const { id: user_id, isAdmin } = data.meta.user
  const modelPost = new ModelPost(db);
  const modelProgressing = new ModelProgressing(db);
  const modelPostingStatus = new ModelPostingStatus(db);

  const progressing = await modelProgressing.findOne({ id });

  const post = await modelPost.findOne({ id: progressing.post_id });
  if (post.user_id != user_id && !isAdmin) {
    return { status: 403, message: "Not permission" }
  }

  const postingStatus = await modelPostingStatus.query().where({ progressing_id: progressing.id })
    .select(
      modelPostingStatus.DB.raw(`
        posting_status.id,
        posting_status.status,
        posting_status.message,
        accounts.username,
        accounts.password,
        webs.web_name,
        webs.web_url,
        webs.web_key,
        forums.id AS forum_id,
        forums.forum_name,
        forums.forum_url
      `)
    )
    .joinRaw(`
      JOIN progressing_post_status ON ( progressing_post_status.posting_status_id = posting_status.id )
      JOIN forums ON ( forums.id = posting_status.forum_id )
      JOIN settings ON ( settings.id = posting_status.setting_id )
      JOIN accounts ON ( accounts.id = settings.account_id )
      JOIN webs ON ( webs.id = accounts.web_id AND webs.id = forums.web_id )
    `)
    .orderByRaw(`
      webs.id,
      forums.id,
      accounts.id
    `)

  return { status: 200, data: { progressing, postingStatus } };
}

module.exports = progressingGet