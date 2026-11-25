import { useEffect, useState } from "react";
import {
  alternarDisponibilidade,
  excluirItemCardapio,
  listarItensCardapio,
} from "../../services/cardapioService.js";

function ListaCardapio({ onEditar, atualizarSinal }) {
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    carregarItens();
  }, [atualizarSinal]);

  async function carregarItens() {
    try {
      setCarregando(true);
      setErro("");
      const dados = await listarItensCardapio();
      setItens(dados);
    } catch (error) {
      console.error("Erro ao buscar itens do cardápio:", error);
      setErro("Não foi possível carregar o cardápio.");
    } finally {
      setCarregando(false);
    }
  }

  async function handleDesativar(item) {
    try {
      await alternarDisponibilidade(item.id, !item.disponivel);
      carregarItens();
    } catch (error) {
      console.error("Erro ao alternar disponibilidade:", error);
      setErro("Não foi possível alterar a disponibilidade.");
    }
  }

  async function handleExcluir(id) {
    if (!window.confirm("Tem certeza que deseja excluir este item?")) return;

    try {
      await excluirItemCardapio(id);
      carregarItens();
    } catch (error) {
      console.error("Erro ao excluir item:", error);
      setErro("Não foi possível excluir o item.");
    }
  }

  if (carregando) return <p className="table-message">Carregando itens...</p>;

  return (
    <div className="table-wrap">
      {erro && <p className="form-error">{erro}</p>}
      {itens.length === 0 ? (
        <p className="table-message">Nenhum item cadastrado ainda.</p>
      ) : (
        <table className="menu-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Preço</th>
              <th>Categoria</th>
              <th>Disponibilidade</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((item) => (
              <tr key={item.id}>
                <td data-label="Nome">{item.nome}</td>
                <td data-label="Preço">
                  R$ {Number(item.preco).toFixed(2).replace(".", ",")}
                </td>
                <td data-label="Categoria">{item.categoria}</td>
                <td data-label="Disponibilidade">
                  <span className={`status ${item.disponivel ? "available" : "unavailable"}`}>
                    {item.disponivel ? "Disponível" : "Indisponível"}
                  </span>
                </td>
                <td className="actions" data-label="Ações">
                  <button type="button" onClick={() => onEditar(item)}>
                    Editar
                  </button>
                  <button type="button" onClick={() => handleDesativar(item)}>
                    {item.disponivel ? "Desativar" : "Ativar"}
                  </button>
                  <button type="button" onClick={() => handleExcluir(item.id)}>
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default ListaCardapio;
