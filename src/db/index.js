const DB = require("./connect/db");
const Model = require("./model")
const ModelAccount = require("./model/account-model");
const ModelPost = require("./model/post-model");
const ModelSetting = require("./model/setting-model")
const ModelProgressing = require("./model/progressing-model");
const ModelPostForum = require("./model/post-forum-model")
const ModelPostingStatus = require("./model/posting-status-model");
const ModelTimerSetting = require("./model/timer-setting-model");
const ModelForumSetting = require("./model/forum-setting-model");

module.exports = {
  DB,
  Model,
  ModelAccount,
  ModelPost,
  ModelSetting,
  ModelPostForum,
  ModelProgressing,
  ModelPostingStatus,
  ModelTimerSetting,
  ModelForumSetting
}