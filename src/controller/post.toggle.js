const { ModelPost, ModelPostForum, ModelProgressing, ModelPostingStatus } = require("../db");

async function postToggle(data, db) {
  const { post_id, mode } = data.params;
  const { id: user_id, isAdmin } = data.meta.user
  const modelPost = new ModelPost(db);
  const modelPostForum = new ModelPostForum(db);
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

  if (post.is_deleted === true) {
    const existTilteForumIds = await modelPost.query().joinRaw(`
      JOIN post_forum ON post_forum.post_id = posts.id
    `)
    .whereRaw(`
      title = :title
      AND posts.id != :post_id
      AND posts.is_deleted = false
    `, { title: post.title, post_id: post.id })
    .pluck("forum_id");

    if (existTilteForumIds.length > 0) {

      const exist = await modelPostForum.query().where("post_id", post.id).whereIn("forum_id", existTilteForumIds).first();
      if (exist) {
        return { status: 400, message: "Title exists in this forum !" }
      }
    }

  }


  if (post.is_deleted === false) {
    await modelProgressing.query().update({ status: "fail" }).where({ post_id: post.id }).returning(["id"]);
  }
  
  post.is_deleted = !post.is_deleted;
  post = await modelPost.updateOne(post);
  
  return { status: 200, data: { post } };
}

module.exports = postToggle;