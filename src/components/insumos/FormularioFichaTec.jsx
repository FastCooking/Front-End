import { useState, useEffect } from "react";
import { criarFichaTecnica } from "../../services/fichaTecnicaService.js";
import { listarItensCardapio } from "../../services/cardapioService.js";
import { buscarInsumos } from "../../services/insumosService.js";
import { CiSquareRemove } from "react-icons/ci";

function FormularioFichaTec() {
  const [idCardapio, setIdCardapio] = useState("");
  const [insumoDaFicha, setInsumoDaFicha] = useState([]);
  
  const [itensCardapio, setItensCardapio] = useState([]);
  const [insumosDisponiveis, setInsumosDisponiveis] = useState([]);
  
  const [mensagemSucesso, setMensagemSucesso] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    try {
      const [cardapioData, insumosData] = await Promise.all([
        listarItensCardapio().catch(() => []),
        buscarInsumos().catch(() => []),
      ]);
      setItensCardapio(cardapioData || []);
      setInsumosDisponiveis(insumosData || []);
    } catch (e) {
      console.error("Erro ao carregar cardápio/insumos para ficha técnica:", e);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");
    setMensagemSucesso("");

    if (!idCardapio) {
      setErro("Selecione um prato do cardápio.");
      return;
    }

    if (insumoDaFicha.length === 0) {
      setErro("Adicione ao menos um insumo à ficha técnica.");
      return;
    }

    try {
      setSalvando(true);
      const fichaTecnica = {
        idCardapio: parseInt(idCardapio),
        insumos: insumoDaFicha.map((item) => ({
          idEstoque: parseInt(item.idInsumo),
          quantidadeNecessaria: parseFloat(item.quantidadeNecessaria),
        })),
      };

      const resultado = await criarFichaTecnica(fichaTecnica);
      console.log("Ficha Técnica criada:", resultado);
      setMensagemSucesso("Ficha técnica salva com sucesso!");
      setIdCardapio("");
      setInsumoDaFicha([]);
    } catch (erro) {
      console.error("Erro ao criar ficha técnica:", erro.message);
      setErro(erro.message || "Erro ao salvar ficha técnica.");
    } finally {
      setSalvando(false);
    }
  }

  function addLinha() {
    setInsumoDaFicha([...insumoDaFicha, { idInsumo: "", quantidadeNecessaria: "" }]);
  }

  function removeLinha(indice) {
    setInsumoDaFicha(insumoDaFicha.filter((_, i) => i !== indice));
  }

  function atualizarLinha(indice, campo, valor) {
    const novaLista = insumoDaFicha.map((item, i) => {
      if (i === indice) {
        return { ...item, [campo]: valor };
      }
      return item;
    });
    setInsumoDaFicha(novaLista);
  }

  return (
    <div className="flex items-center justify-center gap-6">
      <form onSubmit={handleSubmit} className="bg-white/60 rounded-2xl shadow-xl p-8 w-full max-w-lg">
        {mensagemSucesso && (
          <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-2 rounded-lg mb-4 text-xs font-semibold">
            {mensagemSucesso}
          </div>
        )}

        {erro && (
          <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-2 rounded-lg mb-4 text-xs font-semibold">
            {erro}
          </div>
        )}

        <label htmlFor="idCardapio" className="block text-sm font-medium text-[#9C1C0E] mb-1">
          Prato do Cardápio
        </label>
        
        {itensCardapio.length > 0 ? (
          <select
            id="idCardapio"
            value={idCardapio}
            onChange={(e) => setIdCardapio(e.target.value)}
            className="w-full border border-[#B78A10]/40 rounded-md p-2 mb-6 text-sm bg-white"
            required
          >
            <option value="">Selecione um prato...</option>
            {itensCardapio.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome} (R$ {Number(item.preco).toFixed(2)})
              </option>
            ))}
          </select>
        ) : (
          <input
            id="idCardapio"
            type="number"
            placeholder="ID do Cardápio"
            value={idCardapio}
            onChange={(e) => setIdCardapio(e.target.value)}
            className="w-full border border-[#B78A10]/40 rounded-md p-2 mb-6 text-sm"
            required
          />
        )}

        <div className="mb-4">
          <label className="block text-sm font-medium text-[#9C1C0E] mb-2">
            Insumos da Ficha Técnica
          </label>

          {insumoDaFicha.map((item, index) => (
            <div key={index} className="flex gap-2 items-center bg-[#F9ECE5] rounded-lg p-3 mb-3">
              {insumosDisponiveis.length > 0 ? (
                <select
                  value={item.idInsumo}
                  onChange={(e) => atualizarLinha(index, "idInsumo", e.target.value)}
                  className="flex-1 min-w-0 border border-[#B78A10]/40 rounded-md p-2 text-xs bg-white"
                  required
                >
                  <option value="">Selecione um insumo...</option>
                  {insumosDisponiveis.map((ins) => (
                    <option key={ins.idEstoque || ins.id} value={ins.idEstoque || ins.id}>
                      {ins.nome} ({ins.unidadeMedida})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="number"
                  placeholder="ID do Insumo"
                  value={item.idInsumo}
                  onChange={(e) => atualizarLinha(index, "idInsumo", e.target.value)}
                  className="flex-1 min-w-0 border border-[#B78A10]/40 rounded-md p-2 text-xs"
                  required
                />
              )}

              <input
                type="number"
                step="0.001"
                min="0.001"
                placeholder="Qtd. Necessária"
                value={item.quantidadeNecessaria}
                onChange={(e) => atualizarLinha(index, "quantidadeNecessaria", e.target.value)}
                className="w-32 min-w-0 border border-[#B78A10]/40 rounded-md p-2 text-xs bg-white"
                required
              />

              <button
                type="button"
                onClick={() => removeLinha(index)}
                className="shrink-0 text-[#9C1C0E] font-bold px-1 hover:opacity-80"
                title="Remover Insumo"
              >
                <CiSquareRemove className="size-6 cursor-pointer" />
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={addLinha}
            className="w-full border-2 border-dashed border-[#B78A10] text-[#B78A10] rounded-md py-2 mb-4 hover:bg-[#B78A10]/10 font-medium text-xs cursor-pointer"
          >
            + Adicionar Insumo
          </button>
        </div>

        <button
          type="submit"
          disabled={salvando}
          className="w-full bg-[#9C1C0E] hover:bg-[#7a1509] text-white font-medium py-2.5 rounded-md cursor-pointer disabled:opacity-50 text-sm"
        >
          {salvando ? "Salvação em andamento..." : "Salvar Ficha Técnica"}
        </button>
      </form>
    </div>
  );
}

export default FormularioFichaTec;