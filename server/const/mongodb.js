require("dotenv").config();

export const MONGO_URL = `mongodb+srv://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@cluster0.3srote2.mongodb.net`;