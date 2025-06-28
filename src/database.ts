// Import Sequelize
import { db } from './sequelize'
import { dbLogger } from './logger'
import { QueryTypes } from 'sequelize'
import { getDatabaseConfig, isProduction, getEnv } from './config'

// Import models initialization
import { initializeAssociations } from './models'

// Get environment variables
const { NODE_ENV } = getEnv()

interface VersionResult {
    version: string
}

interface DatabaseResult {
    current_database: string
}

interface UserResult {
    current_user: string
}

/**
 * This function initializes the PostgreSQL database
 * @returns Promise<{ message: string, connected: boolean }>
 */
export async function initiliazeDatabase(): Promise<{ message: string, connected: boolean }> {
    try {
        // Get database configuration
        const dbConfig = getDatabaseConfig()

        // Fetch the alter flag
        let alter_tables_auto = !isProduction()

        // Log database connection details
        dbLogger(`Attempting to connect to PostgreSQL with replication`)
        dbLogger(`Writer Host`, { host: dbConfig.writer.host })
        dbLogger(`Reader Host`, { host: dbConfig.reader.host })
        dbLogger(`Port`, { port: dbConfig.writer.port })
        dbLogger(`Database`, { database: dbConfig.writer.database })
        dbLogger(`Environment`, { environment: NODE_ENV })
        dbLogger(`Auto Alter Tables`, { auto_alter_tables: alter_tables_auto })
        dbLogger(`Replication Mode`, { replication_mode: 'Active' })
        dbLogger(`Write operations will be directed to`, { host: dbConfig.writer.host })
        dbLogger(`Read operations will be directed to`, { host: dbConfig.reader.host })

        // Authenticate the Sequelize and Initialize the ORM inside the application
        await db.authenticate()
        dbLogger(`Successfully authenticated with PostgreSQL`)

        // Initialize model associations
        initializeAssociations()
        dbLogger(`Model associations initialized successfully`)

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
            dbLogger(`Error fetching database information - ${queryError}`, { level: 'error', error: queryError })
        }

        await db.sync({ alter: alter_tables_auto })
        dbLogger(`All Models are Synced with Database Tables`)
        dbLogger(`Database initialization completed successfully`)

        return { message: 'Database initialized successfully', connected: true }

    } catch (error: any) {

        // Log error
        dbLogger(`Error during database initialization: ${error.message}`, { level: 'error', error: error })

        // Do not throw, just return a failed state
        return { message: `Database unavailable: ${error.message}`, connected: false }
    }
}