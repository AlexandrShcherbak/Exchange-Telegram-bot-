const { Markup } = require('telegraf');
const logger = require('../utils/logger');
const { createFreekassaPayment } = require('../services/freekassa');
const { createCryptoBotPayment } = require('../services/cryptopay');
const { createYooMoneyPayment } = require('../services/yoomoney');
const { Payment } = require('../database').sequelize.models;

const setupPaymentHandlers = (bot) => {
  bot.hears(['💰 Баланс', '/balance'], async (ctx) => {
    const user = await ctx.db.User.findOne({
      where: { user_id: ctx.from.id }
    });

    return ctx.reply(
      `💰 Ваш баланс:\n\n` +
      `🇷🇺 RUB: ${user.balance_rub}\n` +
      `💵 USDT: ${user.balance_usdt}\n` +
      `₿ BTC: ${user.balance_btc}\n` +
      `🔷 TRX: ${user.balance_trx}\n\n` +
      `Всего пополнено: ${user.total_deposits} RUB`,
      Markup.inlineKeyboard([
        [Markup.button.callback('💳 Пополнить RUB', 'deposit_rub')],
        [Markup.button.callback('💎 Пополнить в USDT', 'deposit_usdt')],
        [Markup.button.callback('📊 История операций', 'history')]
      ])
    );
  });

  bot.hears(['💳 Пополнить', '/deposit'], async (ctx) => {
    return ctx.reply(
      'Выберите способ пополнения:',
      Markup.inlineKeyboard([
        [Markup.button.callback('🏦 FreeKassa (Карты РФ)', 'deposit_freekassa')],
        [Markup.button.callback('🤖 CryptoBot (USDT/TRX/BTC)', 'deposit_cryptobot')],
        [Markup.button.callback('💳 ЮMoney (Карты/СБП)', 'deposit_yoomoney')],
        [Markup.button.callback('🔮 CrystallPay', 'deposit_crystallpay')]
      ])
    );
  });

  bot.action('deposit_freekassa', async (ctx) => {
    await ctx.reply('Введите сумму пополнения в RUB (минимум 10 RUB):');
    ctx.session.paymentMethod = 'freekassa';
    ctx.session.awaitingAmount = true;
  });

  bot.action('deposit_cryptobot', async (ctx) => {
    const currencies = ['USDT', 'TON', 'BTC', 'ETH', 'BNB', 'TRX'];
    const buttons = currencies.map((currency) => [Markup.button.callback(currency, `crypto_currency_${currency}`)]);

    await ctx.reply('Выберите валюту для пополнения:', Markup.inlineKeyboard(buttons));
  });

  bot.action(/crypto_currency_(.+)/, async (ctx) => {
    const currency = ctx.match[1];
    ctx.session.cryptoCurrency = currency;
    ctx.session.awaitingCryptoAmount = true;
    await ctx.reply(`Введите сумму в ${currency} (минимум 1 ${currency}):`);
  });

  // Единый обработчик текста для платежных сценариев
  bot.on('text', async (ctx, next) => {
    if (!ctx.session.awaitingAmount && !ctx.session.awaitingCryptoAmount) {
      return next();
    }

    const amount = parseFloat(ctx.message.text);
    if (isNaN(amount) || amount <= 0) {
      return ctx.reply('❌ Введите корректную сумму');
    }

    if (ctx.session.awaitingAmount) {
      const minAmount = 10;
      if (amount < minAmount) {
        return ctx.reply(`❌ Минимальная сумма: ${minAmount} RUB`);
      }

      try {
        let payment;
        switch (ctx.session.paymentMethod) {
          case 'freekassa':
            payment = await createFreekassaPayment(ctx.from.id, amount);
            break;
          case 'yoomoney':
            payment = await createYooMoneyPayment(ctx.from.id, amount);
            break;
          default:
            return ctx.reply('❌ Метод оплаты не выбран');
        }

        await Payment.create({
          payment_id: payment.id,
          user_id: ctx.from.id,
          amount,
          payment_system: ctx.session.paymentMethod,
          pay_url: payment.url,
          expires_at: new Date(Date.now() + 30 * 60 * 1000)
        });

        await ctx.reply(
          `✅ Счет создан!\n\n` +
          `Сумма: ${amount} RUB\n` +
          `Способ: ${ctx.session.paymentMethod}\n\n` +
          `Для оплаты перейдите по ссылке ниже:`,
          Markup.inlineKeyboard([
            [Markup.button.url('💳 Оплатить', payment.url)],
            [Markup.button.callback('✅ Проверить оплату', `check_payment_${payment.id}`)]
          ])
        );
      } catch (error) {
        logger.error('Payment creation error:', error);
        await ctx.reply('❌ Ошибка при создании платежа. Попробуйте позже.');
      } finally {
        ctx.session.awaitingAmount = false;
      }

      return;
    }

    try {
      const payment = await createCryptoBotPayment(ctx.from.id, amount, ctx.session.cryptoCurrency);

      await Payment.create({
        payment_id: payment.invoice_id,
        user_id: ctx.from.id,
        amount,
        currency: ctx.session.cryptoCurrency,
        payment_system: 'cryptobot',
        invoice_id: payment.invoice_id,
        pay_url: payment.pay_url,
        expires_at: new Date(payment.expires_at)
      });

      await ctx.reply(
        `✅ Счет создан!\n\n` +
        `Сумма: ${amount} ${ctx.session.cryptoCurrency}\n\n` +
        `Для оплаты перейдите по ссылке:`,
        Markup.inlineKeyboard([
          [Markup.button.url('🔗 Оплатить', payment.pay_url)],
          [Markup.button.callback('✅ Проверить оплату', `check_crypto_${payment.invoice_id}`)]
        ])
      );
    } catch (error) {
      logger.error('CryptoBot payment error:', error);
      await ctx.reply('❌ Ошибка при создании платежа');
    } finally {
      ctx.session.awaitingCryptoAmount = false;
    }
  });

  bot.action(/check_payment_(.+)/, async (ctx) => {
    const paymentId = ctx.match[1];
    const payment = await Payment.findByPk(paymentId);

    if (!payment) {
      return ctx.reply('❌ Платеж не найден');
    }

    if (payment.status === 'completed') {
      await ctx.reply('✅ Платеж успешно обработан!');
      await ctx.answerCbQuery('Платеж подтвержден');
    } else {
      await ctx.answerCbQuery('⏳ Платеж еще не обработан', true);
    }
  });
};

module.exports = { setupPaymentHandlers };
