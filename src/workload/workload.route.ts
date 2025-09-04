import { Router, Request, Response } from 'express';
import { WorkloadController } from './workload.controller';
import { verifyAccessToken, isLoggedIn, requireWorkplace } from '../middleware';

export class WorkloadRoute {
    public router: Router;
    private workload_controller: WorkloadController;

    constructor() {
        this.router = Router();
        this.workload_controller = new WorkloadController();
        this.configureRoutes();
    }

    private configureRoutes(): void {
        // Get workload (requires auth and workplace)
        this.router.get('/', 
            verifyAccessToken,
            isLoggedIn,
            requireWorkplace,
            (req: Request, res: Response) => {
                this.workload_controller.getWorkload(req, res);
            }
        );
    }
} 