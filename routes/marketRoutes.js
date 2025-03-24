import { Router } from "express";
import { getMarketPage, withdrawItem, depositItem } from "../controllers/marketController.js";

const router = Router();

router.get("/", getMarketPage);
router.get("/withdraw", withdrawItem);
router.get("/deposit", depositItem);

export default router;
