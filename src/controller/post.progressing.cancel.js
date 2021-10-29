const { ProgressingModel } = require("../db");

async function porgressingCancel(data, db) {
  const { progressing_id } = data.params;

  const progressingModel = new ProgressingModel(db);

  let progressing = await progressingModel.findOne({ id: progressing_id });
  progressing.status = "fail";
  progressing = await progressingModel.updateOne(progressing);
  
  return { status: 200, data: { progressing } };
}

module.exports = porgressingCancel;