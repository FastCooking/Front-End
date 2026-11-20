import { MdAdd } from "react-icons/md";
import { FALLBACK_FOOD_SVG, resolverImagem } from "../../config/api";

function CardProduto({ produto, onClick }) {
  const precoFormatado = Number(produto.preco).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });

  const rawImg =
    produto.imagem ||
    produto.pathImage ||
    produto.imagemUrl ||
    produto.imagem_url;
  const imagemSrc = resolverImagem(rawImg);

  return (
    <div
      onClick={() => onClick(produto)}
      className="group bg-white rounded-2xl border border-gray-200/80 shadow-xs hover:shadow-md hover:border-gold/40 transition-all overflow-hidden flex flex-col justify-between cursor-pointer"
    >
      <div>
        <div className="relative aspect-4/3 w-full overflow-hidden bg-brand-soft/40">
          <img
            src={imagemSrc}
            alt={produto.nome}
            width={400}
            height={300}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
            onError={(e) => {
              if (e.currentTarget.src !== FALLBACK_FOOD_SVG) {
                e.currentTarget.src = FALLBACK_FOOD_SVG;
              }
            }}
          />
          <span className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs text-brand text-xs font-bold px-3 py-1 rounded-full shadow-xs border border-gray-100">
            {produto.categoria}
          </span>
        </div>

        <div className="p-4 sm:p-5">
          <h3 className="font-bold text-gray-900 text-base sm:text-lg group-hover:text-brand transition-colors line-clamp-1">
            {produto.nome}
          </h3>
          <p className="text-gray-500 text-xs mt-1.5 line-clamp-2 leading-relaxed">
            {produto.descricao}
          </p>
        </div>
      </div>

      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-2 flex items-center justify-between border-t border-gray-100">
        <span className="text-base sm:text-lg font-bold text-brand">
          {precoFormatado}
        </span>
        <button
          type="button"
          className="w-9 h-9 rounded-full bg-brand-soft text-brand flex items-center justify-center group-hover:bg-brand group-hover:text-white transition-colors shadow-xs"
          title="Ver detalhes"
        >
          <MdAdd size={20} />
        </button>
      </div>
    </div>
  );
}

export default CardProduto;
