/**
 * Utilitários para formatação e máscaras de inputs
 */

// Formata CNPJ: 00.000.000/0000-00
export function formatarCNPJ(valor) {
  const digitos = (valor || '').replace(/\D/g, '').slice(0, 14);
  return digitos
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

// Formata CPF: 000.000.000-00
export function formatarCPF(valor) {
  const digitos = (valor || '').replace(/\D/g, '').slice(0, 11);
  return digitos
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1-$2');
}

// Formata Telefone: (00) 0000-0000 ou (00) 00000-0000
export function formatarTelefone(valor) {
  const digitos = (valor || '').replace(/\D/g, '').slice(0, 11);
  if (digitos.length <= 10) {
    return digitos
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  return digitos
    .replace(/^(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2');
}

// Formata CEP: 00000-000
export function formatarCEP(valor) {
  const digitos = (valor || '').replace(/\D/g, '').slice(0, 8);
  return digitos.replace(/^(\d{5})(\d)/, '$1-$2');
}
