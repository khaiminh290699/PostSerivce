const postGet = require("./post.get");
const postList = require("./post.list");
const postCreate = require("./post.create");
const postToggle = require("./post.toggle");
const postUpdate = require("./post.update");
const progressingGet = require("./post.progressing.get");
const porgressingCancel = require("./post.progressing.cancel")
const reprogress = require("./post.progressing.reprogress");
const timerList = require("./post.timer.list");

const backlinkCreate = require("./post.backlink.create");
const backlinkDelete = require("./post.backlink.delete");
const backlinkGet = require("./post.backlink.get");


module.exports = {
  postGet,
  postList,
  postCreate,
  postUpdate,
  postToggle,
  progressingGet,
  porgressingCancel,
  reprogress,
  timerList,
  backlinkGet,
  backlinkDelete,
  backlinkCreate
}