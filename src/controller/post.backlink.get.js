const { ModelBackLink } = require("../db");

async function backlinkGet(data, db) {
  const { backlink_id } = data.params;

  const modelBackLink = new ModelBackLink(db);
  const backlink = await modelBackLink.findOne({ id: backlink_id });

  if (!backlink) {
    return { status: 404, message: "Backlink not found" }
  }

  return { status: 200, data: { backlink } }
}

module.exports = backlinkGet;