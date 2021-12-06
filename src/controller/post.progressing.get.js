const { ModelPost, ModelProgressing, ModelPostingStatus } = require("../db");

async function progressingGet(data, db) {
  const { id } = data.params;
  const { id: user_id, isAdmin } = data.meta.user
  const modelPost = new ModelPost(db);
  const modelProgressing = new ModelProgressing(db);
  const modelPostingStatus = new ModelPostingStatus(db);

  const progressing = await modelProgressing.getOne(id);

  const post = await modelPost.findOne({ id: progressing.post_id });
  if (post.user_id != user_id && !isAdmin) {
    return { status: 403, message: "Not permission" }
  }

  const postingStatus = await modelPostingStatus.listInProgressing(progressing.id);
  return { status: 200, data: { progressing, postingStatus } };
}

module.exports = progressingGet