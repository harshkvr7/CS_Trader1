import pkg from "pg";
const { Client } = pkg;
import dotenv from "dotenv";
dotenv.config();

const db = new Client({
    user: process.env.DATABASE_USER,
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE_NAME,
    password: process.env.DATABASE_PASSWORD,
    port: process.env.DATABASE_PORT,
});

db.connect()
    .then(() => console.log("Connected to database"))
    .catch((err) => console.error("Database connection error", err));

export default db;
