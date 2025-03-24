import { Router } from "express";
import { steamAuth, steamReturn, renderLogin, logout } from "../controllers/authController.js";

const router = Router();

router.get("/steam", steamAuth);
router.get("/steam/return", steamReturn);
router.get("/login", renderLogin);
router.get("/logout", logout);

export default router;
