const { ModelBackLink } = require("../db");

async function backlinkCreate(data, db) {
  const { link_url } = data.params;

  const modelBacklink = new ModelBackLink(db);
  
  const result = await modelBacklink.query().insert({
    link_url,
  }).onConflict(["link_url"]).ignore().returning(["*"]);

  return { status: 200, data: { backlink: result[0] } };
} 

module.exports = backlinkCreate;