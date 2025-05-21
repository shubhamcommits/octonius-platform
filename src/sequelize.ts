// Import Sequelize
import { Sequelize } from 'sequelize'

// Import Logger
import logger from './logger'

// Fetch Environment Variables
const { DB_WRITER_HOST, DB_READER_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME, NODE_ENV, MAX_POOL, MIN_POOL } = process.env

// Create a new Sequelize instance with replication
const db = new Sequelize(DB_NAME || '', DB_USER || '', DB_PASS || '', {
    dialect: 'postgres',
    port: parseInt(DB_PORT || '5432'),
    replication: {
        read: [
            {
                host: DB_READER_HOST,
                username: DB_USER,
                password: DB_PASS,
                port: parseInt(DB_PORT || '5432')
            }
        ],
        write: {
            host: DB_WRITER_HOST,
            username: DB_USER,
            password: DB_PASS,
            port: parseInt(DB_PORT || '5432')
        }
    },
    pool: {
        max: Number(MAX_POOL) || 5,
        min: Number(MIN_POOL) || 0,
        acquire: 60000,
        idle: 5000
    },
    logging: (msg) => {
        if (NODE_ENV === 'development') {
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
