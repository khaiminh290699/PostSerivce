const { ModelPost, ModelProgressing } = require("../db");

async function postToggle(data, db) {
  const { post_id, mode } = data.params;
  const { id: user_id, isAdmin } = data.meta.user
  const modelPost = new ModelPost(db);
  const modelProgressing = new ModelProgressing(db);

  if (mode === "admin" && !isAdmin) {
    return { status: 403, message: "Not permission" }
  }

  let post = await modelPost.findOne({ id: post_id });

  if (!isAdmin) {
    if (post.user_id != user_id) {
      return { status: 403, message: "Not permission" }
    }
  }

  if (post.is_deleted === false) {
    await modelProgressing.query().update({ status: "fail" }).where({ post_id: post.id }).returning(["id"]);
  } else {
    const existTitle = await modelPost.query().where({ title: post.title, is_deleted: false });
    if (existTitle) {
      return { status: 400, message: "Title exist" }
    }
  }
  
  post.is_deleted = !post.is_deleted;
  post = await modelPost.updateOne(post);
  
  return { status: 200, data: { post } };
}

module.exports = postToggle;