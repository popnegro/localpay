/**
 * Validador oficial de CUIT/CUIL de la República Argentina mediante algoritmo de Módulo 11.
 * Formato esperado: 11 dígitos numéricos (ej. 20-12345678-9 o 20123456789)
 */
export function validateCUIT(cuit: string): { valid: boolean; message: string; formatted: string } {
  // Limpiar caracteres no numéricos
  const clean = String(cuit || '').replace(/\D/g, '');

  if (clean.length !== 11) {
    return {
      valid: false,
      message: `El CUIT debe tener exactamente 11 dígitos (actual: ${clean.length}).`,
      formatted: clean,
    };
  }

  // Prefijos válidos en AFIP/ARCA
  const validPrefixes = ['20', '23', '24', '27', '30', '33', '34'];
  const prefix = clean.substring(0, 2);
  if (!validPrefixes.includes(prefix)) {
    return {
      valid: false,
      message: `El prefijo "${prefix}" no corresponde a un tipo válido de CUIT (esperado: 20, 23, 24, 27, 30, 33 o 34).`,
      formatted: clean,
    };
  }

  // Coeficientes de ponderación para módulo 11
  const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
  let sum = 0;

  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean[i], 10) * weights[i];
  }

  const mod = sum % 11;
  let verifier = 11 - mod;

  if (verifier === 11) verifier = 0;
  if (verifier === 10) verifier = 9;

  const actualVerifier = parseInt(clean[10], 10);

  if (verifier !== actualVerifier) {
    return {
      valid: false,
      message: `Dígito verificador inválido: se calculó "${verifier}" pero se ingresó "${actualVerifier}".`,
      formatted: `${clean.substring(0, 2)}-${clean.substring(2, 10)}-${clean.substring(10)}`,
    };
  }

  return {
    valid: true,
    message: 'CUIT fiscalmente válido (Algoritmo Módulo 11 verificado).',
    formatted: `${clean.substring(0, 2)}-${clean.substring(2, 10)}-${clean.substring(10)}`,
  };
}
