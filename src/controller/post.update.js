const { ModelSetting, ModelTimerSetting, ModelForumSetting, ModelPost } = require("../db");
const moment = require("moment");

async function postUpdate(data, db) {
  const { post, accountSettings } = data.params;

  const modelPost = new ModelPost(db);
  const modelSetting = new ModelSetting(db);
  const modelTimerSetting = new ModelTimerSetting(db);
  const modelForumSetting = new ModelForumSetting(db);

  await modelPost.query().update(post).where({ id: post });

  const updateSettings = accountSettings.filter((accountSetting) => accountSetting.setting_id ? true : false);

  const createSettings = accountSettings.filter((accountSetting) => !accountSetting.setting_id)
  
  if (updateSettings.length) {
    const timerSettings = updateSettings.reduce((result, updateSetting) => {
      result.push(
        ...updateSetting.timerSettings.map((timerSetting) => {
          return {
            ...timerSetting,
            setting_id: updateSetting.setting_id
          }
        }),
      );
      return result;
    }, [])

    await modelTimerSetting.query().update({
      is_deleted: true
    })
    .whereNotIn("id", timerSettings.filter((timerSetting) => timerSetting.id).map((timerSetting) => timerSetting.id))
    .whereIn("setting_id", updateSettings.map((updateSetting) => updateSetting.setting_id))

    await modelTimerSetting.query().insert(
      timerSettings.map((timerSetting) => {
        return {
          id: timerSetting.id,
          setting_id: timerSetting.setting_id,
          timer_at: moment(timerSetting.timer_at).isValid() ? moment(timerSetting.timer_at).format("HH:mm") : timerSetting.timer_at,
          from_date: timerSetting.from_date,
          to_date: timerSetting.to_date
        }
      })
    ).onConflict(["id"]).merge();
  }

  console.log(createSettings)

  if (createSettings.length) {
    const newSettings = await modelSetting.query().insert(
      createSettings.map((createSetting) => {
        console.log(createSetting)
        return {
          account_id: createSetting.account_id,
          post_id: post.id,
          is_create_only: createSettings.is_create_only
        }
      })
    ).returning(["*"])

    const timerSettings = createSettings.reduce((list, setting) => {
      if (setting.timerSettings) {
        list.push(...setting.timerSettings.map(timer => ({ ...timer, account_id: setting.account_id })));
      } 
      return list
    }, [])
  
    const forumSettings = createSettings.reduce((list, setting) => {
      if (setting.forumSettings) {
        list.push(...setting.forumSettings.map(forum => ({ forum_id: forum.forum_id, account_id: setting.account_id })));
      } 
      return list
    }, [])

    if (timerSettings.length) {
      await modelTimerSetting.query().insert(timerSettings.map(timerSetting => {
        const setting = newSettings.filter((setting) => setting.account_id === timerSetting.account_id)[0];
        return {
          setting_id: setting.id,
          timer_at: moment(timerSetting.timer_at).isValid() ? moment(timerSetting.timer_at).startOf("minute").format("HH:mm") : timerSetting.timer_at,
          from_date: moment(timerSetting.from_date).startOf("date"),
          to_date: moment(timerSetting.to_date).endOf("date")
        }
      }))
    }

    if (forumSettings.length) {
      await modelForumSetting.query().insert(forumSettings.map(forumSetting => {
        const setting = newSettings.filter((setting) => setting.account_id === forumSetting.account_id)[0];
        return {
          setting_id: setting.id,
          forum_id: forumSetting.forum_id
        }
      }))
    }
  }
  
  return { status: 200 }
}

module.exports = postUpdate;