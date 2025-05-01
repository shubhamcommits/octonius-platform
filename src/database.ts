// Import Sequelize
import { db } from './sequelize'
import logger from './logger'
import { QueryTypes } from 'sequelize'

interface VersionResult {
    version: string;
}

interface DatabaseResult {
    current_database: string;
}

interface UserResult {
    current_user: string;
}

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
            logger.error(`Database \t: The NODE_ENV is not compatible with the database endpoint`)
            throw new Error(`The NODE_ENV is not compatible with the database endpoint`)
        }

        // Log database connection details
        logger.info(`Database \t: Attempting to connect to PostgreSQL with replication`)
        logger.info(`Database \t: Writer Host: ${DB_WRITER_HOST}`)
        logger.info(`Database \t: Reader Host: ${DB_READER_HOST}`)
        logger.info(`Database \t: Port: ${DB_PORT}`)
        logger.info(`Database \t: Database: ${DB_NAME}`)
        logger.info(`Database \t: Environment: ${NODE_ENV}`)
        logger.info(`Database \t: Auto Alter Tables: ${alter_tables_auto}`)
        logger.info(`Database \t: Replication Mode: Active`)
        logger.info(`Database \t: Write operations will be directed to: ${DB_WRITER_HOST}`)
        logger.info(`Database \t: Read operations will be directed to: ${DB_READER_HOST}`)

        // Authenticate the Sequelize and Initialize the ORM inside the application
        await db.authenticate()
        logger.info(`Database \t: Successfully authenticated with PostgreSQL`)

        try {
            // Get database version from writer
            const versionResult = await db.query<VersionResult>('SELECT version()', {
                type: QueryTypes.SELECT,
                raw: true,
                useMaster: true // Force using writer for version check
            })
            if (versionResult && versionResult[0]) {
                logger.info(`Database \t: PostgreSQL Version: ${versionResult[0].version}`)
            }

            // Get current database name from writer
            const dbNameResult = await db.query<DatabaseResult>('SELECT current_database()', {
                type: QueryTypes.SELECT,
                raw: true,
                useMaster: true // Force using writer for database name check
            })
            if (dbNameResult && dbNameResult[0]) {
                logger.info(`Database \t: Connected to database: ${dbNameResult[0].current_database}`)
            }

            // Get current user from writer
            const userResult = await db.query<UserResult>('SELECT current_user', {
                type: QueryTypes.SELECT,
                raw: true,
                useMaster: true // Force using writer for user check
            })
            if (userResult && userResult[0]) {
                logger.info(`Database \t: Connected as user: ${userResult[0].current_user}`)
            }

            // Test read replication
            const readTest = await db.query('SELECT 1', {
                type: QueryTypes.SELECT,
                raw: true,
                useMaster: false // Force using reader
            })
            if (readTest) {
                logger.info(`Database \t: Read replication is working correctly`)
            }
        } catch (queryError) {
            logger.error(`Database \t: Error fetching database information - ${queryError}`)
        }

        await db.sync({ alter: alter_tables_auto })
        logger.info(`Database \t: All Models are Synced with Database Tables`)
        logger.info(`Database \t: Database initialization completed successfully`)

        return { message: 'Database initialized successfully' }

    } catch (error) {
        logger.error(`Database \t: Error during database initialization - ${error}`)
        throw new Error(`Error during database initialization - ${error}`)
    }
}