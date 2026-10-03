import { useState, useEffect } from "react";
import { buscarFilaKDS, atualizarStatusItem } from "../services/kdsService.js";
import ItemFila from "../components/kds/ItemFila.jsx";

function TelaKDS() {
  const [fila, setFila] = useState([]);

  async function carregarFila() {
    try {
      const dados = await buscarFilaKDS();
      setFila(dados);
    } catch (erro) {
      console.error("Erro ao buscar fila do KDS:", erro);
    }
  }

  useEffect(() => {
    carregarFila();

    const intervalo = setInterval(() => {
      carregarFila();
    }, 1000);

    return () => clearInterval(intervalo);
  }, []);

  async function handleAvancarStatus(idItemPedido, novoStatus) {
    try {
      await atualizarStatusItem(idItemPedido, novoStatus);
      await carregarFila();
    } catch (erro) {
      console.error("Erro ao atualizar status:", erro);
    }
  }

  const filaOrdenada = [...fila].sort((a, b) => b.pontuacaoPrioridade - a.pontuacaoPrioridade);

  const filaAgrupada = filaOrdenada.reduce((grupos, item) => {
    const categoria = item.categoria;
    if (!grupos[categoria]) {
      grupos[categoria] = [];
    }
    grupos[categoria].push(item);
    return grupos;
  }, {});

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <h1 className="text-4xl font-bold text-white mb-6">Monitor de Cozinha</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(filaAgrupada).map(([categoria, itens]) => (
          <div key={categoria} className="bg-gray-800 rounded-xl p-4">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4">{categoria}</h2>
            {itens
              .filter((item) => item.status !== "pronto" || true)
              .map((item) => (
                <ItemFila key={item.idItemPedido} item={item} onAvancarStatus={handleAvancarStatus} />
              ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TelaKDS;