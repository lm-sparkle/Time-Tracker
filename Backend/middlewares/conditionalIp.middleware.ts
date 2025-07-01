import { Request, Response, NextFunction } from 'express';
import { ipRestrict } from './ip.middleware';

const BYPASS_EMAIL = process.env.BYPASS_EMAIL;

export function conditionalIpRestrict(req: Request, res: Response, next: NextFunction) {
  const email =
    (req as any).user?.email || 
    req.body?.email || 
    req.query?.email || 
    req.headers['x-email'];

  if (email && email === BYPASS_EMAIL) {
    console.log(`Bypassing IP restriction for email: ${email}`);
    
    return next();
  }

  return ipRestrict(req, res, next);
}
