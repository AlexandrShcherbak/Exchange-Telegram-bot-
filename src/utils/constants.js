module.exports = {
  // Платежные системы
  PAYMENT_SYSTEMS: {
    FREEKASSA: 'freekassa',
    CRYPTOBOT: 'cryptobot',
    YOOMONEY: 'yoomoney',
    CRYSTALLPAY: 'crystallpay'
  },

  // Статусы платежей
  PAYMENT_STATUS: {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed',
    EXPIRED: 'expired'
  },

  // Типы транзакций
  TRANSACTION_TYPES: {
    DEPOSIT: 'deposit',
    WITHDRAW: 'withdraw',
    EXCHANGE: 'exchange',
    REFERRAL: 'referral_bonus'
  },

  // Валюты
  CURRENCIES: {
    RUB: 'RUB',
    USDT: 'USDT',
    BTC: 'BTC',
    ETH: 'ETH',
    TRX: 'TRX',
    TON: 'TON',
    BNB: 'BNB'
  },

  // IP адреса FreeKassa
  FREEKASSA_IPS: [
    '136.243.38.147',
    '136.243.38.149',
    '136.243.38.150',
    '136.243.38.151',
    '136.243.38.189',
    '136.243.38.108'
  ],

  // Минимальные суммы
  MIN_AMOUNTS: {
    RUB: 10,
    USDT: 1,
    BTC: 0.0001,
    TRX: 10
  },

  // Комиссии (в процентах)
  FEES: {
    EXCHANGE: 2,
    WITHDRAW: 1
  },

  // Таймауты (в миллисекундах)
  TIMEOUTS: {
    PAYMENT_EXPIRY: 30 * 60 * 1000, // 30 минут
    SESSION_EXPIRY: 60 * 60 * 1000, // 1 час
    RATE_UPDATE: 60 * 1000 // 1 минута
  }
};