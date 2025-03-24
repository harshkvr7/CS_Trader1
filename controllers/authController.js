import passport from "passport";

export const steamAuth = passport.authenticate("steam", { scope: ["profile", "id"] });

export const steamReturn = passport.authenticate("steam", {
  successRedirect: "/market",
  failureRedirect: "/auth/login",
});

export const renderLogin = (req, res) => {
  res.render("login.ejs");
};

export const logout = (req, res, next) => {
  req.logout(function(err) {
    if (err) { 
      return next(err); 
    }
    res.redirect("/");
  });
};
