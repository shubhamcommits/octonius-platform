import { Request, Response } from 'express'
import { ResourceManagerService } from './resource-manager.service'
import { logger, sendResponse, sendError, sendValidationError, validateParameters, validateEnvironment } from '../shared'

export class ResourceManagerController {
  private service: ResourceManagerService

  constructor() {
    this.service = new ResourceManagerService()
  }

  // Manual shutdown endpoint
  public manualShutdown = async (req: Request, res: Response) => {
    try {
      logger.info('Manual shutdown triggered', { 
        component: 'controller', 
        action: 'manual-shutdown'
      })

      const result = await this.service.shutdownResources()
      
      return sendResponse(req, res, 200, {
        message: 'Resources shutdown successfully',
        data: result
      })
    } catch (error: any) {
      logger.error('Manual shutdown failed', { 
        component: 'controller', 
        action: 'manual-shutdown',
        error: error instanceof Error ? error : new Error(String(error))
      })
      
      return sendError(res, error, 'Failed to shutdown resources', 500)
    }
  }

  // Manual startup endpoint
  public manualStartup = async (req: Request, res: Response) => {
    try {
      logger.info('Manual startup triggered', { 
        component: 'controller', 
        action: 'manual-startup'
      })

      const result = await this.service.startupResources()
      
      return sendResponse(req, res, 200, {
        message: 'Resources started successfully',
        data: result
      })
    } catch (error: any) {
      logger.error('Manual startup failed', { 
        component: 'controller', 
        action: 'manual-startup',
        error: error instanceof Error ? error : new Error(String(error))
      })
      
      return sendError(res, error, 'Failed to startup resources', 500)
    }
  }

  // Get resource status
  public getResourceStatus = async (req: Request, res: Response) => {
    try {
      logger.info('Getting resource status', { 
        component: 'controller', 
        action: 'get-status'
      })

      const status = await this.service.getResourceStatus()
      
      return sendResponse(req, res, 200, {
        message: 'Resource status retrieved successfully',
        data: status
      })
    } catch (error: any) {
      logger.error('Get status failed', { 
        component: 'controller', 
        action: 'get-status',
        error: error instanceof Error ? error : new Error(String(error))
      })
      
      return sendError(res, error, 'Failed to get resource status', 500)
    }
  }

  // Scheduled shutdown endpoint
  public shutdown = async (req: Request, res: Response) => {
    try {
      logger.info('Scheduled shutdown triggered', { 
        component: 'controller', 
        action: 'scheduled-shutdown'
      })

      const result = await this.service.shutdownResources()
      
      return sendResponse(req, res, 200, {
        message: 'Scheduled shutdown completed',
        data: result
      })
    } catch (error: any) {
      logger.error('Scheduled shutdown failed', { 
        component: 'controller', 
        action: 'scheduled-shutdown',
        error: error instanceof Error ? error : new Error(String(error))
      })
      
      return sendError(res, error, 'Failed to shutdown resources', 500)
    }
  }

  // Scheduled startup endpoint
  public startup = async (req: Request, res: Response) => {
    try {
      logger.info('Scheduled startup triggered', { 
        component: 'controller', 
        action: 'scheduled-startup'
      })

      const result = await this.service.startupResources()
      
      return sendResponse(req, res, 200, {
        message: 'Scheduled startup completed',
        data: result
      })
    } catch (error: any) {
      logger.error('Scheduled startup failed', { 
        component: 'controller', 
        action: 'scheduled-startup',
        error: error instanceof Error ? error : new Error(String(error))
      })
      
      return sendError(res, error, 'Failed to startup resources', 500)
    }
  }

  // Get status endpoint
  public getStatus = async (req: Request, res: Response) => {
    try {
      const status = await this.service.getResourceStatus()
      
      return sendResponse(req, res, 200, {
        message: 'Status retrieved successfully',
        data: status
      })
    } catch (error: any) {
      logger.error('Get status failed', { 
        component: 'controller', 
        action: 'get-status',
        error: error instanceof Error ? error : new Error(String(error))
      })
      
      return sendError(res, error, 'Failed to get status', 500)
    }
  }

  // Get schedule endpoint
  public getSchedule = async (req: Request, res: Response) => {
    try {
      const schedules = await this.service.getSchedules()
      
      res.status(200).json({
        success: true,
        data: schedules
      })
    } catch (error: any) {
      logger.error('Get schedules failed', { 
        component: 'controller', 
        action: 'get-schedules',
        error: error instanceof Error ? error : new Error(String(error))
      })
      
      res.status(500).json({
        success: false,
        message: 'Failed to get schedules',
        error: error.message
      })
    }
  }

  // Create schedule endpoint
  public createSchedule = async (req: Request, res: Response) => {
    try {
      const { name, cron, action, environment } = req.body
      
      const schedule = await this.service.createSchedule(name, cron, action, environment)
      
      res.status(201).json({
        success: true,
        message: 'Schedule created successfully',
        data: schedule
      })
    } catch (error: any) {
      logger.error('Create schedule failed', { 
        component: 'controller', 
        action: 'create-schedule',
        error: error instanceof Error ? error : new Error(String(error))
      })
      
      res.status(500).json({
        success: false,
        message: 'Failed to create schedule',
        error: error.message
      })
    }
  }

  // Delete schedule endpoint
  public deleteSchedule = async (req: Request, res: Response) => {
    try {
      const { id } = req.params
      
      await this.service.deleteSchedule(id)
      
      res.status(200).json({
        success: true,
        message: 'Schedule deleted successfully'
      })
    } catch (error: any) {
      logger.error('Delete schedule failed', { 
        component: 'controller', 
        action: 'delete-schedule',
        error: error instanceof Error ? error : new Error(String(error))
      })
      
      res.status(500).json({
        success: false,
        message: 'Failed to delete schedule',
        error: error.message
      })
    }
  }

  // CloudWatch Management Endpoints

  // Analyze CloudWatch costs
  public analyzeCloudWatchCosts = async (req: Request, res: Response) => {
    try {
      logger.info('CloudWatch cost analysis requested', { 
        component: 'controller', 
        action: 'analyze-cloudwatch-costs',
        region: req.query.region
      })

      const region = req.query.region as string
      const analysis = await this.service.getFormattedCloudWatchCosts(region)
      
      return sendResponse(req, res, 200, {
        message: 'CloudWatch cost analysis completed',
        data: analysis
      })
    } catch (error: any) {
      logger.error('CloudWatch cost analysis failed', { 
        component: 'controller', 
        action: 'analyze-cloudwatch-costs',
        error: error instanceof Error ? error : new Error(String(error))
      })
      
      return sendError(res, error, 'Failed to analyze CloudWatch costs', 500)
    }
  }

  // Optimize CloudWatch logs
  public optimizeCloudWatchLogs = async (req: Request, res: Response) => {
    try {
      logger.info('CloudWatch optimization requested', { 
        component: 'controller', 
        action: 'optimize-cloudwatch-logs',
        region: req.query.region
      })

      const region = req.query.region as string
      const result = await this.service.optimizeCloudWatchLogs(region)
      
      return sendResponse(req, res, 200, {
        message: 'CloudWatch optimization completed',
        data: result
      })
    } catch (error: any) {
      logger.error('CloudWatch optimization failed', { 
        component: 'controller', 
        action: 'optimize-cloudwatch-logs',
        error: error instanceof Error ? error : new Error(String(error))
      })
      
      return sendError(res, error, 'Failed to optimize CloudWatch logs', 500)
    }
  }

  // Get CloudWatch alarms
  public getCloudWatchAlarms = async (req: Request, res: Response) => {
    try {
      logger.info('CloudWatch alarms requested', { 
        component: 'controller', 
        action: 'get-cloudwatch-alarms',
        region: req.query.region
      })

      const region = req.query.region as string
      const alarms = await this.service.getCloudWatchAlarms(region)
      
      return sendResponse(req, res, 200, {
        message: 'CloudWatch alarms retrieved successfully',
        data: {
          alarms,
          count: alarms.length
        }
      })
    } catch (error: any) {
      logger.error('Get CloudWatch alarms failed', { 
        component: 'controller', 
        action: 'get-cloudwatch-alarms',
        error: error instanceof Error ? error : new Error(String(error))
      })
      
      return sendError(res, error, 'Failed to get CloudWatch alarms', 500)
    }
  }

  // S3 Management endpoints
  /**
   * Analyze S3 costs and provide recommendations
   */
  public analyzeS3Costs = async (req: Request, res: Response) => {
    try {
      const { region } = req.query
      
      const analysis = await this.service.getFormattedS3Costs(region as string)
      
      return sendResponse(req, res, 200, {
        message: 'S3 cost analysis completed',
        data: analysis
      })
    } catch (error: any) {
      logger.error('S3 cost analysis failed', { 
        component: 'controller', 
        action: 'analyze-s3-costs',
        error: error instanceof Error ? error : new Error(String(error))
      })
      
      return sendError(res, error, 'Failed to analyze S3 costs', 500)
    }
  }

  /**
   * Apply S3 optimizations
   */
  public optimizeS3Buckets = async (req: Request, res: Response) => {
    try {
      const { region } = req.query
      
      const result = await this.service.optimizeS3Buckets(region as string)
      
      return sendResponse(req, res, 200, {
        message: 'S3 optimization completed',
        data: result
      })
    } catch (error: any) {
      logger.error('S3 optimization failed', { 
        component: 'controller', 
        action: 'optimize-s3-buckets',
        error: error instanceof Error ? error : new Error(String(error))
      })
      
      return sendError(res, error, 'Failed to optimize S3 buckets', 500)
    }
  }
}
