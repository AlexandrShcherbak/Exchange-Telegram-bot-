require('dotenv').config();
const { Telegraf } = require('telegraf');
const express = require('express');
const logger = require('./src/utils/logger');
const { initDatabase } = require('./src/database');
const { setupHandlers } = require('./src/handlers');
const { setupWebhook } = require('./src/services/webhook');

const bot = new Telegraf(process.env.BOT_TOKEN);
const app = express();

// Инициализация базы данных
initDatabase().then(() => {
  logger.info('Database initialized successfully');
}).catch(err => {
  logger.error('Database initialization failed:', err);
});

// Настройка обработчиков
setupHandlers(bot);

// Webhook настройки
if (process.env.WEBHOOK_URL) {
  setupWebhook(app, bot);
  
  app.listen(process.env.PORT || 3000, () => {
    logger.info(`Server running on port ${process.env.PORT || 3000}`);
  });
} else {
  // Long polling режим
  bot.launch().then(() => {
    logger.info('Bot started in polling mode');
  });
}

// Graceful shutdown
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));