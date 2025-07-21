import { initializePermissionsAndRoles } from '../roles/initialize-permissions';
import logger from '../logger';

/**
 * Initialize permissions and roles during application startup
 * This function should be called when the application starts to ensure
 * all system permissions and default roles are properly set up
 */
export async function initializePermissionsOnStartup(): Promise<void> {
  try {
    logger.info('Starting permission initialization during application startup...');
    
    await initializePermissionsAndRoles();
    
    logger.info('Permission initialization completed successfully during startup');
  } catch (error) {
    logger.error('Permission initialization failed during startup', { error });
    // Don't throw the error to prevent application startup failure
    // Just log it and continue with the application startup
  }
} 