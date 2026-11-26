const RotaPerfil = {
  garcom: '/garcom',
  gerente: '/gerente',
  cozinha: '/cozinha',
  adm: '/administrativo',
  Garcom: '/garcom',
  Gerente: '/gerente',
  Cozinheiro: '/cozinha',
  Cozinha: '/cozinha',
  Adm: '/administrativo',
};

const MAPA_EXIBICAO_FUNCAO = {
  Garcom: 'Garçom',
  garcom: 'Garçom',
  WAITER: 'Garçom',
  Cozinheiro: 'Cozinheiro',
  cozinheiro: 'Cozinheiro',
  Cozinha: 'Cozinheiro',
  cozinha: 'Cozinheiro',
  Gerente: 'Gerente',
  gerente: 'Gerente',
  Adm: 'Adm',
  adm: 'Adm',
};

function formatarFuncao(funcao) {
  if (!funcao) return '—';
  const chave = String(funcao).trim();
  return MAPA_EXIBICAO_FUNCAO[chave] || chave;
}

export { RotaPerfil, formatarFuncao };