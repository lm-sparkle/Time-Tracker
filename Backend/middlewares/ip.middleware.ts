import { Request, Response, NextFunction } from 'express';

const ALLOWED_IP = process.env.ALLOWED_IP;
const BYPASS_EMAIL = process.env.BYPASS_EMAIL;

export function ipRestrict(req: Request, res: Response, next: NextFunction) {
  const userEmail = (req as any).user?.email;

  if (userEmail === BYPASS_EMAIL) {
    console.log('Bypassing IP restriction for:', userEmail);
    return next();
  }

  const forwarded = req.headers['x-forwarded-for'] as string | undefined;
  const clientIp = forwarded ? forwarded.split(',')[0].trim() : req.connection.remoteAddress;

  if (clientIp === ALLOWED_IP || clientIp === `::ffff:${ALLOWED_IP}`) {
    return next();
  }

  console.warn(`Blocked IP: ${clientIp}`);
  res.status(403).send('Access denied: Your IP is not allowed.');
}
