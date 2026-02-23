const TronWeb = require('tronweb');

// Валидация email
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

// Валидация телефона
const validatePhone = (phone) => {
  const re = /^(\+7|8)[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/;
  return re.test(phone);
};

// Валидация TRX адреса
const validateTronAddress = (address) => {
  try {
    return TronWeb.isAddress(address);
  } catch {
    return false;
  }
};

// Валидация BTC адреса
const validateBitcoinAddress = (address) => {
  // Поддерживаем P2PKH, P2SH, Bech32
  const btcRegex = /^(1|3|bc1)[a-zA-Z0-9]{25,59}$/;
  return btcRegex.test(address);
};

// Валидация USDT адреса (ERC20)
const validateERC20Address = (address) => {
  const ethRegex = /^0x[a-fA-F0-9]{40}$/;
  return ethRegex.test(address);
};

// Валидация суммы
const validateAmount = (amount, min = 0, max = Infinity) => {
  const num = parseFloat(amount);
  if (isNaN(num) || num <= 0) return false;
  if (num < min || num > max) return false;
  return true;
};

// Валидация промокода
const validatePromoCode = (code) => {
  const codeRegex = /^[A-Z0-9]{4,12}$/;
  return codeRegex.test(code);
};

// Проверка IP в белом списке
const isWhitelistedIP = (ip, whitelist) => {
  return whitelist.includes(ip);
};

module.exports = {
  validateEmail,
  validatePhone,
  validateTronAddress,
  validateBitcoinAddress,
  validateERC20Address,
  validateAmount,
  validatePromoCode,
  isWhitelistedIP
};