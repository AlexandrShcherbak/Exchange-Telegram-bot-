const logger = require('../utils/logger');
const { setupPaymentHandlers } = require('./payment');
const { setupExchangeHandlers } = require('./exchange');
const { setupAdminHandlers } = require('./admin');

const setupHandlers = (bot) => {
  // Основные команды
  bot.start(async (ctx) => {
    const { User } = require('../database').sequelize.models;
    const user = await User.findOrCreate({
      where: { user_id: ctx.from.id },
      defaults: {
        username: ctx.from.username,
        first_name: ctx.from.first_name,
        last_name: ctx.from.last_name
      }
    });
    
    return ctx.reply(
      `👋 Добро пожаловать, ${ctx.from.first_name}!\n\n` +
      `Я бот для обмена криптовалют и пополнения баланса.\n` +
      `Используй меню ниже для навигации.`,
      {
        reply_markup: {
          keyboard: [
            ['💰 Баланс', '💱 Обмен'],
            ['📊 Курсы', '📜 История'],
            ['💳 Пополнить', '💸 Вывести'],
            ['👥 Рефералы', '❓ Помощь']
          ],
          resize_keyboard: true
        }
      }
    );
  });

  bot.help((ctx) => {
    return ctx.reply(
      '📚 Доступные команды:\n\n' +
      '/start - Запустить бота\n' +
      '/balance - Проверить баланс\n' +
      '/exchange - Обмен валют\n' +
      '/rates - Текущие курсы\n' +
      '/deposit - Пополнить баланс\n' +
      '/withdraw - Вывести средства\n' +
      '/history - История операций\n' +
      '/referrals - Реферальная система\n' +
      '/support - Связь с поддержкой'
    );
  });

  // Настройка обработчиков платежей
  setupPaymentHandlers(bot);
  
  // Настройка обработчиков обмена
  setupExchangeHandlers(bot);
  
  // Настройка админ-панели
  setupAdminHandlers(bot);

  logger.info('All handlers initialized');
};

module.exports = { setupHandlers };