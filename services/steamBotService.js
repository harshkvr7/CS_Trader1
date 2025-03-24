import SteamBot from "../bot.js";

const bot = new SteamBot({
  accountName: process.env.STEAM_ACCOUNT_NAME,
  password: process.env.STEAM_PASSWORD,
  twoFactorCode: SteamTotp.generateAuthCode(process.env.STEAM_SHARED_SECRET), 
});

const getInventory = () => {
  return bot.getInventory();
};

const getPartnerInventory = (partnerId) => {
  return bot.getPartnerInventory(partnerId);
};

const sendWithdrawTrade = (partnerId, item, callback) => {
  bot.sendWithdrawTrade(partnerId, item, callback);
};

const sendDepositTrade = (partnerId, item, callback) => {
  bot.sendDepositTrade(partnerId, item, callback);
};

export default {
  getInventory,
  getPartnerInventory,
  sendWithdrawTrade,
  sendDepositTrade,
};