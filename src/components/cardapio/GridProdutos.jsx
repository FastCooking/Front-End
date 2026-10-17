import CardProduto from "./CardProduto";
import { MdSearchOff } from "react-icons/md";

function GridProdutos({ produtos, onSelectProduto, termoBusca, categoriaSelecionada }) {
  if (produtos.length === 0) {
    return (
      <div className="text-center py-16 px-4 bg-white rounded-3xl border border-gray-100 shadow-sm max-w-lg mx-auto my-8">
        <div className="w-16 h-16 bg-[#F9ECE5] text-[#9C1C0E] rounded-full flex items-center justify-center mx-auto mb-4">
          <MdSearchOff size={32} />
        </div>
        <h3 className="text-lg font-bold text-gray-900 mb-1">
          Nenhum produto encontrado
        </h3>
        <p className="text-sm text-gray-500">
          {termoBusca
            ? `Não encontramos itens contendo "${termoBusca}" na categoria "${categoriaSelecionada}".`
            : `Não há produtos disponíveis na categoria "${categoriaSelecionada}".`}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
