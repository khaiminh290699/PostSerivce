const { ModelProgressing, ModelPost } = require("../db");

async function reprogress(data, db, rabbitmq) {
  const { id } = data.params;
  const modelPost = new ModelPost(db);

  const modelProgressing = new ModelProgressing(db);

  let progressing = await modelProgressing.findOne({ id });

  const post = await modelPost.findOne({ id: progressing.post_id })
  if (post.is_deleted) {
    return { status: 400, message: "Post was delete" }
  }

  if (progressing.status === "waiting" || progressing.status === "progressing" || progressing.status === "removed") {
    return { status: 400, message: `Progressing is ${progressing.status}` }
  }

  progressing.status = "waiting";
  progressing = await modelProgressing.updateOne(progressing);

  await rabbitmq.produce({ progressing }, { exchange: "background", queue: "create_post" })

  return { status: 200, data: { progressing } };
}

module.exports = reprogress;