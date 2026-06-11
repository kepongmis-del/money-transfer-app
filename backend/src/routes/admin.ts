import { Router, Response } from 'express';
import { AuthRequest, adminMiddleware } from '../middleware/auth';
import { db } from '../config/firebase';

const router = Router();

// Get all users
router.get('/users', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const snapshot = await db.collection('users').limit(100).get();
    const users = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    res.json(users);
  } catch (error) {
    res.status(400).json({ error: 'Failed to fetch users' });
  }
});

// Get all transactions
router.get(
  '/transactions',
  adminMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const snapshot = await db
        .collection('transactions')
        .orderBy('timestamp', 'desc')
        .limit(100)
        .get();
      const transactions = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      res.json(transactions);
    } catch (error) {
      res.status(400).json({ error: 'Failed to fetch transactions' });
    }
  }
);

// Get analytics
router.get('/analytics', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const usersSnapshot = await db.collection('users').get();
    const transactionsSnapshot = await db.collection('transactions').get();

    const totalUsers = usersSnapshot.size;
    const totalTransactions = transactionsSnapshot.size;
    const totalVolume = transactionsSnapshot.docs.reduce(
      (sum, doc) => sum + (doc.data().amount || 0),
      0
    );

    res.json({
      totalUsers,
      totalTransactions,
      totalVolume,
      successRate: 98,
    });
  } catch (error) {
    res.status(400).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
