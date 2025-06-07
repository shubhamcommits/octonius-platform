// Import Sequelize
import { db } from './sequelize'
import { dbLogger } from './logger'
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
 * @returns Promise<{ message: string, connected: boolean }>
 */
export async function initiliazeDatabase(): Promise<{ message: string, connected: boolean }> {
    try {
        // Fetch Environment Variables
        const { DB_WRITER_HOST, DB_READER_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME, NODE_ENV } = process.env

        // Fetch the alter flag
        let alter_tables_auto = true

        // Set the alter flag to prod if environment is PROD
        if(NODE_ENV == 'prod' || NODE_ENV == 'staging')
            alter_tables_auto = false

        // if(!DB_WRITER_HOST?.startsWith(NODE_ENV || '')){
        //     logger.error(`Database \t: The NODE_ENV is not compatible with the database endpoint`)
        //     throw new Error(`The NODE_ENV is not compatible with the database endpoint`)
        // }

        // Log database connection details
        dbLogger(`Attempting to connect to PostgreSQL with replication`)
        dbLogger(`Writer Host: ${DB_WRITER_HOST}`)
        dbLogger(`Reader Host: ${DB_READER_HOST}`)
        dbLogger(`Port: ${DB_PORT}`)
        dbLogger(`Database: ${DB_NAME}`)
        dbLogger(`Environment: ${NODE_ENV}`)
        dbLogger(`Auto Alter Tables: ${alter_tables_auto}`)
        dbLogger(`Replication Mode: Active`)
        dbLogger(`Write operations will be directed to: ${DB_WRITER_HOST}`)
        dbLogger(`Read operations will be directed to: ${DB_READER_HOST}`)

        // Authenticate the Sequelize and Initialize the ORM inside the application
        await db.authenticate()
        dbLogger(`Successfully authenticated with PostgreSQL`)

        try {
            // Get database version from writer
            const versionResult = await db.query<VersionResult>('SELECT version()', {
                type: QueryTypes.SELECT,
                raw: true,
                useMaster: true // Force using writer for version check
            })
            if (versionResult && versionResult[0]) {
                dbLogger(`PostgreSQL Version: ${versionResult[0].version}`)
            }

            // Get current database name from writer
            const dbNameResult = await db.query<DatabaseResult>('SELECT current_database()', {
                type: QueryTypes.SELECT,
                raw: true,
                useMaster: true // Force using writer for database name check
            })
            if (dbNameResult && dbNameResult[0]) {
                dbLogger(`Connected to database: ${dbNameResult[0].current_database}`)
            }

            // Get current user from writer
            const userResult = await db.query<UserResult>('SELECT current_user', {
                type: QueryTypes.SELECT,
                raw: true,
                useMaster: true // Force using writer for user check
            })
            if (userResult && userResult[0]) {
                dbLogger(`Connected as user: ${userResult[0].current_user}`)
            }

            // Test read replication
            const readTest = await db.query('SELECT 1', {
                type: QueryTypes.SELECT,
                raw: true,
                useMaster: false // Force using reader
            })
            if (readTest) {
                dbLogger(`Read replication is working correctly`)
            }
        } catch (queryError) {
            dbLogger(`Error fetching database information - ${queryError}`, { level: 'error' })
        }

        await db.sync({ alter: alter_tables_auto })
        dbLogger(`All Models are Synced with Database Tables`)
        dbLogger(`Database initialization completed successfully`)

        return { message: 'Database initialized successfully', connected: true }

    } catch (error: any) {
        dbLogger(`Error during database initialization: ${error.message}`, { level: 'error' })
        // Do not throw, just return a failed state
        return { message: `Database unavailable: ${error.message}`, connected: false }
    }
}