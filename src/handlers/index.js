const logger = require('../utils/logger');
const { setupPaymentHandlers } = require('./payment');
const { setupExchangeHandlers } = require('./exchange');
const { setupAdminHandlers } = require('./admin');

const setupHandlers = (bot) => {
  setupPaymentHandlers(bot);
  setupExchangeHandlers(bot);
  setupAdminHandlers(bot);

  logger.info('All handlers initialized');
};

module.exports = { setupHandlers };
