const { ModelTimerStatus } = require("../db");

async function timerList(data, db) {
  const { inDate, wheres = [], pageIndex, pageSize, order = { "timer_at": -1 }, mode } = data.params;
  const { id: user_id, isAdmin } = data.meta.user
  const modelTimerStatus = new ModelTimerStatus(db);

  if (mode === "admin" && !isAdmin) {
    return { status: 403, message: "Not permission" }
  }

  const timerPosts = await modelTimerStatus.listByDay(inDate, mode, user_id, wheres, pageIndex, pageSize, order);
  const totalCount = timerPosts[0] ? +timerPosts[0].count : 0;

  return { status: 200, data: { timerPosts, totalCount } };
}

module.exports = timerList;