const Model = require(".");
const ModelSetting = require("./setting-model");
const moment = require("moment");

class ModelTimerStatus extends Model {
  tableName = "timer_status";

  listByDay = async (inDate, mode, user_id, wheres, pageIndex, pageSize, order) => {
    const modelSetting = new ModelSetting(this.DB);
    order.timer_setting = 1;

    const query = modelSetting.query()
      .select(
        modelSetting.DB.raw(`
          COUNT(*) OVER(),
          posts.title,
          posts.id AS post_id,
          settings.id AS setting_id,
          timer_setting.timer_at,
          accounts.username,
          accounts.password,
          webs.web_name,
          webs.web_url,
          webs.web_key,
          forums.id AS forum_id,
          forums.forum_name,
          forums.forum_url,
          COALESCE(posting_status.status, 'waiting') AS status,
          posting_status.updated_at AS actutal_posting_timer,
          posting_status.message,
          users.id AS user_id,
          users.username AS user_username,
          timer_setting.id AS timer_setting_id,
          forums.is_deleted AS forum_deleted,
          accounts.disable AS account_disable,
          posts.is_deleted AS post_delete
        `)
      )
      .joinRaw(`
        JOIN timer_setting ON ( timer_setting.setting_id = settings.id AND timer_setting.is_deleted = false )
        JOIN accounts ON ( accounts.id = settings.account_id )
        JOIN posts ON ( posts.id = settings.post_id )
        JOIN users ON ( users.id = posts.user_id )
        JOIN forums ON ( forums.id = timer_setting.forum_id )
        JOIN webs ON ( webs.id = forums.web_id AND webs.id = accounts.web_id )
      `)
      // .whereRaw(`
      //   accounts.disable = false
      //   AND posts.is_deleted = false
      // `)
  
    if (inDate) {
      query.joinRaw(`
        LEFT JOIN timer_status ON ( timer_status.timer_setting_id = timer_setting.id )
        LEFT JOIN posting_status ON ( 
          posting_status.id = timer_status.posting_status_id 
          AND posting_status.forum_id = forums.id
          AND posting_status.is_timer = true 
          AND posting_status.updated_at BETWEEN :from AND :to
        )
      `, { 
        from: moment(inDate).startOf("date"),
        to: moment(inDate).endOf("date")
      })
      
      query.whereRaw(`
        timer_setting.from_date <= :from
        AND timer_setting.to_date >= :from
        AND timer_setting.from_date <= :to
        AND timer_setting.to_date >= :to
      `, {
        from: moment(inDate).startOf("date"),
        to: moment(inDate).endOf("date")
      })
    } else {
  
      query.joinRaw(`
        LEFT JOIN posting_status ON ( 
          posting_status.setting_id = settings.id 
          AND posting_status.forum_id = forums.id AND posting_status.is_timer = true 
        )
      `)
  
    }
  
    if (mode != "admin") {
      query.whereRaw(`
        posts.user_id = :user_id
      `, { user_id })
    }
  
    return await modelSetting.queryByCondition(query, wheres, pageIndex, pageSize, order);
  }
}

module.exports = ModelTimerStatus;