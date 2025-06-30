import { User } from '../../users/user.model';

declare global {
  namespace Express {
    interface User {
      uuid: string;
      name?: string;
      email?: string;
      avatar_url?: string;
      // add other fields as needed
    }
    interface Request {
      user?: User;
    }
  }
}

export {}; 