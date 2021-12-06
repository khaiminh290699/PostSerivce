const { ModelPost } = require("../db");

async function postList(data, db) {
  const { wheres = [], order = {}, pageSize, pageIndex, mode } = data.params;
  const { id: user_id, isAdmin } = data.meta.user;

  if (mode === "admin" && !isAdmin) {
    return { status: 403, message: "Not permission" }
  }
  
  const modelPost = new ModelPost(db);

  const posts = await modelPost.list(mode, user_id, wheres, pageIndex, pageSize, order);
  const total = posts[0] ? +posts[0].count : 0;
  return { status: 200, data: { posts, total } };
}

module.exports = postList;