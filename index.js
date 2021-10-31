const { Kafka, Rabbitmq } = require("./src/ultilities");
const { postCreate, postList, progressingGet, reprogress, timerList, postToggle, porgressingCancel, postGet } = require("./src/controller");

const kafka = new Kafka();
const rabbitmq = new Rabbitmq();

kafka.consume("post.get", { groupId: "post.get" }, postGet);

kafka.consume("post.list", { groupId: "post.list" }, postList);

kafka.consume("post.create", { groupId: "post.create" }, async (data, db) => { return await postCreate(data, db, rabbitmq) })

kafka.consume("post.toggle", { groupId: "post.toggle" }, postToggle);

kafka.consume("post.progressing.get", { groupId: "post.progressing.get" }, progressingGet)

kafka.consume("post.progressing.reprogress", { groupId: "post.progressing.reprogress" }, async (data, db) => { return await reprogress(data, db, rabbitmq) })

kafka.consume("post.list.timer", { groupId: "post.list.timer" }, timerList)

kafka.consume("post.progressing.cancel", { groupId: "post.progressing.cancel" }, porgressingCancel)