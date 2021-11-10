const { Kafka, Rabbitmq } = require("./src/ultilities");
const { postCreate, postList, progressingGet, reprogress, timerList, postToggle, porgressingCancel, postGet, backlinkCreate, backlinkDelete, backlinkGet, postUpdate } = require("./src/controller");
const kafka = new Kafka();
const rabbitmq = new Rabbitmq();

kafka.consume("post.get", { groupId: "post.get" }, postGet);

kafka.consume("post.list", { groupId: "post.list" }, postList);

kafka.consume("post.create", { groupId: "post.create" }, async (data, db) => { return await postCreate(data, db, rabbitmq) })

kafka.consume("post.update", { groupId: "post.update" }, postUpdate)

kafka.consume("post.toggle", { groupId: "post.toggle" }, postToggle);

kafka.consume("post.progressing.get", { groupId: "post.progressing.get" }, progressingGet)

kafka.consume("post.progressing.reprogress", { groupId: "post.progressing.reprogress" }, async (data, db) => { return await reprogress(data, db, rabbitmq) })

kafka.consume("post.list.timer", { groupId: "post.list.timer" }, timerList)

kafka.consume("post.progressing.cancel", { groupId: "post.progressing.cancel" }, porgressingCancel)

kafka.consume("post.backlink.create", { groupId: "post.backlink.create" }, backlinkCreate);

kafka.consume("post.backlink.delete", { groupId: "post.backlink.delete" }, backlinkDelete)

kafka.consume("post.backlink.get", { groupId: "post.backlink.get" }, backlinkGet)