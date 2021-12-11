const Model = require(".");

class ModelBackLink extends Model {
  tableName = "backlinks";

  create = async (link_url) => {
    const backlink = await this.findOne({ link_url });
    if (backlink) {
      return backlink;
    }
    return await this.insertOne({ link_url });
  }

  getOne = async (backlink_id) => {
    const backlink = await this.findOne({ id: backlink_id });

    if (!backlink) {
      return { status: 404, message: "Backlink not found" }
    }

    return backlink;
  }
}

module.exports = ModelBackLink;