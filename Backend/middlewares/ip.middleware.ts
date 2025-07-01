import { Request, Response, NextFunction } from 'express';

const ALLOWED_IP = process.env.ALLOWED_IP;
const BYPASS_EMAIL = process.env.BYPASS_EMAIL;

export function ipRestrict(req: Request, res: Response, next: NextFunction) {
  try {
    const userEmail =
      (req as any).user?.email || // after login (authenticated)
      req.body?.email ||          // during login/register
      req.query?.email ||         // optional: GET requests
      req.headers['x-email'];     // optional: custom header

    if (userEmail && userEmail === BYPASS_EMAIL) {
      return next(); // bypass based on email
    }

    const forwarded = req.headers['x-forwarded-for'] as string | undefined;
    const clientIp = forwarded ? forwarded.split(',')[0].trim() : req.socket.remoteAddress;

    if (clientIp === ALLOWED_IP || clientIp === `::ffff:${ALLOWED_IP}`) {
      return next(); // allow if IP matches
    }

    res.status(403).send('Access denied: Your IP is not allowed.');
  } catch (error) {
    console.error('IP Restriction Error:', error);
    res.status(500).send('Internal Server Error');
  }

  res.status(403).send('Access denied: Your IP is not allowed.');
}
