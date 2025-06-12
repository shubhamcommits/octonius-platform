// Import Sequelize
import { Sequelize } from 'sequelize'

// Import Logger
import logger from './logger'

// Import environment configuration
import { getDatabaseConfig, isDevelopment, isLocal } from './config'

// Get database configuration
const dbConfig = getDatabaseConfig()

// Build Sequelize options
const sequelizeOptions: any = {
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
    logging: (msg: string, timing?: number) => {
        if (isDevelopment() || isLocal()) {
            if (timing && timing > 1000) {
                logger.warn(`[SLOW QUERY] ${msg}`, { context: 'sequelize', timing: `${timing} ms` })
            } else {
                logger.info(`[DB] ${msg}`, { context: 'sequelize', timing: `${timing} ms` })
            }
        }
    },
    benchmark: true,
    define: {
        timestamps: true,
        underscored: true,
        freezeTableName: true
    }
}

// Only use SSL in non-local environments
if (!isLocal()) {
    sequelizeOptions.dialectOptions = {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
}

// Create a new Sequelize instance with replication
const db = new Sequelize(dbConfig.writer.database, dbConfig.writer.username, dbConfig.writer.password, sequelizeOptions)

// Export the Sequelize instance
export { db }
