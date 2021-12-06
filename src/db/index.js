const DB = require("./connect/db");
const Model = require("./model")
const ModelAccount = require("./model/account-model");
const ModelPost = require("./model/post-model");
const ModelSetting = require("./model/setting-model")
const ModelProgressing = require("./model/progressing-model");
const ModelPostingStatus = require("./model/posting-status-model");
const ModelTimerSetting = require("./model/timer-setting-model");
const ModelForumSetting = require("./model/forum-setting-model");
const ModelBackLink = require("./model/backlink-model");
const ModelStatisticBackLink = require("./model/statistic-backlink-model");
const ModelProgressingPostStatus = require("./model/progressing-post-status-model");
const ModelTimerStatus = require("./model/timer-status-model");

module.exports = {
  DB,
  Model,
  ModelAccount,
  ModelPost,
  ModelSetting,
  ModelProgressing,
  ModelPostingStatus,
  ModelTimerSetting,
  ModelForumSetting,
  ModelBackLink,
  ModelStatisticBackLink,
  ModelProgressingPostStatus,
  ModelTimerStatus
}