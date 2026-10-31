/**
 * Regras de validação de senha forte do FastCooking
 * - Mínimo de 8 caracteres
 * - Pelo menos uma letra
 * - Pelo menos um número
 */

export function checarCriteriosSenha(senha) {
  const s = senha || '';
  return {
    temMinimo8: s.length >= 8,
    temLetra: /[a-zA-Z]/.test(s),
    temNumero: /[0-9]/.test(s),
    valida: s.length >= 8 && /[a-zA-Z]/.test(s) && /[0-9]/.test(s),
  };
}

export function validarSenhaForte(senha) {
  if (!senha || senha.length < 8) {
    return 'A senha deve conter no mínimo 8 caracteres.';
  }
  if (!/[a-zA-Z]/.test(senha)) {
    return 'A senha deve conter pelo menos uma letra (a-z ou A-Z).';
  }
  if (!/[0-9]/.test(senha)) {
    return 'A senha deve conter pelo menos um número (0-9).';
  }
  return null;
}
