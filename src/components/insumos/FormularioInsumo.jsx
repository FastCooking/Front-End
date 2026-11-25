import {useState} from "react";

import {criarInsumos} from "../../services/insumosService.js";

import { HiSelector } from "react-icons/hi";

function FormularioInsumo() {
    const [nome, setNome] = useState("");
    const [quantidadeEmEstoque, setQuantidadeEmEstoque] = useState("");
    const [quantidadeMinima, setQuantidadeMinima] = useState("");
    const [unidadeMedida, setUnidadeMedida] = useState("");

    async function handleSubmit(event) {
        event.preventDefault();
        try{
            const dadosConvertidos = {
                nome,
                quantidadeEmEstoque: parseFloat(quantidadeEmEstoque),
                quantidadeMinima: parseFloat(quantidadeMinima),
                unidadeMedida
            };

            const resposta = await criarInsumos(dadosConvertidos);
            console.log("Insumo criado com sucesso:", resposta);
            setNome("");
            setQuantidadeEmEstoque("");
            setQuantidadeMinima("");
            setUnidadeMedida("");
        }
        catch (error) {
            console.error("Erro ao criar insumo:", error);
        }
    }


return (
        <div className="flex items-start justify-center">
            <form onSubmit={(e) => {handleSubmit(e)}} className="items-center flex flex-col mt-12 bg-white/60 rounded-2xl shadow-xl p-8 w-full max-w-lg">

                <div className="relative w-72">
                    <input 
                        type="text" 
                        id="nome" 
                        value={nome} 
                        onChange={(e) => setNome(e.target.value)}
                        className="block rounded-t-base px-2.5 pb-2.5 pt-5 w-full text-sm text-[#3B2F2F] bg-transparent border-0 border-b-2 border-black appearance-none focus:outline-none focus:ring-0 focus:border-[#9C1C0E] peer" 
                        placeholder=" "
                        required
                    />
                    <label htmlFor="nome" className="inline-flex items-center absolute text-sm text-[#3B2F2F] duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] start-2.5 peer-focus:text-[#9C1C0E] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto">
                    Nome
                    </label>
                </div>

                <br />

                <div className="relative w-72">
                    <input 
                        type="number"
                        id="quantidadeEmEstoque" 
                        value={quantidadeEmEstoque} 
                        onChange={(e) => setQuantidadeEmEstoque(e.target.value)} 
                        min="0"
                        className="block rounded-t-base px-2.5 pb-2.5 pt-5 w-full text-sm text-[#3B2F2F] bg-transparent border-0 border-b-2 border-black appearance-none focus:outline-none focus:ring-0 focus:border-[#9C1C0E] peer"
                        placeholder=" "
                        required
                    />
                    <label htmlFor="quantidadeEmEstoque" className="inline-flex items-center absolute text-sm text-[#3B2F2F] duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] start-2.5 peer-focus:text-[#9C1C0E] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto">
                    Quantidade em Estoque
                    </label>
                </div>

                <br />

                <div className="relative w-72">
                    <input 
                        type="number" 
                        id="quantidadeMinima" 
                        value={quantidadeMinima} 
                        onChange={(e) => setQuantidadeMinima(e.target.value)} 
                        min="0"
                        className="block rounded-t-base px-2.5 pb-2.5 pt-5 w-full text-sm text-[#3B2F2F] bg-transparent border-0 border-b-2 border-black appearance-none focus:outline-none focus:ring-0 focus:border-[#9C1C0E] peer"
                        placeholder=" "
                        required
                    />
                    <label htmlFor="quantidadeMinima" className="inline-flex items-center absolute text-sm text-[#3B2F2F] duration-300 transform -translate-y-4 scale-75 top-4 z-10 origin-[0] start-2.5 peer-focus:text-[#9C1C0E] peer-placeholder-shown:scale-100 peer-placeholder-shown:translate-y-0 peer-focus:scale-75 peer-focus:-translate-y-4 rtl:peer-focus:translate-x-1/4 rtl:peer-focus:left-auto">
                        Quantidade Mínima
                    </label>
                </div>

                <br />

                <div className="flex items-center gap-3 w-72">
                        <label htmlFor="unidadeMedida" className="text-sm text-[#3B2F2F]">
                            Unidade de Medida
                        </label>
                    <div className="relative">
                        <HiSelector 
                            className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                        />
                        <select 
                            id="unidadeMedida" 
                            value={unidadeMedida} 
                            onChange={(e) => setUnidadeMedida(e.target.value)} 
                            className="appearance-none bg-transparent text-[#3B2F2F] text-sm focus:outline-none cursor-pointer pr-6">
                            <option value="">Selecione...</option>
                            <option value="kg">Quilograma</option>
                            <option value="g">Grama</option>
                            <option value="l">Litro</option>
                            <option value="ml">Mililitro</option>
                            <option value="un">Unidade</option>
                        </select>
                    </div>
                </div>

                <br />

                <button type="submit" className="bg-[#9C1C0E] text-white py-2 px-4 rounded-md hover:bg-[#7a160b] focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer">
                    Cadastrar
                </button>
            </form>
        </div>
    );

}

export default FormularioInsumo;