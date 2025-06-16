import { Router, Request, Response } from 'express';
import { WorkloadController } from './workload.controller';

export class WorkloadRoute {
    public router: Router;
    private workload_controller: WorkloadController;

    constructor() {
        this.router = Router();
        this.workload_controller = new WorkloadController();
        this.configureRoutes();
    }

    private configureRoutes(): void {
        this.router.get('/', (req: Request, res: Response) => {
            this.workload_controller.getWorkload(req, res);
        });
    }
} 