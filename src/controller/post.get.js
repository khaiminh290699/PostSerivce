const { ModelPost, ModelSetting, ModelProgressing, ModelTimerSetting, ModelForumSetting, ModelStatisticBackLink } = require("../db");

async function postGet(data, db) {
  const { id } = data.params;

  const modelPost = new ModelPost(db);

  const post = await modelPost.getOne(id);

  return { status: 200, data: post };
}

module.exports = postGet;