const DB = require("./connect/db");
const Model = require("./model")
const AccountModel = require("./model/account-model");
const ContentModel = require("./model/content-model");
const PostModel = require("./model/post-model");
const SettingModel = require("./model/setting-model")
const PostForumModel = require("./model/post-forum-model");
const ProgressingModel = require("./model/progressing-model")
const PostingStatusModel = require("./model/posting-status-model");
const TimerSettingModel = require("./model/timer-setting-model");

module.exports = {
  DB,
  Model,
  AccountModel,
  PostModel,
  ContentModel,
  SettingModel,
  PostForumModel,
  ProgressingModel,
  PostingStatusModel,
  TimerSettingModel
}