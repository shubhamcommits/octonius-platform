import { Request, Response } from 'express';
import { WorkloadService } from './workload.service';
import logger from '../logger';

export class WorkloadController {
    private workloadService: WorkloadService;

    constructor() {
        this.workloadService = new WorkloadService();
    }

    async getWorkload(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now();
        try {
            logger.info('Fetching workload', { method: req.method, path: req.path, query: req.query, ip: req.ip });
            const { user_id, workplace_id } = req.query;
            if (!user_id || !workplace_id) {
                return res.status(400).json({
                    success: false,
                    message: 'user_id and workplace_id are required',
                    meta: { responseTime: '0ms' }
                });
            }

            // Get workload data using the service
            const workloadData = await this.workloadService.getWorkload(
                user_id as string, 
                workplace_id as string
            );

            const responseTime = Date.now() - startTime;
            logger.info('Workload retrieved successfully', { 
                responseTime: `${responseTime}ms`, 
                statusCode: 200,
                taskCount: workloadData.stats.total
            });

            return res.status(200).json({
                success: true,
                data: {
                    workload: workloadData
                },
                meta: { responseTime: `${responseTime}ms` }
            });
        } catch (error: any) {
            const responseTime = Date.now() - startTime;
            logger.error('Error in getWorkload controller', { 
                error: error.message, 
                stack: error.stack, 
                responseTime: `${responseTime}ms`, 
                statusCode: 500, 
                query: req.query 
            });
            return res.status(error.code || 500).json({
                success: false,
                message: error.message,
                error: error.stack,
                meta: { responseTime: `${responseTime}ms` }
            });
        }
    }

    async getPaginatedTasks(req: Request, res: Response): Promise<Response> {
        const startTime = Date.now();
        try {
            logger.info('Fetching paginated tasks', { method: req.method, path: req.path, query: req.query, ip: req.ip });
            const { user_id, workplace_id, section, page = 1, limit = 5 } = req.query;
            
            if (!user_id || !workplace_id || !section) {
                return res.status(400).json({
                    success: false,
                    message: 'user_id, workplace_id, and section are required',
                    meta: { responseTime: '0ms' }
                });
            }

            // Validate section
            const validSections = ['today', 'tomorrow', 'thisWeek', 'nextWeek'];
            if (!validSections.includes(section as string)) {
                return res.status(400).json({
                    success: false,
                    message: 'section must be one of: today, tomorrow, thisWeek, nextWeek',
                    meta: { responseTime: '0ms' }
                });
            }

            // Get paginated tasks using the service
            const paginatedData = await this.workloadService.getPaginatedTasks(
                user_id as string,
                workplace_id as string,
                section as 'today' | 'tomorrow' | 'thisWeek' | 'nextWeek',
                parseInt(page as string),
                parseInt(limit as string)
            );

            const responseTime = Date.now() - startTime;
            logger.info('Paginated tasks retrieved successfully', { 
                responseTime: `${responseTime}ms`, 
                statusCode: 200,
                section,
                page: paginatedData.pagination.page,
                totalTasks: paginatedData.pagination.total
            });

            return res.status(200).json({
                success: true,
                data: paginatedData,
                meta: { responseTime: `${responseTime}ms` }
            });
        } catch (error: any) {
            const responseTime = Date.now() - startTime;
            logger.error('Error in getPaginatedTasks controller', { 
                error: error.message, 
                stack: error.stack, 
                responseTime: `${responseTime}ms`, 
                statusCode: 500, 
                query: req.query 
            });
            return res.status(error.code || 500).json({
                success: false,
                message: error.message,
                error: error.stack,
                meta: { responseTime: `${responseTime}ms` }
            });
        }
    }
} 