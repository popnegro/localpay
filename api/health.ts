import type { Request, Response } from 'express';

export default function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
  res.status(200).json({
    status: 'ok',
    environment: 'vercel-serverless',
    timestamp: new Date().toISOString(),
    version: '2.1.0-reformed'
  });
}
