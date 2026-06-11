import { Router, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { db, rtdb } from '../config/firebase';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Send money
router.post('/send', async (req: AuthRequest, res: Response) => {
  try {
    const { recipientId, amount, description } = req.body;

    if (amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Get sender wallet
    const sender = await db.collection('users').doc(req.uid).get();
    const senderData = sender.data();
    const senderWallet = await db
      .collection('wallets')
      .doc(senderData.walletId)
      .get();

    if (senderWallet.data().balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Get recipient wallet
    const recipient = await db.collection('users').doc(recipientId).get();
    if (!recipient.exists) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    const recipientData = recipient.data();
    const recipientWallet = await db
      .collection('wallets')
      .doc(recipientData.walletId)
      .get();

    // Create transaction
    const transactionId = uuidv4();
    const transaction = {
      id: transactionId,
      from: req.uid,
      to: recipientId,
      amount,
      description,
      status: 'completed',
      timestamp: new Date(),
    };

    // Update wallets
    await db
      .collection('wallets')
      .doc(senderData.walletId)
      .update({
        balance: senderWallet.data().balance - amount,
      });

    await db
      .collection('wallets')
      .doc(recipientData.walletId)
      .update({
        balance: recipientWallet.data().balance + amount,
      });

    // Store transaction
    await db.collection('transactions').doc(transactionId).set(transaction);

    res.json(transaction);
  } catch (error) {
    res.status(400).json({ error: 'Transfer failed' });
  }
});

// Get transaction history
router.get('/history', async (req: AuthRequest, res: Response) => {
  try {
    const snapshot = await db
      .collection('transactions')
      .where('from', '==', req.uid)
      .orderBy('timestamp', 'desc')
      .limit(50)
      .get();

    const transactions = snapshot.docs.map((doc) => doc.data());
    res.json(transactions);
  } catch (error) {
    res.status(400).json({ error: 'Failed to fetch history' });
  }
});

// Get transaction details
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const transaction = await db.collection('transactions').doc(req.params.id).get();

    if (!transaction.exists) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json(transaction.data());
  } catch (error) {
    res.status(400).json({ error: 'Failed to fetch transaction' });
  }
});

export default router;
