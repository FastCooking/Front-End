import {useState} from "react";

import { criarFichaTecnica } from '../../services/fichaTecnicaService.js';

import { CiSquareRemove } from "react-icons/ci";

function FormularioFichaTec() {
    const [idCardapio, setIdCardapio] = useState("");
    const [insumoDaFicha, setInsumoDaFicha] = useState([]);

    async function handleSubmit(event){
        event.preventDefault();

        try {
            const fichaTecnica = {
                idCardapio: parseInt(idCardapio),
                insumos: insumoDaFicha.map(item => ({
                    idEstoque: parseInt(item.idInsumo),
                    quantidadeNecessaria: parseFloat(item.quantidadeNecessaria)
                }))
        };
        const resultado = await criarFichaTecnica(fichaTecnica);
        console.log("Ficha Técnica criada:", resultado);
    } catch (erro) {
        console.log("Erro ao criar ficha técnica:", erro.message);
        }
    }

    function addLinha(){
        setInsumoDaFicha([...insumoDaFicha, {idInsumo: "", quantidadeNecessaria: ""}]);
    }

    function removeLinha(indice){
        setInsumoDaFicha(insumoDaFicha.filter((_, i) => i !== indice));
    }

    function atualizarLinha(indice, campo, valor){
        const novaLista = insumoDaFicha.map((item, i) => {
            if(i === indice){
                return {...item, [campo]: valor};
            }
            return item;
        });
        setInsumoDaFicha(novaLista);
    }

return (
    <div className="flex items-center justify-center gap-6">
        <form onSubmit={handleSubmit} className="bg-white/60 rounded-2xl shadow-xl p-8 w-full max-w-lg">
            <label htmlFor="idCardapio" className="block text-sm font-medium text-[#9C1C0E] mb-1">Prato do Cardápio</label>
            <input
                id="idCardapio"
                type="number"
                value={idCardapio}
                onChange={(e) => setIdCardapio(e.target.value)}
                className="w-full border border-[#B78A10]/40 rounded-md p-2 mb-6"
                required
            /><br />

            {insumoDaFicha.map((item, index) => (
                <div key={index} className="flex gap-2 items-center bg-[#F9ECE5] rounded-lg p-3 mb-3">
                    <input
                        type="number"
                        placeholder="ID do Insumo"
                        value={item.idInsumo}
                        onChange={(e) => atualizarLinha(index, "idInsumo", e.target.value)}
                        className="flex-1 min-w-0 border border-[#B78A10]/40 rounded-md p-2"
                        required
                    />
                    <input
                        type="number"
                        placeholder="Qtd. Necessária"
                        value={item.quantidadeNecessaria}
                        onChange={(e) => atualizarLinha(index, "quantidadeNecessaria", e.target.value)}
                        className="flex-1 min-w-0 border border-[#B78A10]/40 rounded-md p-2"
                        required
                    />
                    <button type="button" onClick={() => removeLinha(index)} className="shrink-0 text-[#9C1C0E] font-bold px-2">
                        <CiSquareRemove className="size-5 cursor-pointer"/>
                    </button>
                </div>
            ))}

            <button type="button" onClick={addLinha} className="w-full border-2 border-dashed border-[#B78A10] text-[#B78A10] rounded-md py-2 mb-6 hover:bg-[#B78A10]/10">
                Adicionar Insumo
            </button>

            <br />

            <button type="submit" className="w-full bg-[#9C1C0E] hover:bg-[#7a1509] text-white font-medium py-2 rounded-md">
                Salvar Ficha Técnica
            </button>
        </form>
    </div>
    );
}
export default FormularioFichaTec;