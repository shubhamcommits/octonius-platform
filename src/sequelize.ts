// Import Sequelize
import { Sequelize } from 'sequelize'

// Import Logger
import logger from './logger'

// Import environment configuration
import { getDatabaseConfig, isDevelopment } from './env-validator'

// Get database configuration
const dbConfig = getDatabaseConfig()

// Create a new Sequelize instance with replication
const db = new Sequelize(dbConfig.writer.database, dbConfig.writer.username, dbConfig.writer.password, {
    dialect: 'postgres',
    port: dbConfig.writer.port,
    replication: {
        read: [
            {
                host: dbConfig.reader.host,
                username: dbConfig.reader.username,
                password: dbConfig.reader.password,
                port: dbConfig.reader.port
            }
        ],
        write: {
            host: dbConfig.writer.host,
            username: dbConfig.writer.username,
            password: dbConfig.writer.password,
            port: dbConfig.writer.port
        }
    },
    pool: {
        max: dbConfig.pool.max,
        min: dbConfig.pool.min,
        acquire: 60000,
        idle: 5000
    },
    logging: (msg) => {
        if (isDevelopment()) {
            logger.info(`Database \t: ${msg}`)
        }
    },
    define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true
    }
})

// Export the Sequelize instance
export { db }
