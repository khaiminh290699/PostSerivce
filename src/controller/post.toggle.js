const { PostModel, PostForumModel, ProgressingModel, PostingStatusModel } = require("../db");

async function postToggle(data, db) {
  const { post_id, mode } = data.params;
  const { id: user_id, isAdmin } = data.meta.user
  const postModel = new PostModel(db);
  const postForumModel = new PostForumModel(db);
  const progressingModel = new ProgressingModel(db);

  if (mode === "admin" && !isAdmin) {
    return { status: 403, message: "Not permission" }
  }

  let post = await postModel.findOne({ id: post_id });

  if (!isAdmin) {
    if (post.user_id != user_id) {
      return { status: 403, message: "Not permission" }
    }
  }

  if (post.is_deleted === true) {
    const existTilteForumIds = await postModel.query().joinRaw(`
      JOIN post_forum ON post_forum.post_id = posts.id
    `)
    .whereRaw(`
      title = :title
      AND posts.id != :post_id
      AND posts.is_deleted = false
    `, { title: post.title, post_id: post.id })
    .pluck("forum_id");

    if (existTilteForumIds.length > 0) {

      const exist = await postForumModel.query().where("post_id", post.id).whereIn("forum_id", existTilteForumIds).first();
      if (exist) {
        return { status: 400, message: "Title exists in this forum !" }
      }
    }

  }


  if (post.is_deleted === false) {
    await progressingModel.query().update({ status: "fail" }).where({ post_id: post.id }).returning(["id"]);
  }
  
  post.is_deleted = !post.is_deleted;
  post = await postModel.updateOne(post);
  
  return { status: 200, data: { post } };
}

module.exports = postToggle;