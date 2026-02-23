const crypto = require('crypto');

// Генерация уникального ID
const generateId = (prefix = '') => {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(4).toString('hex');
  return `${prefix}${timestamp}${random}`;
};

// Генерация реферального кода
const generateReferralCode = (userId) => {
  const hash = crypto.createHash('md5')
    .update(`${userId}${Date.now()}`)
    .digest('hex')
    .substring(0, 8);
  return hash.toUpperCase();
};

// Форматирование даты
const formatDate = (date, format = 'DD.MM.YYYY HH:mm') => {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return format
    .replace('DD', day)
    .replace('MM', month)
    .replace('YYYY', year)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
};

// Форматирование суммы
const formatAmount = (amount, currency = 'RUB') => {
  const formatter = new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: currency === 'BTC' ? 8 : 2,
    maximumFractionDigits: currency === 'BTC' ? 8 : 2
  });
  return formatter.format(amount);
};

// Обрезка текста
const truncate = (text, length = 50) => {
  if (text.length <= length) return text;
  return text.substring(0, length) + '...';
};

// Экранирование для Telegram
const escapeMarkdown = (text) => {
  return text.replace(/[_*[\]()~>#+=|{}.!-]/g, '\\$&');
};

// Задержка
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

module.exports = {
  generateId,
  generateReferralCode,
  formatDate,
  formatAmount,
  truncate,
  escapeMarkdown,
  sleep
};