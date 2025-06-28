import { Router, Request, Response } from 'express';
import { LoungeController } from './lounge.controller';
import { LoungeService } from './lounge.service';
// Add auth middleware if needed: import { verifyAccessToken, isLoggedIn } from '../middleware';

export class LoungeRoute {
  public router: Router;
  private lounge_controller: LoungeController;

  constructor() {
    this.router = Router();
    this.lounge_controller = new LoungeController(new LoungeService());
    this.configureRoutes();
  }

  private configureRoutes(): void {
    // List all stories
    this.router.get('/', (req: Request, res: Response) => this.lounge_controller.list(req, res));
    // Get a story by UUID
    this.router.get('/:uuid', (req: Request, res: Response) => this.lounge_controller.get(req, res));
    // Create a new story
    this.router.post('/', (req: Request, res: Response) => this.lounge_controller.create(req, res));
    // Update a story
    this.router.put('/:uuid', (req: Request, res: Response) => this.lounge_controller.update(req, res));
    // Delete a story
    this.router.delete('/:uuid', (req: Request, res: Response) => this.lounge_controller.delete(req, res));
  }
} 