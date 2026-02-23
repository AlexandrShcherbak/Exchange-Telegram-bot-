const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Transaction = sequelize.define('Transaction', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('buy', 'sell', 'exchange', 'deposit', 'withdraw', 'referral_bonus'),
      allowNull: false
    },
    from_currency: {
      type: DataTypes.STRING
    },
    from_amount: {
      type: DataTypes.DECIMAL(10, 8)
    },
    to_currency: {
      type: DataTypes.STRING
    },
    to_amount: {
      type: DataTypes.DECIMAL(10, 8)
    },
    rate: {
      type: DataTypes.DECIMAL(10, 8)
    },
    fee: {
      type: DataTypes.DECIMAL(10, 8),
      defaultValue: 0
    },
    wallet_address: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tx_hash: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed'),
      defaultValue: 'completed'
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {}
    }
  }, {
    timestamps: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['type'] },
      { fields: ['status'] }
    ]
  });

  return Transaction;
};