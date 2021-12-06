const Model = require(".");

class ModelPostingStatus extends Model {
  tableName = "posting_status";

  createListPostingStatus = async (forumSettings) => {
    console.log(forumSettings)
    return await this.query().insert(
      forumSettings.map((forumSetting) => ({ setting_id: forumSetting.setting_id, forum_id: forumSetting.forum_id }))
    ).returning(["*"]);
  }

  listInProgressing = async (progressing_id) => {
    return this.query().where({ progressing_id })
    .select(
      this.DB.raw(`
        posting_status.id,
        posting_status.status,
        posting_status.message,
        accounts.username,
        accounts.password,
        webs.web_name,
        webs.web_url,
        webs.web_key,
        forums.id AS forum_id,
        forums.forum_name,
        forums.forum_url
      `)
    )
    .joinRaw(`
      JOIN progressing_post_status ON ( progressing_post_status.posting_status_id = posting_status.id )
      JOIN forums ON ( forums.id = posting_status.forum_id )
      JOIN settings ON ( settings.id = posting_status.setting_id )
      JOIN accounts ON ( accounts.id = settings.account_id )
      JOIN webs ON ( webs.id = accounts.web_id AND webs.id = forums.web_id )
    `)
    .orderByRaw(`
      webs.id,
      forums.id,
      accounts.id
    `)

  }
}

module.exports = ModelPostingStatus;