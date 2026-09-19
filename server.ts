import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Memoria volátil para historial de webhooks y clientes SSE en tiempo real
interface WebhookEvent {
  id: string;
  provider: 'mercadopago' | 'modo' | 'cuentadni';
  topic?: string;
  action?: string;
  status: 'aprobado' | 'pendiente' | 'rechazado';
  monto: number;
  cajaId: string;
  referencia: string;
  timestamp: string;
  rawPayload: unknown;
}

const webhookEventsHistory: WebhookEvent[] = [
  {
    id: 'wh_init_01',
    provider: 'mercadopago',
    topic: 'payment',
    action: 'payment.created',
    status: 'aprobado',
    monto: 14500,
    cajaId: 'CAJA-01',
    referencia: 'TX-901',
    timestamp: '2026-09-19 13:45:10',
    rawPayload: { type: 'payment', id: '1099238471', status: 'approved' },
  },
  {
    id: 'wh_init_02',
    provider: 'modo',
    topic: 'transfer',
    action: 'qr.scanned',
    status: 'aprobado',
    monto: 12400,
    cajaId: 'CAJA-01',
    referencia: 'TX-904',
    timestamp: '2026-09-19 14:28:05',
    rawPayload: { bank: 'Banco Galicia', transactionId: 'MODO-88271', status: 'COMPLETED' },
  },
];

// Clientes SSE (Server-Sent Events) para avisos en 0ms a terminales POS
const sseClients: { id: string; res: Response; cajaId?: string }[] = [];

const broadcastToSSEClients = (event: WebhookEvent) => {
  const data = JSON.stringify(event);
  sseClients.forEach((client) => {
    if (!client.cajaId || client.cajaId === event.cajaId || client.cajaId === 'ALL') {
      try {
        client.res.write(`data: ${data}\n\n`);
      } catch (err) {
        console.error('Error enviando SSE:', err);
      }
    }
  });
};

// ============================================================================
// 1. ENDPOINT: SSE STREAM PARA COBROS EN TIEMPO REAL (TERMINAL POS)
// ============================================================================
app.get('/api/pos/events', (req: Request, res: Response) => {
  const cajaId = (req.query.cajaId as string) || 'CAJA-01';
  const clientId = 'client_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  // Enviar mensaje inicial de handshake
  res.write(`data: ${JSON.stringify({ type: 'HANDSHAKE', status: 'connected', cajaId, clientId })}\n\n`);

  const newClient = { id: clientId, res, cajaId };
  sseClients.push(newClient);

  req.on('close', () => {
    const index = sseClients.findIndex((c) => c.id === clientId);
    if (index !== -1) {
      sseClients.splice(index, 1);
    }
  });
});

// ============================================================================
// 2. ENDPOINT: WEBHOOK MERCADO PAGO (IPN / Webhooks v1 y v2)
// ============================================================================
app.post('/api/webhooks/mercadopago', (req: Request, res: Response) => {
  try {
    const { action, type, data, live_mode } = req.body || {};
    const queryTopic = req.query.topic || req.query.type;
    const queryId = req.query.id || (data && data.id);

    // Extraer o inferir monto y caja destino (vía external_reference)
    const monto = req.body.monto ? Number(req.body.monto) : (req.body.transaction_amount || 4500);
    const cajaId = (req.body.external_reference as string) || (req.query.caja as string) || 'CAJA-01';
    const status = (req.body.status === 'rejected' ? 'rechazado' : 'aprobado') as 'aprobado' | 'rechazado';

    const event: WebhookEvent = {
      id: 'mp_' + Date.now(),
      provider: 'mercadopago',
      topic: String(queryTopic || type || 'payment'),
      action: String(action || 'payment.updated'),
      status,
      monto,
      cajaId,
      referencia: `MP-${queryId || Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      rawPayload: req.body,
    };

    webhookEventsHistory.unshift(event);
    if (webhookEventsHistory.length > 50) webhookEventsHistory.pop();

    // Notificar inmediatamente a las terminales activas vía SSE
    broadcastToSSEClients(event);

    console.log(`[LocalPay Webhook] Mercado Pago recibido para ${cajaId} por $${monto}`);
    return res.status(200).json({
      received: true,
      provider: 'mercadopago',
      eventId: event.id,
      cajaId,
      status: 'processed',
    });
  } catch (error) {
    console.error('[LocalPay Webhook] Error procesando webhook MP:', error);
    return res.status(500).json({ error: 'Error procesando webhook' });
  }
});

// ============================================================================
// 3. ENDPOINT: WEBHOOK MODO / TRANSFERENCIAS 3.0 (BCRA - COELSA)
// ============================================================================
app.post('/api/webhooks/modo', (req: Request, res: Response) => {
  try {
    const { transaction_id, status, amount, terminal_id } = req.body || {};
    const cajaId = terminal_id || (req.query.caja as string) || 'CAJA-01';
    const monto = amount ? Number(amount) : 3800;

    const event: WebhookEvent = {
      id: 'modo_' + Date.now(),
      provider: 'modo',
      topic: 'interoperable_qr',
      action: 'transfer.completed',
      status: status === 'REJECTED' ? 'rechazado' : 'aprobado',
      monto,
      cajaId,
      referencia: `MODO-${transaction_id || Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      rawPayload: req.body,
    };

    webhookEventsHistory.unshift(event);
    if (webhookEventsHistory.length > 50) webhookEventsHistory.pop();

    broadcastToSSEClients(event);

    return res.status(200).json({
      received: true,
      provider: 'modo',
      eventId: event.id,
      cajaId,
      status: 'processed',
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error procesando webhook MODO' });
  }
});

// ============================================================================
// 4. ENDPOINT: WEBHOOK CUENTA DNI / BNA+
// ============================================================================
app.post('/api/webhooks/cuentadni', (req: Request, res: Response) => {
  try {
    const { operacion_id, importe, terminal } = req.body || {};
    const cajaId = terminal || 'CAJA-01';
    const monto = importe ? Number(importe) : 5200;

    const event: WebhookEvent = {
      id: 'dni_' + Date.now(),
      provider: 'cuentadni',
      topic: 'banco_provincia_qr',
      action: 'cobro_instantaneo',
      status: 'aprobado',
      monto,
      cajaId,
      referencia: `DNI-${operacion_id || Math.floor(100000 + Math.random() * 900000)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      rawPayload: req.body,
    };

    webhookEventsHistory.unshift(event);
    if (webhookEventsHistory.length > 50) webhookEventsHistory.pop();

    broadcastToSSEClients(event);

    return res.status(200).json({
      received: true,
      provider: 'cuentadni',
      eventId: event.id,
      cajaId,
    });
  } catch (error) {
    return res.status(500).json({ error: 'Error procesando webhook Cuenta DNI' });
  }
});

// ============================================================================
// 5. ENDPOINT: SIMULADOR DE WEBHOOK PARA TESTING EN VIVO
// ============================================================================
app.post('/api/pos/simulate-payment', (req: Request, res: Response) => {
  const { provider, monto, cajaId } = req.body || {};
  const prov = (provider || 'mercadopago') as 'mercadopago' | 'modo' | 'cuentadni';
  const amount = Number(monto) || 4500;
  const targetCaja = (cajaId as string) || 'CAJA-01';

  const event: WebhookEvent = {
    id: 'sim_' + Date.now(),
    provider: prov,
    topic: 'payment_simulation',
    action: 'simulated_instant_approval',
    status: 'aprobado',
    monto: amount,
    cajaId: targetCaja,
    referencia: `SIM-${Math.floor(1000 + Math.random() * 9000)}`,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
    rawPayload: { simulated: true, provider: prov, amount, targetCaja },
  };

  webhookEventsHistory.unshift(event);
  broadcastToSSEClients(event);

  return res.status(200).json({
    success: true,
    message: `Pago simulado con éxito de $${amount} para ${targetCaja}`,
    event,
  });
});

// ============================================================================
// 6. ENDPOINTS DE CONSULTA: HISTORIAL DE WEBHOOKS & STATUS DEL SERVIDOR
// ============================================================================
app.get('/api/webhooks/history', (_req: Request, res: Response) => {
  return res.status(200).json({
    total: webhookEventsHistory.length,
    events: webhookEventsHistory,
  });
});

app.get('/api/pos/status', (_req: Request, res: Response) => {
  return res.status(200).json({
    status: 'online',
    server: 'LocalPay Express POS Backend',
    activeSSEClients: sseClients.length,
    totalWebhooksProcessed: webhookEventsHistory.length,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// ============================================================================
// VITE MIDDLEWARE & SERVIDOR ESTÁTICO DE PRODUCCIÓN
// ============================================================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[LocalPay Server] Servidor activo en http://0.0.0.0:${PORT}`);
  });
}

startServer();
