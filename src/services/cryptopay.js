const axios = require('axios');
const logger = require('../utils/logger');

class CryptoPayService {
  constructor() {
    this.token = process.env.CRYPTOBOT_TOKEN;
    this.apiUrl = process.env.CRYPTOBOT_API_URL || 'https://pay.crypt.bot/api';
    this.axios = axios.create({
      baseURL: this.apiUrl,
      headers: {
        'Crypto-Pay-API-Token': this.token,
        'Content-Type': 'application/json'
      }
    });
  }

  async getMe() {
    try {
      const response = await this.axios.get('/getMe');
      return response.data;
    } catch (error) {
      logger.error('CryptoPay getMe error:', error);
      throw error;
    }
  }

  async createInvoice(amount, currency, description = '') {
    try {
      const response = await this.axios.post('/createInvoice', {
        asset: currency,
        amount: amount,
        description: description,
        expires_in: 1800 // 30 минут
      });

      const invoice = response.data.result;
      
      logger.info(`CryptoPay invoice created: ${invoice.invoice_id}`);
      
      return {
        invoice_id: invoice.invoice_id,
        pay_url: invoice.pay_url,
        amount: invoice.amount,
        currency: invoice.asset,
        status: invoice.status,
        expires_at: invoice.expires_at
      };
    } catch (error) {
      logger.error('CryptoPay create invoice error:', error);
      throw error;
    }
  }

  async getInvoices(invoiceIds = []) {
    try {
      const params = {};
      if (invoiceIds.length > 0) {
        params.invoice_ids = invoiceIds.join(',');
      }
      
      const response = await this.axios.get('/getInvoices', { params });
      return response.data.result;
    } catch (error) {
      logger.error('CryptoPay get invoices error:', error);
      throw error;
    }
  }

  async checkInvoice(invoiceId) {
    try {
      const invoices = await this.getInvoices([invoiceId]);
      if (invoices.items && invoices.items.length > 0) {
        return invoices.items[0];
      }
      return null;
    } catch (error) {
      logger.error('CryptoPay check invoice error:', error);
      throw error;
    }
  }

  async getExchangeRates() {
    try {
      const response = await this.axios.get('/getExchangeRates');
      return response.data.result;
    } catch (error) {
      logger.error('CryptoPay get exchange rates error:', error);
      throw error;
    }
  }

  async getCurrencies() {
    try {
      const response = await this.axios.get('/getCurrencies');
      return response.data.result;
    } catch (error) {
      logger.error('CryptoPay get currencies error:', error);
      throw error;
    }
  }

  // Конвертация суммы
  async calculateAmount(amount, fromCurrency, toCurrency) {
    try {
      const rates = await this.getExchangeRates();
      
      for (const rate of rates) {
        if (rate.source === fromCurrency && rate.target === toCurrency) {
          return amount / rate.rate;
        }
      }
      
      throw new Error('Exchange rate not found');
    } catch (error) {
      logger.error('CryptoPay calculate amount error:', error);
      throw error;
    }
  }
}

// Создание платежа для пользователя
const createCryptoBotPayment = async (userId, amount, currency) => {
  const cryptoPay = new CryptoPayService();
  
  const invoice = await cryptoPay.createInvoice(
    amount,
    currency,
    `Пополнение баланса пользователя ${userId}`
  );

  return {
    invoice_id: invoice.invoice_id,
    pay_url: invoice.pay_url,
    amount: invoice.amount,
    currency: invoice.currency,
    expires_at: invoice.expires_at
  };
};

module.exports = { CryptoPayService, createCryptoBotPayment };