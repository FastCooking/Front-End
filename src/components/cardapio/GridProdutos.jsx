import { MdSearchOff } from "react-icons/md";
import { Card, EmptyState } from "../ui";
import CardProduto from "./CardProduto";

function GridProdutos({
  produtos,
  onSelectProduto,
  termoBusca,
  categoriaSelecionada,
}) {
  if (produtos.length === 0) {
    return (
      <Card className="max-w-lg mx-auto my-8">
        <EmptyState
          icon={MdSearchOff}
          title="Nenhum produto encontrado"
          description={
            termoBusca
              ? `Não encontramos itens contendo "${termoBusca}" na categoria "${categoriaSelecionada}".`
              : `Não há produtos disponíveis na categoria "${categoriaSelecionada}".`
          }
        />
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
      {produtos.map((produto) => (
        <CardProduto
          key={produto.id}
          produto={produto}
          onClick={onSelectProduto}
        />
      ))}
    </div>
  );
}

export default GridProdutos;
