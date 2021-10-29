const { PostModel } = require("../db");

async function postList(data, db) {
  const { wheres = [], order = {}, pageSize, pageIndex, mode } = data.params;
  const { id: user_id, isAdmin } = data.meta.user;

  if (mode === "admin" && !isAdmin) {
    return { status: 403, message: "Not permission" }
  }
  
  const postModel = new PostModel(db);

  const query = postModel.query().joinRaw(`
    JOIN users ON users.id = posts.user_id
  `)
  .select(
    postModel.DB.raw(`
      COUNT(*) OVER(),
      posts.*,
      substring(regexp_replace(posts.content, E'<[^>]+>', '', 'gi') from 0 for 100) AS content,
      users.username
    `)
  )

  if (mode != "admin") {
    query.where("user_id", "=", user_id);
  }

  const posts = await postModel.queryByCondition(query, wheres, pageIndex, pageSize, order);
  const total = posts[0] ? +posts[0].count : 0;
  return { status: 200, data: { posts, total } };
}

module.exports = postList;