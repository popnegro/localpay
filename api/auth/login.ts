// Vercel Serverless Function: POST /api/auth/login
export default function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      error: 'Correo electrónico y contraseña requeridos.'
    });
  }

  // Sanitized user verification
  const normalizedEmail = String(email).trim().toLowerCase();
  
  // Verified test accounts with assigned roles
  if (normalizedEmail === 'admin@localpay.com' && password === '123456') {
    const token = 'lp_sec_tok_' + Buffer.from(Date.now() + ':' + normalizedEmail).toString('base64');
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: 'usr_admin_01',
        name: 'Administrador General',
        email: 'admin@localpay.com',
        role: 'admin',
        branch: 'Sucursal Mendoza Centro',
        cajaId: 'CAJA-01'
      }
    });
  }

  if (normalizedEmail === 'cajero@localpay.com' && password === 'cajero2025') {
    const token = 'lp_sec_tok_' + Buffer.from(Date.now() + ':' + normalizedEmail).toString('base64');
    return res.status(200).json({
      success: true,
      token,
      user: {
        id: 'usr_caja_02',
        name: 'Operador de Turno',
        email: 'cajero@localpay.com',
        role: 'cajero',
        branch: 'Sucursal Mendoza Centro',
        cajaId: 'CAJA-02'
      }
    });
  }

  return res.status(401).json({
    success: false,
    error: 'Credenciales inválidas. Verifique su email y contraseña.'
  });
}
