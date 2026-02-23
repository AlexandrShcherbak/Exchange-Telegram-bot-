const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../../config/config.json');

// Получение курсов с бирж
const getExchangeRates = async () => {
  try {
    // Получаем курс TRX/USDT с Binance
    const binanceResponse = await axios.get('https://api.binance.com/api/v3/ticker/price', {
      params: { symbol: 'TRXUSDT' }
    });
    const trxUsdt = parseFloat(binanceResponse.data.price);

    // Получаем курс USD/RUB с ЦБ РФ
    const cbrResponse = await axios.get('https://www.cbr-xml-daily.ru/daily_json.js');
    const usdRub = cbrResponse.data.Valute.USD.Value;

    // Получаем курс BTC/USDT
    const btcResponse = await axios.get('https://api.binance.com/api/v3/ticker/price', {
      params: { symbol: 'BTCUSDT' }
    });
    const btcUsdt = parseFloat(btcResponse.data.price);

    // Рассчитываем курсы с наценкой
    const trxRub = trxUsdt * usdRub;
    
    return {
      trx_buy: (1 / trxRub) * (1 - config.exchange.trx_markup / 100), // RUB -> TRX
      trx_sell: trxRub * (1 + config.exchange.trx_markup / 100), // TRX -> RUB
      usdt_buy: (1 / usdRub) * (1 - config.exchange.usdt_markup / 100), // RUB -> USDT
      usdt_sell: usdRub * (1 + config.exchange.usdt_markup / 100), // USDT -> RUB
      btc_buy: (1 / (btcUsdt * usdRub)) * (1 - config.exchange.btc_markup / 100), // RUB -> BTC
      btc_sell: btcUsdt * usdRub * (1 + config.exchange.btc_markup / 100) // BTC -> RUB
    };
  } catch (error) {
    logger.error('Error fetching exchange rates:', error);
    // Возвращаем заглушки в случае ошибки
    return {
      trx_buy: 0.0015,
      trx_sell: 6.5,
      usdt_buy: 0.01,
      usdt_sell: 100,
      btc_buy: 0.000001,
      btc_sell: 3500000
    };
  }
};

// Расчет суммы обмена
const calculateExchange = async (amount, fromCurrency, toCurrency) => {
  const rates = await getExchangeRates();
  
  let rate, toAmount, fee;
  
  if (fromCurrency === 'RUB' && toCurrency === 'TRX') {
    rate = rates.trx_buy;
    toAmount = amount * rate;
    fee = amount * (config.exchange.trx_markup / 100);
  } else if (fromCurrency === 'TRX' && toCurrency === 'RUB') {
    rate = rates.trx_sell;
    toAmount = amount * rate;
    fee = amount * (config.exchange.trx_markup / 100);
  } else if (fromCurrency === 'RUB' && toCurrency === 'USDT') {
    rate = rates.usdt_buy;
    toAmount = amount * rate;
    fee = amount * (config.exchange.usdt_markup / 100);
  } else if (fromCurrency === 'USDT' && toCurrency === 'RUB') {
    rate = rates.usdt_sell;
    toAmount = amount * rate;
    fee = amount * (config.exchange.usdt_markup / 100);
  } else if (fromCurrency === 'RUB' && toCurrency === 'BTC') {
    rate = rates.btc_buy;
    toAmount = amount * rate;
    fee = amount * (config.exchange.btc_markup / 100);
  } else if (fromCurrency === 'BTC' && toCurrency === 'RUB') {
    rate = rates.btc_sell;
    toAmount = amount * rate;
    fee = amount * (config.exchange.btc_markup / 100);
  } else {
    throw new Error('Unsupported currency pair');
  }

  return {
    fromAmount: amount,
    toAmount: toAmount.toFixed(toCurrency === 'BTC' ? 8 : 2),
    rate: rate.toFixed(toCurrency === 'BTC' ? 8 : 4),
    fee: fee.toFixed(2)
  };
};

module.exports = { getExchangeRates, calculateExchange };