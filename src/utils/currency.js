/**
 * Máscara de moeda em tempo real (cents-first).
 *
 * Recebe o texto bruto do onChangeText, extrai só dígitos
 * e formata como valor em reais com 2 casas decimais.
 *
 * Ex:  "2"    → "0,02"
 *      "25"   → "0,25"
 *      "250"  → "2,50"
 *      "2500" → "25,00"
 *
 * Use com keyboardType="number-pad" para aceitar só dígitos.
 */
export function formatCurrencyInput(text) {
  const digits = text.replace(/\D/g, '');
  if (!digits) return '';
  // Limita a 7 dígitos → máximo R$ 99.999,99
  const limited = digits.slice(-7);
  const number = parseInt(limited, 10);
  return (number / 100).toFixed(2).replace('.', ',');
}

/**
 * Converte o valor mascarado de volta para número.
 * Ex: "25,00" → 25.0
 */
export function parseCurrency(formatted) {
  if (!formatted) return 0;
  return parseFloat(formatted.replace(',', '.')) || 0;
}
