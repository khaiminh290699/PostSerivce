const Model = require(".");

class ModelStatisticBackLink extends Model {
  tableName = "statistic_backlink";

  create = async (backlink_id, post_id, forum_id, setting_id, timer_at) => {
    return await this.insertOne({ backlink_id, post_id, forum_id, setting_id, timer_at })
  }

  totalClickPost = async (post_id) => {
    const { total_click } = await this.query()
    .select(
      this.DB.raw(`
        COUNT(*) AS total_click
      `)
    )
    .where({
      post_id
    })
    .first() || { total_click: 0 }

    return total_click;
  }
}

module.exports = ModelStatisticBackLink;