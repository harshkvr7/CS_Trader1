import db from "../config/database.js";
import botService from "../services/steamBotService.js";
import axios from "axios";
import skinImages from "./skins.json" assert { type: "json" };

export const getMarketPage = async (req, res) => {
    try {
        if (!req.isAuthenticated || !req.isAuthenticated()) {
            return res.redirect("/auth/login");
        }

        const userDetails = await db.query("SELECT * FROM users WHERE s_id = $1", [req.user.s_id]);
        const inventory = await botService.getInventory();
        const skinPricesResponse = await axios.get("https://raw.githubusercontent.com/ByMykel/counter-strike-price-tracker/main/static/prices/latest.json");
        const skinPrices = skinPricesResponse.data;

        res.render("market.ejs", {
            userData: userDetails.rows[0],
            myskins: inventory,
            skinprices: skinPrices,
            skinimg: skinImages
        });
    } catch (error) {
        console.error("Error in getMarketPage:", error);
        res.status(500).send("Error loading market page");
    }
};

export const withdrawItem = async (req, res) => {
    try {
        if (!req.isAuthenticated || !req.isAuthenticated()) {
            return res.redirect("/auth/login");
        }

        const assetId = req.query.assetid;
        const userDetails = await db.query("SELECT * FROM users WHERE s_id = $1", [req.user.s_id]);
        const inventory = await botService.getInventory();

        const item = inventory.find(item => item.assetid === assetId);
        if (!item) {
            return res.render("transfer.ejs", { userData: userDetails.rows[0], message: "Item not available" });
        }

        const skinPricesResponse = await axios.get("https://raw.githubusercontent.com/ByMykel/counter-strike-price-tracker/main/static/prices/latest.json");
        const skinPrices = skinPricesResponse.data;
        const price = (skinPrices[item.market_hash_name]?.steam.last_24h || 0) * 91;

        if (price >= userDetails.rows[0].balance / 100) {
            return res.render("transfer.ejs", { userData: userDetails.rows[0], message: "Insufficient balance" });
        }

        botService.sendWithdrawTrade(req.user.s_id, item, (err, tradelink) => {
            if (err) {
                console.error("Error sending trade:", err);
                return res.render("transfer.ejs", { userData: userDetails.rows[0], message: "Error sending trade" });
            } else {
                db.query("UPDATE users SET balance = balance - $1 WHERE s_id = $2", [price * 100, req.user.s_id]);
                res.render("transfer.ejs", { userData: userDetails.rows[0], message: "Accept the trade using Steam", tradelink });
            }
        });
    } catch (error) {
        console.error("Error in withdrawItem:", error);
        res.status(500).send("Error processing withdrawal");
    }
};

export const depositItem = async (req, res) => {
    try {
        if (!req.isAuthenticated || !req.isAuthenticated()) {
            return res.redirect("/auth/login");
        }

        const assetId = req.query.assetid;
        const userDetails = await db.query("SELECT * FROM users WHERE s_id = $1", [req.user.s_id]);
        const inventory = await botService.getPartnerInventory(req.user.s_id);

        const item = inventory.find(item => item.assetid === assetId);
        if (!item) {
            return res.render("transfer.ejs", { userData: userDetails.rows[0], message: "Item not available" });
        }

        const skinPricesResponse = await axios.get("https://raw.githubusercontent.com/ByMykel/counter-strike-price-tracker/main/static/prices/latest.json");
        const skinPrices = skinPricesResponse.data;
        const price = (skinPrices[item.market_hash_name]?.steam.last_24h || 0) * 91;

        botService.sendDepositTrade(req.user.s_id, item, (err, tradelink) => {
            if (err) {
                console.error("Error sending deposit trade:", err);
                return res.render("transfer.ejs", { userData: userDetails.rows[0], message: "Error sending trade" });
            } else {
                db.query("UPDATE users SET balance = balance + $1 WHERE s_id = $2", [price * 100, req.user.s_id]);
                res.render("transfer.ejs", { userData: userDetails.rows[0], message: "Accept the deposit trade using Steam", tradelink });
            }
        });
    } catch (error) {
        console.error("Error in depositItem:", error);
        res.status(500).send("Error processing deposit");
    }
};
