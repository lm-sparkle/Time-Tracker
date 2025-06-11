import { Request, Response, NextFunction } from 'express';

const ALLOWED_IP = process.env.ALLOWED_IP;

export function ipRestrict(req: Request, res: Response, next: NextFunction) {
  const forwarded = req.headers['x-forwarded-for'] as string | undefined;
  const clientIp = forwarded ? forwarded.split(',')[0].trim() : req.connection.remoteAddress;

  if (clientIp === ALLOWED_IP || clientIp === `::ffff:${ALLOWED_IP}`) {
    next();
  } else {
    res.status(403).send('Access denied: Your IP is not allowed.');
  }
}
