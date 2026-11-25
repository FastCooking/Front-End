import {useState} from "react";

function Navbar({ abaAtual, setAbaAtual }) {

    const [isOpen, setIsOpen] = useState(false);

    const fecharMenu = () => {
        setIsOpen(false);
    };
    

    return(
        <nav className="flex items-center justify-center gap-6 py-4 fixed top-0 z-50 w-full border-b border-[#9C1C0E] bg-white/50">
            <div className="flex items-center justify-between px-4 py-3">
                <button onClick={() => setIsOpen(!isOpen)} className="md:hidden">
                    {isOpen ? "Fechar Menu" : "Abrir Menu"}
                </button>

                <div className={"md:flex md:justify-center md:items-center md:space-x-4 " + (isOpen ? "block" : "hidden")}>
                    <button className={abaAtual === "cadastro" ? "text-[#9C1C0E] font-semibold border-b-2 border-[#9C1C0E]" : "text-gray-500 cursor-pointer"} onClick={() =>{ setAbaAtual("cadastro"); fecharMenu(); }}>Cadastro de Insumos</button>
                    <button className={abaAtual === "ficha" ? "text-[#9C1C0E] font-semibold border-b-2 border-[#9C1C0E]" : "text-gray-500 cursor-pointer"} onClick={() =>{ setAbaAtual("ficha"); fecharMenu(); }}>Ficha Técnica</button>
                    <button className={abaAtual === "lista" ? "text-[#9C1C0E] font-semibold border-b-2 border-[#9C1C0E]" : "text-gray-500 cursor-pointer"} onClick={() =>{ setAbaAtual("lista"); fecharMenu(); }}>Lista de Insumos</button>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;