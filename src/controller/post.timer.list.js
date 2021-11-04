const { ModelSetting } = require("../db");
const moment = require("moment");

async function timerList(data, db) {
  const { inDate, wheres = [], pageIndex, pageSize, order = {}, mode } = data.params;
  const { id: user_id, isAdmin } = data.meta.user
  const modelSetting = new ModelSetting(db);

  if (mode === "admin" && !isAdmin) {
    return { status: 403, message: "Not permission" }
  }

  
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
        users.username AS user_username
      `)
    )
    .joinRaw(`
      JOIN forum_setting ON ( forum_setting.setting_id = settings.id AND forum_setting.is_deleted = false )
      JOIN timer_setting ON ( timer_setting.setting_id = settings.id AND timer_setting.is_deleted = false )
      JOIN accounts ON ( accounts.id = settings.account_id )
      JOIN posts ON ( posts.id = settings.post_id )
      JOIN users ON ( users.id = posts.user_id )
      JOIN forums ON ( forums.id = forum_setting.forum_id )
      JOIN webs ON ( webs.id = forums.web_id AND webs.id = accounts.web_id )
    `)
    .whereRaw(`
      accounts.disable = false
      AND posts.is_deleted = false
    `)

  if (inDate) {
    query.joinRaw(`
      LEFT JOIN posting_status ON ( 
        posting_status.setting_id = settings.id 
        AND posting_status.forum_id = forums.id AND posting_status.is_timer = true 
        AND posting_status.updated_at BETWEEN :from AND :to
      )
    `, { 
      from: moment(inDate).startOf("date"),
      to: moment(inDate).endOf("date")
    })
    
    // query.whereRaw(`
    //   timer_setting.from_date <= :from
    //   AND timer_setting.to_date >= :from
    //   AND timer_setting.from_date <= :to
    //   AND timer_setting.to_date >= :to
    // `, {
    //   from: moment(inDate).startOf("date"),
    //   to: moment(inDate).endOf("date")
    // })
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

  const timerPosts = await modelSetting.queryByCondition(query, wheres, pageIndex, pageSize, order);
  const totalCount = timerPosts[0] ? +timerPosts[0].count : 0;
  return { status: 200, data: { timerPosts, totalCount } };
}

module.exports = timerList;