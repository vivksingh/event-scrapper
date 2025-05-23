// scraper.js

import axios from "axios";
import * as cheerio from "cheerio";
import mongoose from "mongoose";
import { Event } from "./server.js";

const MONGO_URI = "mongodb+srv://vivksing655:amankijai@cluster0.gqhf0sq.mongodb.net/";

export default async function scrapeTimeoutSydney() {
  try {
    // db connection
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("Connected to MongoDB (scraper)");
    }

    const url = "https://www.timeout.com/sydney/things-to-do";
    const { data } = await axios.get(url);

    // testing html
    console.log("Fetched HTML length:", data.length);
    console.log("Preview of HTML content:\n", data.slice(0, 500)); // Preview HTML

    const $ = cheerio.load(data);

    const events = [];

    // event detail scraping 
    $(".xs-card, .card-content, article").each((_, el) => {
      const title = $(el).find("h3, .card-title").text().trim();
      const linkRaw = $(el).find("a").attr("href");
      const link = linkRaw?.startsWith("http")
        ? linkRaw
        : linkRaw
        ? `https://www.timeout.com${linkRaw}`
        : null;

      const date = "Date unknown";
      const venue = "Venue not specified";

      if (title && link) {
        events.push({ title, date, venue, link });
      }
    });

    console.log("✅ Extracted events:", events.length);

    // save to db
    for (const event of events) {
      const exists = await Event.findOne({
        title: event.title,
        date: event.date,
        venue: event.venue,
      });

      if (!exists) {
        await Event.create(event);
        console.log("🟢 Added:", event.title);
      } else {
        console.log("⚪ Already exists:", event.title);
      }
    }

    console.log("✅ Scraping complete.");
  } catch (error) {
    console.error("❌ Scraper error:", error.message);
  }
}
