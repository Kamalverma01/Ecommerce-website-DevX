const router = require("./routes");
const registerMarketplaceEvents = require("./events/registerMarketplaceEvents");

registerMarketplaceEvents();

module.exports = {
  mountPath: "/api/marketplace",
  router,
  registerMarketplaceEvents,
};
