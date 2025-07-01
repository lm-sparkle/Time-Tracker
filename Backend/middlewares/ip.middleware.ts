import { Request, Response, NextFunction } from 'express';

declare global {
  namespace Express {
    interface Request {
      email?: string;
    }
  }
}

const ALLOWED_IP = process.env.ALLOWED_IP;
const BYPASS_EMAIL = process.env.BYPASS_EMAIL;

export function ipRestrict(req: Request, res: Response, next: NextFunction) {
  const user = req.body.email as { email?: string } | undefined;
  
  if (user && user === BYPASS_EMAIL) {
    return next();
  }

  const forwarded = req.headers['x-forwarded-for'] as string | undefined;
  const clientIp = forwarded ? forwarded.split(',')[0].trim() : req.connection.remoteAddress;

  if (clientIp === ALLOWED_IP || clientIp === `::ffff:${ALLOWED_IP}`) {
    return next();
  }

  res.status(403).send('Access denied: Your IP is not allowed.');
}
