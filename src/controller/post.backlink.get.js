const { ModelBackLink, ModelStatisticBackLink } = require("../db");

async function backlinkGet(data, db) {
  const { backlink_id, post_id, forum_id, setting_id, timer_at } = data.params;

  const modelBackLink = new ModelBackLink(db);
  const modelStatisticBackLink = new ModelStatisticBackLink(db);

  const backlink = await modelBackLink.getOne(backlink_id)
  await modelStatisticBackLink.create(backlink_id, post_id, forum_id, setting_id, timer_at);

  return { status: 200, data: { backlink } }
}

module.exports = backlinkGet;