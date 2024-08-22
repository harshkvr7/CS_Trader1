import express from "express";
import bodyparser from "body-parser";
import session from "express-session";
import pg from "pg";
import passport from "passport";
import env from "dotenv";
import SteamStrategy from "passport-steam";
import Razorpay from "razorpay";
import crypto from "crypto";
import skinimages from "./skins.json" assert { type: "json" };
import axios from "axios";
import SteamBot from "./bot.js";
import SteamTotp from "steam-totp";
import http from "http";
import { Server } from "socket.io";

// Load environment variables
env.config();

const bot = new SteamBot({
    accountName: process.env.STEAM_ACCOUNT_NAME,
    password: process.env.STEAM_PASSWORD,
    twoFactorCode: SteamTotp.generateAuthCode(process.env.STEAM_SHARED_SECRET)
});

const app = express();
const port = process.env.PORT || 3000;

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: false,
        saveUninitialized: true,
    })
);

app.use(express.json());
app.use(express.static("public"));
app.use(bodyparser.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());

const db = new pg.Client({
    user: process.env.DATABASE_USER,
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE_NAME,
    password: process.env.DATABASE_PASSWORD,
    port: process.env.DATABASE_PORT,
});
db.connect();

app.get("/", async (req, res) => {
    if (req.isAuthenticated()) {
        const userDetails = await db.query("SELECT * FROM users WHERE s_id = $1", [req.user.s_id]);
        const inv = await bot.getInventory();

        const skinpricesdata = await axios.get("https://raw.githubusercontent.com/ByMykel/counter-strike-price-tracker/main/static/prices/latest.json");
        const skinprices = skinpricesdata.data;

        const sortCriteria = req.query.sortCriteria || 0;

        if (sortCriteria) {
            switch (sortCriteria) {
                case 'priceAsc':
                    inv.sort((a, b) => {
                        const priceA = skinprices[a.market_hash_name]?.steam.last_24h || 0;
                        const priceB = skinprices[b.market_hash_name]?.steam.last_24h || 0;
                        return priceA - priceB;
                    });
                    break;
                case 'priceDesc':
                    inv.sort((a, b) => {
                        const priceA = skinprices[a.market_hash_name]?.steam.last_24h || 0;
                        const priceB = skinprices[b.market_hash_name]?.steam.last_24h || 0;
                        return priceB - priceA;
                    });
                    break;
                default:
                    break;
            }
        }

        res.render("market.ejs", { userData: userDetails.rows[0], myskins: inv, skinimg: skinimages, skinprices: skinprices });
    } else {
        res.redirect("/login");
    }
});

app.get("/withdraw", async (req, res) => {
    if (req.isAuthenticated()) {
        const asset_id = req.query.assetid;
        console.log(asset_id);

        const skinpricesdata = await axios.get("https://raw.githubusercontent.com/ByMykel/counter-strike-price-tracker/main/static/prices/latest.json");
        const skinprices = skinpricesdata.data;

        const userDetails = await db.query("SELECT * FROM users WHERE s_id = $1", [req.user.s_id]);
        const inv = await bot.getInventory();

        const item = inv.find(item => item.assetid === asset_id);

        if (item) {
            const item_price = ((skinprices[item.market_hash_name].steam.last_24h) * 91).toFixed(2);

            if (item_price < userDetails.rows[0].balance / 100) {
                bot.sendWithdrawTrade(req.user.s_id, item, (err, tradelink) => {
                    if (err) {
                        console.log("Error sending trade:", err);
                        res.render("transfer.ejs", { userData: userDetails.rows[0], message: "Error sending trade" });
                    } else {
                        db.query("UPDATE users SET balance = balance - $1 WHERE s_id = $2", [item_price * 100, req.user.s_id]);
                        res.render("transfer.ejs", { userData: userDetails.rows[0], message: "Accept the trade using steam app or the link below", tradelink: tradelink });
                    }
                });
            } else {
                console.log("Insufficient balance");
                res.render("transfer.ejs", { userData: userDetails.rows[0], message: "Insufficient balance" });
            }
        } else {
            console.log("Item not available");
            res.render("transfer.ejs", { userData: userDetails.rows[0], message: "Item not available" });
        }
    } else {
        res.redirect("/login");
    }
});

app.get("/sell", async (req, res) => {
    if (req.isAuthenticated()) {
        const userDetails = await db.query("SELECT * FROM users WHERE s_id = $1", [req.user.s_id]);
        const inv = await bot.getPartnerInventory(req.user.s_id);

        const skinpricesdata = await axios.get("https://raw.githubusercontent.com/ByMykel/counter-strike-price-tracker/main/static/prices/latest.json");
        const skinprices = skinpricesdata.data;

        const sortCriteria = req.query.sortCriteria || 0;

        if (sortCriteria) {
            switch (sortCriteria) {
                case 'priceAsc':
                    inv.sort((a, b) => {
                        const priceA = skinprices[a.market_hash_name]?.steam.last_24h || 0;
                        const priceB = skinprices[b.market_hash_name]?.steam.last_24h || 0;
                        return priceA - priceB;
                    });
                    break;
                case 'priceDesc':
                    inv.sort((a, b) => {
                        const priceA = skinprices[a.market_hash_name]?.steam.last_24h || 0;
                        const priceB = skinprices[b.market_hash_name]?.steam.last_24h || 0;
                        return priceB - priceA;
                    });
                    break;
                default:
                    break;
            }
        }

        res.render("sell.ejs", { userData: userDetails.rows[0], myskins: inv, skinimg: skinimages, skinprices: skinprices });
    } else {
        res.redirect("/login");
    }
});

app.get("/deposit", async (req, res) => {
    if (req.isAuthenticated()) {
        const asset_id = req.query.assetid;

        const skinpricesdata = await axios.get("https://raw.githubusercontent.com/ByMykel/counter-strike-price-tracker/main/static/prices/latest.json");
        const skinprices = skinpricesdata.data;

        const userDetails = await db.query("SELECT * FROM users WHERE s_id = $1", [req.user.s_id]);
        const inv = await bot.getPartnerInventory(req.user.s_id);

        const item = inv.find(item => item.assetid === asset_id);

        if (item) {
            const item_price = ((skinprices[item.market_hash_name].steam.last_24h) * 91).toFixed(2);

            bot.sendDepositTrade(req.user.s_id, item, (err, tradelink) => {
                if (err) {
                    console.log("Error sending trade:", err);
                    res.render("transfer.ejs", { userData: userDetails.rows[0], message: "Error sending trade" });
                } else {
                    db.query("UPDATE users SET balance = balance + $1 WHERE s_id = $2", [item_price * 100, req.user.s_id]);
                    res.render("transfer.ejs", { userData: userDetails.rows[0], message: "Accept the trade using steam app or the link below", tradelink: tradelink });
                }
            });
        } else {
            console.log("Item not available");
            res.render("transfer.ejs", { userData: userDetails.rows[0], message: "Item not available" });
        }
    } else {
        res.redirect("/login");
    }
});

app.get("/login", (req, res) => {
    res.render("login.ejs");
});

app.get("/auth-steam", passport.authenticate("steam", {
    scope: ["profile", "id"],
}));

app.get("/auth/steam/return",
    passport.authenticate("steam", {
        successRedirect: "/",
        failureRedirect: "/login",
    })
);

app.get("/addbalance", async (req, res) => {
    if (req.isAuthenticated()) {
        const userDetails = await db.query("SELECT * FROM users WHERE s_id = $1", [req.user.s_id]);
        res.render("amount.ejs", { userData: userDetails.rows[0] });
    } else {
        res.redirect("/login");
    }
});

app.get("/checkout", async (req, res) => {
    if (req.isAuthenticated()) {
        const amountejs = req.query.amount;
        const userDetails = await db.query("SELECT * FROM users WHERE s_id = $1", [req.user.s_id]);
        res.render("payments.ejs", { userData: userDetails.rows[0], amountejs: amountejs });
    } else {
        res.redirect("/login");
    }
});

app.post("/create/orderId", (req, res) => {
    const options = {
        amount: req.body.amount,
        currency: "INR",
        receipt: "rcptid_11"
    };
    razorpayInstance.orders.create(options, function (err, order) {
        res.send({ orderId: order.id });
    });
});

app.post("/api/payment/verify", async (req, res) => {
    const razorpayInstance = new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET
    });

    const body = req.body.response.razorpay_order_id + "|" + req.body.response.razorpay_payment_id;
    const expected_sign = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET).update(body.toString()).digest('hex');

    console.log("sig rec :" + req.body.response.razorpay_signature);
    console.log("expected sig :" + expected_sign);

    let response = { "signatureIsValid": "false" };

    if (expected_sign === req.body.response.razorpay_signature) {
        response = { "signatureIsValid": "true" };
        const moneytoadd = await razorpayInstance.payments.fetch(req.body.response.razorpay_payment_id);
        await db.query("UPDATE users SET balance = balance + $1 WHERE s_id = $2", [moneytoadd.amount, req.user.s_id]);
    }

    res.send(response);
});

app.get("/logout", (req, res) => {
    req.logout(function (err) {
        if (err) {
            return next(err);
        }
        res.redirect("/");
    });
});

passport.use("steam",
    new SteamStrategy(
        {
            returnURL: `${process.env.STEAM_RETURN_URL}/auth/steam/return`,
            realm: process.env.STEAM_REALM,
            apiKey: process.env.STEAM_API_KEY
        },
        async (identifier, profile, done) => {
            try {
                console.log(profile.id);

                const result = await db.query("SELECT * FROM users WHERE s_id = $1", [profile.id]);

                if (result.rows.length == 0) {
                    const newUser = await db.query("INSERT INTO users(s_id, name, pfp) VALUES ($1, $2, $3)", [profile.id, profile.displayName, profile.photos[1].value]);
                    return done(null, newUser.rows[0]);
                } else {
                    return done(null, result.rows[0]);
                }
            } catch (error) {
                return done(error);
            }
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user);
});

passport.deserializeUser((user, done) => {
    done(null, user);
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
