import { Request, Response, NextFunction } from 'express';

const ALLOWED_IP = process.env.ALLOWED_IP;
const BYPASS_EMAIL = process.env.BYPASS_EMAIL;

export function ipRestrict(req: Request, res: Response, next: NextFunction) {
  try {
    const userEmail =
      (req as any).user?.email || 
      req.body?.email ||         
      req.query?.email ||         
      req.headers['x-email'];    

    if (userEmail && userEmail === BYPASS_EMAIL) {
      return next(); 
    }

    const forwarded = req.headers['x-forwarded-for'] as string | undefined;
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;

    if (clientIp === ALLOWED_IP || clientIp === `::ffff:${ALLOWED_IP}`) {
      return next();
    }

    return res.status(403).send('Access denied: Your IP is not allowed.');
  } catch (error) {
    console.error('IP Restriction Error:', error);
    return res.status(500).send('Internal Server Error');
  }
}
