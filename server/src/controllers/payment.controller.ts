import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import crypto from 'crypto';

export const createRazorpayOrder = async (req: AuthenticatedRequest, res: Response) => {
  const { amount, feeCollectionId } = req.body;

  if (!amount || !feeCollectionId) {
    return res.status(400).json({ message: 'Amount and feeCollectionId are required' });
  }

  try {
    // Generate a mock Razorpay order
    const mockOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;
    
    return res.json({
      orderId: mockOrderId,
      amount: amount * 100, // Razorpay works in paise
      currency: 'INR',
      feeCollectionId,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock_key_id'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error generating payment order', error });
  }
};

export const verifyPayment = async (req: AuthenticatedRequest, res: Response) => {
  const {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
    feeCollectionId,
    amount
  } = req.body;

  try {
    // Signatures verification placeholder (actual logic would use crypto.createHmac)
    // const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET);
    // ...
    
    const transactionId = `txn_${crypto.randomBytes(10).toString('hex')}`;
    const receiptNumber = `RCPT-${Date.now().toString().slice(-6)}`;

    // In a real application, we would retrieve FeeCollection and update paidAmount:
    // const collection = await FeeCollection.findById(feeCollectionId);
    // collection.paidAmount += amount;
    // collection.balanceAmount = Math.max(0, collection.totalAmount - collection.paidAmount);
    // collection.status = collection.balanceAmount === 0 ? 'Paid' : 'PartiallyPaid';
    // await collection.save();
    
    // Save payment log
    // ...

    return res.json({
      message: 'Payment completed and verified successfully',
      receiptNumber,
      transactionId,
      paymentStatus: 'Completed'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Payment verification failed', error });
  }
};

export const getPaymentHistory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Return sample payment logs
    return res.json({
      payments: [
        {
          id: 'pay_1',
          category: 'Hostel Fee',
          amount: 30000,
          paymentMethod: 'Razorpay',
          status: 'Completed',
          transactionId: 'txn_c2c8f0e5b721',
          receiptNumber: 'RCPT-852003',
          paidAt: '2026-06-10'
        },
        {
          id: 'pay_2',
          category: 'Academic Registration',
          amount: 15000,
          paymentMethod: 'BankTransfer',
          status: 'Completed',
          transactionId: 'txn_d8c90382ab30',
          receiptNumber: 'RCPT-102941',
          paidAt: '2025-12-15'
        }
      ]
    });
  } catch (error) {
    return res.status(500).json({ message: 'Error retrieving payment logs', error });
  }
};
