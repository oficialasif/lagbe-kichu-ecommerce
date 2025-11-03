import { IUser } from '../models/User.model';
import multer from 'multer';

declare global {
  namespace Express {
    namespace Multer {
      interface File extends multer.File {}
    }
    interface Request {
      user?: IUser;
      files?: { [fieldname: string]: multer.File[] } | multer.File[];
    }
  }
}

export {};

