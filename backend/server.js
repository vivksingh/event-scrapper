// server.js

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import cron from "node-cron";
import scrapeTimeoutSydney from "./scraper.js";

const app = express();
const PORT = 5000;
const MONGO_URI = "mongodb+srv://vivksing655:amankijai@cluster0.gqhf0sq.mongodb.net/";

app.use(cors());
app.use(bodyParser.json());

// Connect to MongoDB
mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("Connected to MongoDB");
}).catch((err) => {
  console.error("MongoDB connection error:", err);
});

// Event schema
const eventSchema = new mongoose.Schema({
  title: String,
  date: String,
  venue: String,
  link: String,
});

const Event = mongoose.model("Event", eventSchema);

// Subscription schema (only email)
const subscriptionSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now },
});

const Subscription = mongoose.model("Subscription", subscriptionSchema);

// all events
app.get("/api/events", async (req, res) => {
  try {
    const events = await Event.find();
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch events" });
  }
});

// testing 
app.post("/api/events", async (req, res) => {
  const { title, date, venue, link } = req.body;
  if (!title || !date || !venue || !link) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    const exists = await Event.findOne({ title, date, venue });
    if (exists) {
      return res.status(200).json({ message: "Event already exists" });
    }
    const newEvent = new Event({ title, date, venue, link });
    await newEvent.save();
    res.status(201).json(newEvent);
  } catch (err) {
    res.status(500).json({ error: "Failed to save event" });
  }
});

// Subscribe route
app.post("/api/subscribe", async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    const existing = await Subscription.findOne({ email });

    if (existing) {
      return res.status(200).json({ message: "Email already subscribed", exists: true });
    }

    const newSub = new Subscription({ email });
    await newSub.save();

    res.status(201).json({ message: "Subscription successful", exists: false });
  } catch (err) {
    console.error("Subscription error:", err);
    res.status(500).json({ error: "Failed to subscribe" });
  }
});

// scraper evry 10 mins
cron.schedule("*/2 * * * *", async () => {
  console.log("Running scheduled scraper...");
  await scrapeTimeoutSydney();
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

export { Event };
