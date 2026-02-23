CREATE TABLE IF NOT EXISTS users (
    user_id BIGINT PRIMARY KEY,
    username VARCHAR(255),
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    balance_rub DECIMAL(10,2) DEFAULT 0,
    balance_usdt DECIMAL(10,2) DEFAULT 0,
    balance_btc DECIMAL(10,8) DEFAULT 0,
    balance_trx DECIMAL(10,2) DEFAULT 0,
    total_deposits DECIMAL(10,2) DEFAULT 0,
    total_withdrawals DECIMAL(10,2) DEFAULT 0,
    referral_code VARCHAR(50) UNIQUE,
    referred_by BIGINT,
    is_admin BOOLEAN DEFAULT FALSE,
    is_blocked BOOLEAN DEFAULT FALSE,
    last_activity TIMESTAMP,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_user_id ON users(user_id);
CREATE INDEX idx_users_referral_code ON users(referral_code);