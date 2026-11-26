import { useState } from "react";
import { MdAddBox, MdInventory2, MdMenuBook } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import FormularioFichaTecnica from "../components/insumos/FormularioFichaTec.jsx";
import FormularioInsumo from "../components/insumos/FormularioInsumo.jsx";
import ListaInsumo from "../components/insumos/ListaInsumo.jsx";
import AppShell from "../components/layout/AppShell.jsx";

const SECOES_INSUMO = [
  { id: "cadastro", label: "Cadastrar Insumo", icon: MdAddBox },
  { id: "ficha", label: "Ficha Técnica", icon: MdMenuBook },
  { id: "lista", label: "Lista de Insumos", icon: MdInventory2 },
];

function TelaInsumo() {
  const [abaAtual, setAbaAtual] = useState("cadastro");
  const navigate = useNavigate();

  return (
    <AppShell
      modulo="Gestão de Insumos"
      secoes={SECOES_INSUMO}
      secaoAtiva={abaAtual}
      onSecao={setAbaAtual}
      onLogout={() => navigate("/login")}
    >
      {abaAtual === "cadastro" && <FormularioInsumo />}
      {abaAtual === "ficha" && <FormularioFichaTecnica />}
      {abaAtual === "lista" && <ListaInsumo />}
    </AppShell>
  );
}

export default TelaInsumo;
