const { ModelBackLink, ModelStatisticBackLink } = require("../db");

async function backlinkGet(data, db) {
  const { backlink_id, post_id, forum_id, setting_id, timer_at } = data.params;

  const modelBackLink = new ModelBackLink(db);
  const modelStatisticBackLink = new ModelStatisticBackLink(db);

  const backlink = await modelBackLink.findOne({ id: backlink_id });

  if (!backlink) {
    return { status: 404, message: "Backlink not found" }
  }

  await modelStatisticBackLink.insertOne({
    backlink_id, post_id, forum_id, setting_id, timer_at
  })

  return { status: 200, data: { backlink } }
}

module.exports = backlinkGet;