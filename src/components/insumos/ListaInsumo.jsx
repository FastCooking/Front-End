import {useState} from "react";
import { useEffect } from "react";

import { buscarInsumos } from "../../services/insumosService.js";

function ListaInsumo() {
  
  const [insumos, setInsumos] = useState([]);

  useEffect(() => {
    async function carregarInsumos() {
      try {
        const dados = await buscarInsumos();
        setInsumos(dados);
      } catch (erro) {
        console.error('Erro ao buscar insumos:', erro);
      }
    }

    carregarInsumos();
  }, []);

    return(
        <div className="items-center justify-center p-8">
            <h1 className="font-semibold text-lg text-[#9C1C0E]">Lista de Insumos</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-5">
                {insumos.map((insumo, index) => {
                  const estoqueBaixo = insumo.quantidadeEmEstoque <= insumo.quantidadeMinima;
                  
                  return (
                    <div key={index} className={`rounded-xl p-4 shadow-md border ${
                      estoqueBaixo ? "bg-red-30 border-[#9C1C0E]" : "bg-white/60 border-[#B78A10]/30"
                    }`}>
                        <h2 className="font-semibold text-lg text-[#9C1C0E]">{insumo.nome}</h2>
                        <p>Estoque: {insumo.quantidadeEmEstoque} {insumo.unidadeMedida}</p>
                        <p>Quantidade Mínima: {insumo.quantidadeMinima} {insumo.unidadeMedida}</p>
                    </div>
                  );
              })}
            </div>
        </div>
    );
}
export default ListaInsumo;