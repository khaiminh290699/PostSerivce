const { ProgressingModel, PostModel } = require("../db");

async function reprogress(data, db, rabbitmq) {
  const { id } = data.params;
  const postModel = new PostModel(db);

  const progressingModel = new ProgressingModel(db);

  let progressing = await progressingModel.findOne({ id });

  const post = await postModel.findOne({ id: progressing.post_id })
  if (post.is_deleted) {
    return { status: 400, message: "Post was delete" }
  }

  if (progressing.status === "waiting" || progressing.status === "progressing" || progressing.status === "removed") {
    return { status: 400, message: `Progressing is ${progressing.status}` }
  }

  progressing.status = "waiting";
  progressing = await progressingModel.updateOne(progressing);

  await rabbitmq.produce({ progressing }, { exchange: "background", queue: "create_post" })

  return { status: 200, data: { progressing } };
}

module.exports = reprogress;