const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    user_id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      unique: true
    },
    username: {
      type: DataTypes.STRING,
      allowNull: true
    },
    first_name: {
      type: DataTypes.STRING
    },
    last_name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    balance_rub: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    balance_usdt: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    balance_btc: {
      type: DataTypes.DECIMAL(10, 8),
      defaultValue: 0
    },
    balance_trx: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    total_deposits: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    total_withdrawals: {
      type: DataTypes.DECIMAL(10, 2),
      defaultValue: 0
    },
    referral_code: {
      type: DataTypes.STRING,
      unique: true
    },
    referred_by: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    is_admin: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    is_blocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    last_activity: {
      type: DataTypes.DATE
    },
    settings: {
      type: DataTypes.JSON,
      defaultValue: {}
    }
  }, {
    timestamps: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['referral_code'] }
    ]
  });

  return User;
};