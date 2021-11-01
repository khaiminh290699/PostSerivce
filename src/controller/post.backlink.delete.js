const { ModelBackLink } = require("../db");

async function backlinkDelete(data, db) {
  const { ids } = data.params;
  const modelBackLink = new ModelBackLink(db);
  await modelBackLink.query().delete().whereIn("id", ids);
  return { status: 200, data: {} }
}

module.exports = backlinkDelete;