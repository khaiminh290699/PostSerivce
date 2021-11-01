const { ModelBackLink } = require("../db");

async function backlinkCreate(data, db) {
  const { web_host, link_url } = data.params;

  const modelBacklink = new ModelBackLink(db);
  
  const backlink = await modelBacklink.insertOne({
    link_url,
    backlink_url: `${web_host}`
  })

  backlink.backlink_url = `${web_host}/${backlink.id}/:post_id/:forum_id/:account_id`
  await modelBacklink.updateOne(backlink);
  

  return { status: 200, data: { backlink } };
} 

module.exports = backlinkCreate;