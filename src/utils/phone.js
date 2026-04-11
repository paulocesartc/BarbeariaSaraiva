/**
 * Formata telefone brasileiro em tempo real.
 * Celular: (11) 99999-9999
 * Fixo:    (11) 9999-9999
 */
export function formatPhone(text) {
  const digits = text.replace(/\D/g, '').slice(0, 11);
  const len = digits.length;

  if (len === 0) return '';
  if (len <= 2) return `(${digits}`;
  if (len <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (len <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/** Remove tudo que não é dígito */
export function unformatPhone(text) {
  return (text ?? '').replace(/\D/g, '');
}
