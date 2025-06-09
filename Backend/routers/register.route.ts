import { Router } from 'express';
import { register } from '../controllers/register.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register',authenticateJWT, register);

export default router;
