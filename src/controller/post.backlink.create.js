const { ModelBackLink } = require("../db");

async function backlinkCreate(data, db) {
  const { link_url } = data.params;

  const modelBacklink = new ModelBackLink(db);
  
  const result = await modelBacklink.create(link_url);

  return { status: 200, data: { backlink: result[0] } };
} 

module.exports = backlinkCreate;