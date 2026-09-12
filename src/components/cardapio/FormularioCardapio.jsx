import { useEffect, useState } from "react";
import {
  atualizarItemCardapio,
  criarItemCardapio,
} from "../../services/cardapioService.js";

function FormularioCardapio({ itemEmEdicao, onSalvarSucesso }) {
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [categoria, setCategoria] = useState("");
  const [disponivel, setDisponivel] = useState(true);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (itemEmEdicao) {
      setNome(itemEmEdicao.nome ?? "");
      setPreco(itemEmEdicao.preco ?? "");
      setCategoria(itemEmEdicao.categoria ?? "");
      setDisponivel(itemEmEdicao.disponivel ?? true);
    } else {
      limparCampos();
    }
  }, [itemEmEdicao]);

  function limparCampos() {
    setNome("");
    setPreco("");
    setCategoria("");
    setDisponivel(true);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setErro("");

    if (!nome.trim() || !preco || !categoria.trim()) {
      setErro("Preencha nome, preço e categoria antes de enviar.");
      return;
    }

    const dadosConvertidos = {
      nome: nome.trim(),
      preco: parseFloat(preco),
      categoria: categoria.trim(),
      disponivel,
    };

    try {
      setSalvando(true);
      if (itemEmEdicao) {
        await atualizarItemCardapio(itemEmEdicao.id, dadosConvertidos);
      } else {
        await criarItemCardapio(dadosConvertidos);
      }
      limparCampos();
      onSalvarSucesso();
    } catch (error) {
      console.error("Erro ao salvar item:", error);
      setErro("Não foi possível salvar o item. Tente novamente.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form className="menu-form" onSubmit={handleSubmit}>
      {erro && <p className="form-error">{erro}</p>}

      <label htmlFor="nomeItem">Nome do item</label>
      <input
        id="nomeItem"
        type="text"
        value={nome}
        onChange={(event) => setNome(event.target.value)}
        placeholder="Ex.: Lasanha da casa"
        required
      />

      <label htmlFor="preco">Preço (R$)</label>
      <input
        id="preco"
        type="number"
        value={preco}
        onChange={(event) => setPreco(event.target.value)}
        min="0"
        step="0.01"
        placeholder="0,00"
        required
      />

      <label htmlFor="categoria">Categoria</label>
      <input
        id="categoria"
        type="text"
        value={categoria}
        onChange={(event) => setCategoria(event.target.value)}
        placeholder="Ex.: Pratos principais"
        required
      />

      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={disponivel}
          onChange={(event) => setDisponivel(event.target.checked)}
        />
        Disponível no cardápio
      </label>

      <button className="primary-button" type="submit" disabled={salvando}>
        {salvando
          ? "Salvando..."
          : itemEmEdicao
            ? "Salvar alterações"
            : "Cadastrar item"}
      </button>
    </form>
  );
}

export default FormularioCardapio;
