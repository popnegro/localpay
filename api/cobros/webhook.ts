// Vercel Serverless Function: POST /api/cobros/webhook
export default function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { paymentId, amount, status, payerInfo } = req.body || {};

  // Validates incoming webhook payload
  if (!paymentId || !amount) {
    return res.status(400).json({ error: 'Missing paymentId or amount in payload' });
  }

  return res.status(200).json({
    received: true,
    processedAt: new Date().toISOString(),
    event: 'payment.confirmed',
    data: {
      paymentId,
      amount,
      status: status || 'approved',
      payer: payerInfo || 'Billetera Virtual QR',
      semaforo: 'green'
    }
  });
}
