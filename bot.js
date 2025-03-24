import SteamUser from "steam-user";
import SteamCommunity from "steamcommunity";
import TradeOfferManager from "steam-tradeoffer-manager";

class SteamBot {
	constructor(logOnOptions) {
		this.client = new SteamUser();
		this.community = new SteamCommunity();
		this.manager = new TradeOfferManager({
			steam: this.client,
			community: this.community,
			language: "en",
		});

		this.logOn(logOnOptions);
	}

	logOn(logOnOptions) {
		this.client.logOn(logOnOptions);

		this.client.on("loggedOn", () => {
			console.log("Logged into Steam");
			this.client.setPersona(SteamUser.EPersonaState.Online);
		});

		this.client.on("webSession", (sessionid, cookies) => {
			this.manager.setCookies(cookies);
			this.community.setCookies(cookies);
			this.community.startConfirmationChecker(1000, process.env.STEAM_IDENTITY_SECRET);
		});
	}

	sendWithdrawTrade(partnerId, item, callback) {
		const offer = this.manager.createOffer(partnerId);
		offer.addMyItem(item);
		offer.setMessage("Withdraw item from the website!");
		offer.send((err, status) => {
			if (err) {
				console.log("Error sending offer:", err);
				callback(err, null);
			} else {
				console.log("Trade offer sent");
				const tradelink = `https://steamcommunity.com/tradeoffer/${offer.id}`;
				callback(null, tradelink);
			}
		});
	}

	sendDepositTrade(partnerId, item, callback) {
		const offer = this.manager.createOffer(partnerId);
		offer.addTheirItem(item);
		offer.setMessage("Deposit item on the website!");
		offer.send((err, status) => {
			if (err) {
				console.log("Error sending offer:", err);
				callback(err, null);
			} else {
				console.log("Trade offer sent");
				const tradelink = `https://steamcommunity.com/tradeoffer/${offer.id}`;
				callback(null, tradelink);
			}
		});
	}

	getInventory() {
		return new Promise((resolve, reject) => {
			this.manager.getInventoryContents(730, 2, true, (err, inv) => {
				if (err) {
					reject(err);
				} else {
					resolve(inv);
				}
			});
		});
	}

	getPartnerInventory(partnerId) {
		return new Promise((resolve, reject) => {
			this.manager.getUserInventoryContents(partnerId, 730, 2, true, (err, inv) => {
				if (err) {
					reject(err);
				} else {
					resolve(inv);
				}
			});
		});
	}
}

export default SteamBot;
