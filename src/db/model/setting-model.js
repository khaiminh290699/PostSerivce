const Model = require(".");
const ModelForumSetting = require("./forum-setting-model")
const ModelTimerSetting = require("./timer-setting-model")

class ModelSetting extends Model {
  tableName = "settings";

  addSettingsToPost = async (settings) => {
    return await this.query().insert(settings).onConflict(["id"]).ignore().returning(["*"]);
  }

  createForumSettingsForSetting = async (forumSettings) => {
    const modelForumSetting = new ModelForumSetting(this.DB, this.trx);
    return await modelForumSetting.query().insert(forumSettings).returning(["id"]);
  }

  upsertTimerSettingsForSetting = async (post_id, timerSettings) => {
    const modelTimerSetting = new ModelTimerSetting(this.DB, this.trx);

    const settings = await this.query().where({ post_id });

    const updates = timerSettings.filter((timerSetting) => timerSetting.id);
    const inserts = timerSettings.filter((timerSetting) => !timerSetting.id);

    await modelTimerSetting.query().update({ is_deleted: true })
      .whereNotIn("id", updates.map((timerSetting) => timerSetting.id))
      .whereIn("setting_id", settings.map((setting) => setting.id));

    if (updates.length) {
      await modelTimerSetting.query().insert(updates).onConflict(["id"]).merge();
    }

    if (inserts.length) {
      await modelTimerSetting.query().insert(inserts);
    }
  }

  listSettingsByPost = async (post_id) => {
    return await this.query()
    .select(
      this.DB.raw(`
        settings.id AS setting_id,
        accounts.id AS account_id,
        accounts.username,
        accounts.password,
        accounts.disable,
        webs.web_name,
        webs.web_url,
        webs.web_key,
        webs.id AS web_id
      `)
    )
    .join("accounts", "accounts.id", "settings.account_id")
    .join("webs", "webs.id", "accounts.web_id")
    .where({ post_id });
  }

  getListForumSettings = async (post_id) => {
    const modelForumSetting = new ModelForumSetting(this.DB);
    return await modelForumSetting.query()
    .select(
      modelForumSetting.DB.raw(`
        forum_setting.*,
        webs.id AS web_id,
        webs.web_url,
        webs.web_key,
        webs.web_name,
        forums.forum_name,
        forums.forum_url
      `)
    )
    .join("forums", "forums.id", "forum_setting.forum_id")
    .join("webs", "webs.id", "forums.web_id")
    .join("settings", "settings.id", "forum_setting.setting_id")
    .whereRaw(`
      settings.post_id = :post_id
      AND forums.is_deleted = false
    `, { post_id });
  }

  getListTimerSettings = async (post_id) => {
    const modelTimerSetting = new ModelTimerSetting(this.DB);
    return await modelTimerSetting.query()
      .select(
        modelTimerSetting.DB.raw(`
          timer_setting.*,
          forum_name,
          forum_url,
          web_name,
          web_url
        `)
      )
      .join("forums", "forums.id", "timer_setting.forum_id")
      .join("webs", "webs.id", "forums.web_id")
      .join("settings", "settings.id", "timer_setting.setting_id")
      .whereRaw(`
        settings.post_id = :post_id
        AND forums.is_deleted = false
      `, { post_id })
      .whereRaw(`timer_setting.is_deleted = false`);
  }
}

module.exports = ModelSetting;