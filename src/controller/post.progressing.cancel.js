const { ModelProgressing } = require("../db");

async function porgressingCancel(data, db) {
  const { progressing_id } = data.params;

  const modelProgressing = new ModelProgressing(db);

  let progressing = await modelProgressing.findOne({ id: progressing_id });
  progressing.status = "fail";
  progressing = await modelProgressing.updateOne(progressing);
  
  return { status: 200, data: { progressing } };
}

module.exports = porgressingCancel;