const Model = require(".");

class ModelBackLink extends Model {
  tableName = "backlinks";

  create = async (link_url) => {
    return await this.query().insert({ link_url }).onConflict(["link_url"]).ignore().returning(["*"]);
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