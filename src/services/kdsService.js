import {
  obterPedidosStorage,
  salvarPedidosStorage,
} from "./pedidosStorage.js";

export async function buscarFilaKDS() {
  return new Promise((resolve) => {
    setTimeout(() => {
      const todos = obterPedidosStorage();
      resolve([...todos]);
    }, 200);
  });
}

export async function atualizarStatusItem(idItemPedido, novoStatus) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const todos = obterPedidosStorage();
      const atualizados = todos.map((item) => {
        if (item.idItemPedido === idItemPedido) {
          const itemAtualizado = { ...item, status: novoStatus };
          if (novoStatus === "pronto") {
            itemAtualizado.horarioPronto = new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            });
          }
          return itemAtualizado;
        }
        return item;
      });
      salvarPedidosStorage(atualizados);
      resolve({ sucesso: true });
    }, 200);
  });
}
