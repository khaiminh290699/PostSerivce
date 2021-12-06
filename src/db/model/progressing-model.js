const Model = require(".");
const ModelPostingStatus = require("./posting-status-model")
const ModelProgressingPostStatus = require("./progressing-post-status-model");

class ModelProgressing extends Model {
  tableName = "progressings";

  getOne = async (id) => {
    return await this.findOne({ id })
  }

  create = async (post_id, forumSettings) => {
    const modelPosttingStatus = new ModelPostingStatus(this.DB, this.trx);
    const progressing = await this.insertOne({ post_id, total: forumSettings.length, done: 0, status: "waiting" });
    const postings = await modelPosttingStatus.createListPostingStatus(forumSettings);

    await this.addListPostingStatus(progressing.id, postings);

    return progressing;
  };

  addListPostingStatus = async (progressing_id, postings) => {
    const modelProgressingPostStatus = new ModelProgressingPostStatus(this.DB, this.trx);
    return await modelProgressingPostStatus.query().insert(
      postings.map(({ id: posting_status_id }) => ({ posting_status_id, progressing_id }))
    ).returning(["*"]);
  };

  getOneByPost = async (post_id) => {
    return this.query().where({ post_id }).where("status", "!=", "removed").first();
  }
}

module.exports = ModelProgressing;