import bodyParser from "body-parser";
import { serialize } from "bson";
import cors from "cors";
import express from "express";
import { MongoClient } from "mongodb";

let DATABASE_NAME = "wchen_final_project";

/* Do not modify or remove this line. It allows us to change the database for grading */
if (process.env.DATABASE_NAME) DATABASE_NAME = process.env.DATABASE_NAME;

const api = express.Router();
let conn = null;
let db = null;
let users = null;
let activities = null;
const MONGODB_URL = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017";
conn = await MongoClient.connect(MONGODB_URL);
const initAPI = async (app) => {
  app.set("json spaces", 2);
  app.use("/api", api);

  conn = await MongoClient.connect("mongodb://127.0.0.1:27017");
  db = conn.db(DATABASE_NAME);
  users = db.collection("users");
  activities = db.collection("activities");
};

api.use(bodyParser.json());
api.use(cors());

api.get("/", (req, res) => {
  res.json({ db: DATABASE_NAME });
});

api.use("/users/:id", async (req, res, next) => {
  let id = req.params.id;
  let user = await users.findOne({ id: id });
  if (!user) {
    res.status(404).json({ error: `No user with ID ${id}` });
    return;
  }
  res.locals.user = user;
  next();
});

api.get("/users/:id", (req, res) => {
  let user = res.locals.user;
  delete user._id;
  res.json(user);
});

api.post("/users", async (req, res) => {
  if (!req.body.id) {
    res.status(400).json({ error: `No ID given.` });
    return;
  }
  let id = req.body.id;
  let existingUser = await users.findOne({ id: id });
  if (existingUser) {
    res.status(400).json({ error: `User with ID ${id} already exists.` });
    return;
  }
  await users.insertOne({
    id: id,
    name: id,
    quote: "'Concentrate all your thoughts upon the work in hand.'",
  });
  let data = await users.findOne({ id: id });
  delete data._id;
  res.json(data);
});

api.patch("/users/:id", async (req, res) => {
  let user = res.locals.user;
  let update = req.body;
  let id = req.params.id;
  let name = update.name;
  let quote = update.quote;
  if (name === "") {
    user.name = id;
  } else if (name === undefined) {
    user.name = user.name;
  } else {
    user.name = name;
  }
  if (quote === "") {
    user.quote =
      "'Ordinary people think merely of spending time, great people think of using it.' --Arthur Schopenhauer";
  } else if (quote === undefined) {
    user.quote = user.quote;
  } else {
    user.quote = quote;
  }
  await users.replaceOne({ id: id }, user);
  delete user._id;
  res.json(user);
});

api.get("/users/:id/stats", async (req, res) => {
  let user = res.locals.user;
  let allActivities = await activities.find().toArray();
  let userActivities = allActivities.filter((a) => a.userId === req.params.id);
  res.json(userActivities);
});

api.post("/users/:id/activities", async (req, res) => {
  let user = res.locals.user;
  let text = req.body.text;
  let activity = await activities.findOne({
    $and: [{ activity: text }, { userId: req.params.id }],
  });
  if (activity) {
    let newTime = activity.time + 25;
    activities.updateOne(
      {
        $and: [{ activity: text }, { userId: req.params.id }],
      },
      { $set: { time: newTime } }
    );
  } else {
    await activities.insertOne({
      userId: req.params.id,
      time: 25,
      activity: text,
    });
  }
  res.json({ success: true });
});

api.delete("/users/:id", (req, res) => {
  activities.deleteMany({ userId: req.params.id });
  users.deleteOne({ id: req.params.id });
  res.json({ success: true });
});

/* Catch-all route to return a JSON error if endpoint not defined */
api.all("/*", (req, res) => {
  res.status(404).json({ error: `Not found: ${req.method} ${req.url}` });
});

export default initAPI;
