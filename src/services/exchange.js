const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../../config/config.json');

const http = axios.create({
  timeout: Number(process.env.EXCHANGE_HTTP_TIMEOUT_MS || 5000)
});

const ratesCache = {
  value: null,
  updatedAt: 0
};

const updateInterval = Number(config.exchange.update_interval || 60000);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchWithRetry = async (requestFn, { retries = 2, retryDelayMs = 250 } = {}) => {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      if (attempt < retries) {
        await sleep(retryDelayMs * (attempt + 1));
      }
    }
  }

  throw lastError;
};

// Получение курсов с бирж
const getExchangeRates = async ({ forceRefresh = false } = {}) => {
  const cacheIsFresh = Date.now() - ratesCache.updatedAt < updateInterval;
  if (!forceRefresh && cacheIsFresh && ratesCache.value) {
    return ratesCache.value;
  }

  try {
    const [binanceTrxResponse, cbrResponse, binanceBtcResponse] = await Promise.all([
      fetchWithRetry(() => http.get('https://api.binance.com/api/v3/ticker/price', {
        params: { symbol: 'TRXUSDT' }
      })),
      fetchWithRetry(() => http.get('https://www.cbr-xml-daily.ru/daily_json.js')),
      fetchWithRetry(() => http.get('https://api.binance.com/api/v3/ticker/price', {
        params: { symbol: 'BTCUSDT' }
      }))
    ]);

    const trxUsdt = parseFloat(binanceTrxResponse.data.price);
    const usdRub = cbrResponse.data.Valute.USD.Value;
    const btcUsdt = parseFloat(binanceBtcResponse.data.price);

    // Рассчитываем курсы с наценкой
    const trxRub = trxUsdt * usdRub;
    
    const calculatedRates = {
      trx_buy: (1 / trxRub) * (1 - config.exchange.trx_markup / 100), // RUB -> TRX
      trx_sell: trxRub * (1 + config.exchange.trx_markup / 100), // TRX -> RUB
      usdt_buy: (1 / usdRub) * (1 - config.exchange.usdt_markup / 100), // RUB -> USDT
      usdt_sell: usdRub * (1 + config.exchange.usdt_markup / 100), // USDT -> RUB
      btc_buy: (1 / (btcUsdt * usdRub)) * (1 - config.exchange.btc_markup / 100), // RUB -> BTC
      btc_sell: btcUsdt * usdRub * (1 + config.exchange.btc_markup / 100) // BTC -> RUB
    };

    ratesCache.value = calculatedRates;
    ratesCache.updatedAt = Date.now();

    return calculatedRates;
  } catch (error) {
    logger.error('Error fetching exchange rates:', error);
    if (ratesCache.value) {
      logger.warn('Using stale exchange rates from cache due to fetch error');
      return ratesCache.value;
    }

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
