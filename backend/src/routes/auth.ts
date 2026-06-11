import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { db, auth } from '../config/firebase';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Register
router.post('/register', async (req: AuthRequest, res: Response) => {
  try {
    const { uid, email, name } = req.body;

    // Create user document in Firestore
    const walletId = uuidv4();
    await db.collection('users').doc(uid).set({
      email,
      name,
      walletId,
      balance: 0,
      status: 'active',
      role: 'user',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // Create wallet document
    await db.collection('wallets').doc(walletId).set({
      userId: uid,
      balance: 0,
      accountNumber: `ACC-${Date.now()}`,
      createdAt: new Date(),
    });

    res.json({ message: 'User registered successfully', uid });
  } catch (error) {
    res.status(400).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    // This would typically be handled by Firebase Client SDK
    res.json({ message: 'Login successful' });
  } catch (error) {
    res.status(400).json({ error: 'Login failed' });
  }
});

// Check auth status
router.get('/check', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = await db.collection('users').doc(req.uid).get();
    if (!user.exists) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user.data());
  } catch (error) {
    res.status(400).json({ error: 'Check failed' });
  }
});

export default router;
