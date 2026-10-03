let filaMock = [
  { idItemPedido: 1, nomeItem: "Suco de Laranja", categoria: "Bebidas", status: "pendente", pontuacaoPrioridade: 3.0, mesa: 7, tempoEsperaMin: 2 },
  { idItemPedido: 2, nomeItem: "Filé ao Molho Madeira", categoria: "Prato Principal", status: "pendente", pontuacaoPrioridade: 1.2, mesa: 3, tempoEsperaMin: 8 },
  { idItemPedido: 3, nomeItem: "Bruschetta", categoria: "Entrada", status: "em preparo", pontuacaoPrioridade: 1.8, mesa: 7, tempoEsperaMin: 5 },
];

export async function buscarFilaKDS() {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve([...filaMock]);
        }, 300);
    });
}
export async function atualizarStatusItem(idItemPedido, novoStatus) {
  return new Promise((resolve) => {
    setTimeout(() => {
      filaMock = filaMock.map((item) =>
        item.idItemPedido === idItemPedido ? { ...item, status: novoStatus } : item);
      resolve({ sucesso: true });
    }, 300);
  });
}
