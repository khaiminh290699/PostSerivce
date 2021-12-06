const Model = require(".");
const ModelSetting = require("./setting-model");
const ModelProgressing = require("./progressing-model")
const moment = require("moment");
const ModelStatisticBackLink = require("./statistic-backlink-model");

class ModelPost extends Model {
  tableName = "posts";

  list = async (mode, user_id, wheres, pageIndex, pageSize, order ) => {
    const query = this.query().joinRaw(`
      JOIN users ON users.id = posts.user_id
    `)
    .select(
      this.DB.raw(`
        COUNT(*) OVER(),
        posts.*,
        substring(regexp_replace(posts.content, E'<[^>]+>', '', 'gi') from 0 for 100) AS content,
        users.username
      `)
    )

    if (mode != "admin") {
      query.where("user_id", "=", user_id);
    }

    return await this.queryByCondition(query, wheres, pageIndex, pageSize, order);
  }

  getOne = async (post_id) => {
    const modelSetting = new ModelSetting(this.DB);
    const modelStatisticBackLink = new ModelStatisticBackLink(this.DB);
    const modelProgressing = new ModelProgressing(this.DB);

    const post = await this.findOne({ id: post_id });

    const settings = await modelSetting.listSettingsByPost(post_id);

    const forumSettings = await modelSetting.getListForumSettings(post_id);

    const timerSettings = await modelSetting.getListTimerSettings(post_id);

    const accountSettings = settings.map((setting) => {
      setting.timerSettings = timerSettings.filter((timerSetting) => timerSetting.setting_id === setting.setting_id);
      setting.forumSettings = forumSettings.filter((forumSetting) => forumSetting.setting_id === setting.setting_id)
      return setting;
    })

    const progressing = await modelProgressing.getOneByPost(post_id);
    const total_click = await modelStatisticBackLink.totalClickPost(post_id);

    return { post, accountSettings, progressing, total_click };
  }

  create = async (title, content, user_id, accounts, timerSettings, forumSettings) => {
    const modelProgressing = new ModelProgressing(this.DB, this.trx);
    const modelSetting = new ModelSetting(this.DB, this.trx);

    const post = await this.insertOne({ title, content, user_id });


    const settings = await modelSetting.addSettingsToPost(accounts.map((account_id) => ({ account_id, post_id: post.id })));
  
    forumSettings = forumSettings.map(({ forum_id, account_id }) => ({ forum_id, setting_id: settings.filter((setting) => setting.account_id === account_id)[0].id }));

    timerSettings = timerSettings.map(({ forum_id, account_id, timer_at, from_date, to_date }) => ({ 
      forum_id, 
      setting_id: settings.filter((setting) => setting.account_id === account_id)[0].id,
      timer_at: moment(timer_at).startOf("minute").format("HH:mm"),
      from_date: moment(from_date).startOf("date"),
      to_date: moment(to_date).endOf("date")
    }))
    
    if (forumSettings.length) {
      await modelSetting.createForumSettingsForSetting(forumSettings)
    }

    if (timerSettings.length) {
      await modelSetting.upsertTimerSettingsForSetting( post.id, timerSettings );
    }

    if (forumSettings.length) {
      const progressing = await modelProgressing.create(post.id, forumSettings);
      return { post, progressing }
    }

    return { post };
  }
}

module.exports = ModelPost;