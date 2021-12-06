const { ModelPost, Model, ModelSetting, ModelProgressing, ModelPostingStatus, ModelTimerSetting, ModelForumSetting, ModelBackLink, ModelProgressingPostStatus } = require("../db");
const moment = require("moment");

async function postCreate(data, db, rabbitmq) {
  const { post, accounts, timerSettings, forumSettings } = data.params;
  const { title, content } = post;
  const { id: user_id } = data.meta.user
  const model = new Model(db);

  if (!title || !content || !accounts) {
    return { status: 400, message: "Missing params" };
  }

  const modelPost = new ModelPost(db);
  const existTitle = await modelPost.findOne({ title: post.title, is_deleted: false });
  if (existTitle) {
    return { status: 400, message: "Title exist" };
  }

  const result = await model.openTransaction(async (trx) => {
    const modelPost = new ModelPost(db, trx);
    try {
      return await modelPost.create(title, content, user_id, accounts, timerSettings, forumSettings);
    } catch (err) {
      console.log(err);
      throw err;
    }
  })

  if (result.progressing) {
    await rabbitmq.produce(result, { exchange: "background", queue: "create_post" })
  }
  return {status: 200, data: result }
}

module.exports = postCreate;