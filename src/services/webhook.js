const express = require('express');
const logger = require('../utils/logger');

const setupWebhook = (app, bot) => {
  const webhookPath = process.env.WEBHOOK_PATH || '/webhook';
  const webhookUrl = `${process.env.WEBHOOK_URL}${webhookPath}`;

  app.use(express.json());
  app.use(bot.webhookCallback(webhookPath));

  bot.telegram.setWebhook(webhookUrl)
    .then(() => logger.info(`Webhook set: ${webhookUrl}`))
    .catch((error) => logger.error('Failed to set webhook:', error));
};

module.exports = { setupWebhook };
