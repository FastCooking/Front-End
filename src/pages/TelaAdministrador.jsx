import { useState } from "react";
import FormularioCardapio from "../components/cardapio/FormularioCardapio.jsx";
import ListaCardapio from "../components/cardapio/ListaCardapio.jsx";

function TelaAdministrador() {
  const [abaAtual, setAbaAtual] = useState("lista");
  const [itemEmEdicao, setItemEmEdicao] = useState(null);
  const [sinalAtualizar, setSinalAtualizar] = useState(0);

  function handleEditar(item) {
    setItemEmEdicao(item);
    setAbaAtual("formulario");
  }

  function handleNovoItem() {
    setItemEmEdicao(null);
    setAbaAtual("formulario");
  }

  function handleSalvarSucesso() {
    setSinalAtualizar((prev) => prev + 1);
    setAbaAtual("lista");
  }

  function handleTrocarAba() {
    if (abaAtual === "lista") {
      handleNovoItem();
    } else {
      setAbaAtual("lista");
    }
  }

  return (
    <main className="admin-shell">
      <header className="admin-header">
        <div>
          <p className="eyebrow">FastCooking / administração</p>
          <h1>Cardápio</h1>
        </div>
        <button className="primary-button header-button" type="button" onClick={handleTrocarAba}>
          <span aria-hidden="true">{abaAtual === "lista" ? "+" : "←"}</span>
          {abaAtual === "lista" ? "Novo item" : "Voltar para lista"}
        </button>
      </header>

      <section className="admin-content" aria-label="Gerenciamento do cardápio">
        {abaAtual === "lista" ? (
          <>
            <div className="section-heading">
              <div>
                <p className="eyebrow">Itens cadastrados</p>
                <h2>Seu menu, em ordem</h2>
              </div>
              <span className="section-note">Atualizado pela API</span>
            </div>
            <ListaCardapio onEditar={handleEditar} atualizarSinal={sinalAtualizar} />
          </>
        ) : (
          <>
            <div className="section-heading">
              <div>
                <p className="eyebrow">{itemEmEdicao ? "Edição" : "Cadastro"}</p>
                <h2>{itemEmEdicao ? "Ajuste este item" : "Adicione um sabor ao menu"}</h2>
              </div>
            </div>
            <FormularioCardapio
              itemEmEdicao={itemEmEdicao}
              onSalvarSucesso={handleSalvarSucesso}
            />
          </>
        )}
      </section>
    </main>
  );
}

export default TelaAdministrador;