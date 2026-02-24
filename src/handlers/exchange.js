const { Markup } = require('telegraf');
const logger = require('../utils/logger');
const { getExchangeRates, calculateExchange } = require('../services/exchange');
const { validateTronAddress } = require('../utils/validators');

const setupExchangeHandlers = (bot) => {
  // Меню обмена
  bot.hears(['💱 Обмен', '/exchange'], async (ctx) => {
    return ctx.reply(
      'Выберите направление обмена:',
      Markup.inlineKeyboard([
        [Markup.button.callback('🇷🇺 RUB → 🔷 TRX', 'exchange_rub_trx')],
        [Markup.button.callback('🔷 TRX → 🇷🇺 RUB', 'exchange_trx_rub')],
        [Markup.button.callback('🇷🇺 RUB → 💵 USDT', 'exchange_rub_usdt')],
        [Markup.button.callback('💵 USDT → 🇷🇺 RUB', 'exchange_usdt_rub')],
        [Markup.button.callback('₿ BTC → 🇷🇺 RUB', 'exchange_btc_rub')],
        [Markup.button.callback('🇷🇺 RUB → ₿ BTC', 'exchange_rub_btc')]
      ])
    );
  });

  // Калькулятор обмена
  bot.hears(['📊 Курсы', '/rates'], async (ctx) => {
    const rates = await getExchangeRates();

    return ctx.reply(
      `📊 Текущие курсы обмена:\n\n` +
      `🇷🇺 RUB → 🔷 TRX: 1 RUB = ${rates.trx_buy.toFixed(6)} TRX\n` +
      `🔷 TRX → 🇷🇺 RUB: 1 TRX = ${rates.trx_sell.toFixed(2)} RUB\n` +
      `🇷🇺 RUB → 💵 USDT: 1 RUB = ${rates.usdt_buy.toFixed(4)} USDT\n` +
      `💵 USDT → 🇷🇺 RUB: 1 USDT = ${rates.usdt_sell.toFixed(2)} RUB\n` +
      `₿ BTC → 🇷🇺 RUB: 1 BTC = ${rates.btc_sell.toFixed(0)} RUB\n\n` +
      `* Включена комиссия бота`,
      { parse_mode: 'Markdown' }
    );
  });

  // Обработка выбора направления
  bot.action(/exchange_(.+)_(.+)/, async (ctx) => {
    const [from, to] = [ctx.match[1].toUpperCase(), ctx.match[2].toUpperCase()];
    ctx.session.exchangeFrom = from;
    ctx.session.exchangeTo = to;

    await ctx.reply(
      `Введите сумму для обмена ${from} → ${to}:`,
      Markup.inlineKeyboard([
        [Markup.button.callback('❌ Отмена', 'cancel_exchange')]
      ])
    );
    ctx.session.awaitingExchangeAmount = true;
  });

  // Единая обработка текстовых шагов обмена
  bot.on('text', async (ctx, next) => {
    if (!ctx.session.awaitingExchangeAmount && !ctx.session.awaitingWalletAddress) {
      return next();
    }

    if (ctx.session.awaitingWalletAddress) {
      const address = ctx.message.text;

      if (!validateTronAddress(address)) {
        return ctx.reply('❌ Неверный формат TRX адреса. Попробуйте снова:');
      }

      ctx.session.exchangeData.walletAddress = address;
      ctx.session.awaitingWalletAddress = false;

      return ctx.reply(
        `✅ Подтвердите обмен:\n\n` +
        `Отдаете: ${ctx.session.exchangeData.fromAmount} ${ctx.session.exchangeData.fromCurrency}\n` +
        `Получаете: ${ctx.session.exchangeData.toAmount} ${ctx.session.exchangeData.toCurrency}\n` +
        `Адрес: ${address}\n\n` +
        `Все верно?`,
        Markup.inlineKeyboard([
          [Markup.button.callback('✅ Подтвердить', 'confirm_exchange')],
          [Markup.button.callback('❌ Отмена', 'cancel_exchange')]
        ])
      );
    }

    const amount = parseFloat(ctx.message.text);

    if (isNaN(amount) || amount <= 0) {
      return ctx.reply('❌ Введите корректную сумму');
    }

    const user = await ctx.db.User.findOne({
      where: { user_id: ctx.from.id }
    });

    const fromCurrency = ctx.session.exchangeFrom;
    const toCurrency = ctx.session.exchangeTo;

    const balanceField = `balance_${fromCurrency.toLowerCase()}`;
    if (user[balanceField] < amount) {
      return ctx.reply(`❌ Недостаточно средств. Доступно: ${user[balanceField]} ${fromCurrency}`);
    }

    const exchangeResult = await calculateExchange(amount, fromCurrency, toCurrency);

    ctx.session.awaitingExchangeAmount = false;
    ctx.session.exchangeData = {
      fromAmount: amount,
      toAmount: exchangeResult.toAmount,
      fromCurrency,
      toCurrency
    };

    if (toCurrency === 'TRX') {
      ctx.session.awaitingWalletAddress = true;
      return ctx.reply(
        `📝 Детали обмена:\n\n` +
        `Отдаете: ${amount} ${fromCurrency}\n` +
        `Получаете: ${exchangeResult.toAmount} ${toCurrency}\n` +
        `Курс: ${exchangeResult.rate}\n` +
        `Комиссия: ${exchangeResult.fee} ${fromCurrency}\n\n` +
        `Введите адрес TRX кошелька для получения:`
      );
    }

    return ctx.reply(
      `✅ Подтвердите обмен:\n\n` +
      `Отдаете: ${amount} ${fromCurrency}\n` +
      `Получаете: ${exchangeResult.toAmount} ${toCurrency}\n` +
      `Курс: ${exchangeResult.rate}\n\n` +
      `Все верно?`,
      Markup.inlineKeyboard([
        [Markup.button.callback('✅ Подтвердить', 'confirm_exchange')],
        [Markup.button.callback('❌ Отмена', 'cancel_exchange')]
      ])
    );
  });

  // Подтверждение обмена
  bot.action('confirm_exchange', async (ctx) => {
    const { fromAmount, toAmount, fromCurrency, toCurrency, walletAddress } = ctx.session.exchangeData;
    const user = await ctx.db.User.findOne({
      where: { user_id: ctx.from.id }
    });

    try {
      const transaction = await ctx.db.sequelize.transaction();

      const fromField = `balance_${fromCurrency.toLowerCase()}`;
      user[fromField] -= fromAmount;
      await user.save({ transaction });

      if (!walletAddress) {
        const toField = `balance_${toCurrency.toLowerCase()}`;
        user[toField] += toAmount;
        await user.save({ transaction });
      }

      await ctx.db.Transaction.create({
        user_id: ctx.from.id,
        type: 'exchange',
        from_currency: fromCurrency,
        from_amount: fromAmount,
        to_currency: toCurrency,
        to_amount: toAmount,
        wallet_address: walletAddress,
        status: walletAddress ? 'pending' : 'completed'
      }, { transaction });

      await transaction.commit();

      let message = `✅ Обмен успешно выполнен!\n\n`;
      message += `Списано: ${fromAmount} ${fromCurrency}\n`;

      if (walletAddress) {
        message += `⏳ Ожидается вывод ${toAmount} ${toCurrency} на адрес:\n${walletAddress}\n`;
        message += `Транзакция будет обработана в течение нескольких минут.`;
      } else {
        message += `Зачислено: ${toAmount} ${toCurrency}`;
      }

      await ctx.reply(message);

      await ctx.reply(
        `💰 Новый баланс:\n` +
        `RUB: ${user.balance_rub}\n` +
        `USDT: ${user.balance_usdt}\n` +
        `TRX: ${user.balance_trx}`
      );
    } catch (error) {
      logger.error('Exchange error:', error);
      await ctx.reply('❌ Ошибка при выполнении обмена');
    } finally {
      ctx.session.exchangeData = null;
      ctx.session.awaitingExchangeAmount = false;
      ctx.session.awaitingWalletAddress = false;
    }
  });

  bot.action('cancel_exchange', (ctx) => {
    ctx.session.exchangeData = null;
    ctx.session.awaitingExchangeAmount = false;
    ctx.session.awaitingWalletAddress = false;
    ctx.reply('❌ Обмен отменен');
  });
};

module.exports = { setupExchangeHandlers };
