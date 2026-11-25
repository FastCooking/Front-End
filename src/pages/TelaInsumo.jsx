import {useState} from "react";

import FormularioInsumo from "../components/insumos/FormularioInsumo.jsx";
import FormularioFichaTecnica from "../components/insumos/FormularioFichaTec.jsx";
import ListaInsumo from "../components/insumos/ListaInsumo.jsx";

import Navbar from "../components/layout/Navbar.jsx";

function TelaInsumo() {
    const[abaAtual, setAbaAtual] = useState("cadastro");

    return (
        <div className="min-h-screen bg-linear-to-r from-[#F9ECE5] to-[#D4C8C0] pt-25">
            <Navbar abaAtual={abaAtual} setAbaAtual={setAbaAtual} />
            
            {abaAtual === "cadastro" && <FormularioInsumo />}
            {abaAtual === "ficha" && <FormularioFichaTecnica />}
            {abaAtual === "lista" && <ListaInsumo />}
        </div>
    );
}

export default TelaInsumo;