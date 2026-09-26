import { MdAdd } from "react-icons/md";

function CardProduto({ produto, onClick }) {
  const precoFormatado = Number(produto.preco).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  return (
    <div
      onClick={() => onClick(produto)}
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-[#B78A10]/40 transition-all duration-300 overflow-hidden flex flex-col justify-between cursor-pointer transform hover:-translate-y-1"
    >
      <div>
        {/* Photo Container */}
        <div className="relative aspect-4/3 w-full overflow-hidden bg-gray-100">
          <img
            src={produto.imagem}
            alt={produto.nome}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <span className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs text-[#9C1C0E] text-xs font-bold px-3 py-1 rounded-full shadow-xs border border-gray-100">
            {produto.categoria}
          </span>
        </div>

        {/* Info Container */}
        <div className="p-4 sm:p-5">
          <h3 className="font-bold text-gray-900 text-lg group-hover:text-[#9C1C0E] transition-colors line-clamp-1">
            {produto.nome}
          </h3>
          <p className="text-gray-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">
            {produto.descricao}
          </p>
        </div>
      </div>

      {/* Footer Container */}
      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 flex items-center justify-between border-t border-gray-50 mt-2">
        <span className="text-lg font-bold text-[#9C1C0E]">
          {precoFormatado}
        </span>
        <button
          type="button"
          className="w-9 h-9 rounded-full bg-[#F9ECE5] text-[#9C1C0E] flex items-center justify-center group-hover:bg-[#9C1C0E] group-hover:text-white transition-all shadow-xs"
          title="Ver detalhes"
        >
          <MdAdd size={20} />
        </button>
      </div>
    </div>
  );
}

export default CardProduto;
