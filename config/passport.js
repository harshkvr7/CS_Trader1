import passport from "passport";
import SteamStrategy from "passport-steam";
import dotenv from "dotenv";
import db from "./database.js";

dotenv.config();

passport.use(
    new SteamStrategy(
        {
            returnURL: `${process.env.STEAM_RETURN_URL}/auth/steam/return`,
            realm: process.env.STEAM_REALM,
            apiKey: process.env.STEAM_API_KEY,
        },
        async (identifier, profile, done) => {
            try {
                const result = await db.query("SELECT * FROM users WHERE s_id = $1", [profile.id]);
                if (result.rows.length === 0) {
                    const newUser = await db.query(
                        "INSERT INTO users(s_id, name, pfp) VALUES ($1, $2, $3) RETURNING *",
                        [profile.id, profile.displayName, profile.photos[1]?.value || ""]
                    );
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
