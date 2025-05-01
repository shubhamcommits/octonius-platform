// Import Sequelize
import { db } from './sequelize'
import logger from './logger'

/**
 * This function initializes the PostgreSQL database
 * @returns Promise<{ message: string }>
 */
export async function initiliazeDatabase(): Promise<{ message: string }> {
    try {
        // Fetch Environment Variables
        const { DB_WRITER_HOST, DB_READER_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME, NODE_ENV } = process.env

        // Fetch the alter flag
        let alter_tables_auto = true

        // Set the alter flag to prod if environment is PROD
        if(NODE_ENV == 'prod' || NODE_ENV == 'staging')
            alter_tables_auto = false

        if(!DB_WRITER_HOST?.startsWith(NODE_ENV || '')){
            logger.error('The NODE_ENV is not compatible with the database endpoint')
            throw new Error(`The NODE_ENV is not compatible with the database endpoint`)
        }

        // Authenticate the Sequelize and Initialize the ORM inside the application
        await db.authenticate()
        logger.info('Sequelize has been authenticated')

        await db.sync({ alter: alter_tables_auto })
        logger.info('All the Models are Synced with the Database Tables')

        return { message: 'Database initialized successfully' }

    } catch (error) {
        logger.error(`Error during database initialization: ${error}`)
        throw new Error(`Error during database initialization - ${error}`)
    }
}