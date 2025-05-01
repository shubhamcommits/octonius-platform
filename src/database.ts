// Import Sequelize
import { db } from './sequelize'
import { dbLogger } from './logger'

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
            dbLogger('The NODE_ENV is not compatible with the database endpoint', { 
                environment: NODE_ENV,
                host: DB_WRITER_HOST 
            })
            throw new Error(`The NODE_ENV is not compatible with the database endpoint`)
        }

        // Authenticate the Sequelize and Initialize the ORM inside the application
        await db.authenticate()
        dbLogger('Sequelize has been authenticated', {
            host: DB_WRITER_HOST,
            database: DB_NAME
        })

        await db.sync({ alter: alter_tables_auto })
        dbLogger('All the Models are Synced with the Database Tables', {
            alter: alter_tables_auto
        })

        return { message: 'Database initialized successfully' }

    } catch (error) {
        dbLogger('Error during database initialization', { error })
        throw new Error(`Error during database initialization - ${error}`)
    }
}