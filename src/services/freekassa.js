const crypto = require('crypto');
const axios = require('axios');
const logger = require('../utils/logger');

const createFreekassaPayment = async (userId, amount) => {
  try {
    const merchantId = process.env.FREEKASSA_MERCHANT_ID;
    const secretWord = process.env.FREEKASSA_SECRET1;
    const orderId = `${userId}_${Date.now()}`;
    const currency = 'RUB';
    
    // Создание подписи
    const sign = crypto.createHash('md5')
      .update(`${merchantId}:${amount}:${secretWord}:${currency}:${orderId}`)
      .digest('hex');
    
    const paymentData = {
      m: merchantId,
      oa: amount,
      o: orderId,
      s: sign,
      currency: currency,
      us_login: userId,
      lang: 'ru'
    };

    // Формируем URL для оплаты
    const queryString = new URLSearchParams(paymentData).toString();
    const paymentUrl = `https://pay.freekassa.ru/?${queryString}`;

    logger.info(`FreeKassa payment created for user ${userId}: ${orderId}`);

    return {
      id: orderId,
      url: paymentUrl,
      amount: amount,
      currency: currency
    };
  } catch (error) {
    logger.error('FreeKassa payment creation error:', error);
    throw error;
  }
};

const verifyFreekassaPayment = (req) => {
  try {
    const { MERCHANT_ID, AMOUNT, MERCHANT_ORDER_ID, SIGN, us_login } = req.body;
    const secretWord2 = process.env.FREEKASSA_SECRET2;
    
    // Проверка IP
    const allowedIPs = [
      '136.243.38.147', '136.243.38.149', '136.243.38.150',
      '136.243.38.151', '136.243.38.189', '136.243.38.108'
    ];
    
    const clientIP = req.ip || req.connection.remoteAddress;
    if (!allowedIPs.includes(clientIP)) {
      logger.warn(`FreeKassa unauthorized IP: ${clientIP}`);
      return false;
    }

    // Проверка подписи
    const expectedSign = crypto.createHash('md5')
      .update(`${MERCHANT_ID}:${AMOUNT}:${secretWord2}:${MERCHANT_ORDER_ID}`)
      .digest('hex')
      .toUpperCase();

    if (SIGN.toUpperCase() !== expectedSign) {
      logger.warn(`FreeKassa invalid signature for order ${MERCHANT_ORDER_ID}`);
      return false;
    }

    return {
      userId: us_login,
      amount: AMOUNT,
      orderId: MERCHANT_ORDER_ID,
      paymentId: MERCHANT_ORDER_ID
    };
  } catch (error) {
    logger.error('FreeKassa verification error:', error);
    return false;
  }
};

module.exports = { createFreekassaPayment, verifyFreekassaPayment };