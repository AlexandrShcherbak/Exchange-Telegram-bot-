const { Sequelize } = require('sequelize');
const logger = require('./utils/logger');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: msg => logger.debug(msg)
  }
);

const initDatabase = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established');
    
    // Синхронизация моделей
    require('./models/User')(sequelize);
    require('./models/Payment')(sequelize);
    require('./models/Transaction')(sequelize);
    
    const allowRuntimeSync = process.env.DB_SYNC === 'true';
    if (allowRuntimeSync) {
      await sequelize.sync();
      logger.info('Database models synchronized (DB_SYNC=true)');
    } else {
      logger.info('Runtime schema sync disabled. Use migrations to manage schema changes.');
    }
  } catch (error) {
    logger.error('Unable to connect to database:', error);
    throw error;
  }
};

module.exports = { sequelize, initDatabase };

