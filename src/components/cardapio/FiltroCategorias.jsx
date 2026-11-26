import { CATEGORIAS } from "../../data/produtosMock";

function FiltroCategorias({
  categoriaSelecionada,
  onSelecionarCategoria,
  categorias = CATEGORIAS,
}) {
  return (
    <div className="flex items-center justify-start md:justify-center gap-2 overflow-x-auto pb-1 scrollbar-none px-1">
      {categorias.map((categoria) => {
        const isSelected = categoriaSelecionada === categoria;
        return (
          <button
            key={categoria}
            type="button"
            onClick={() => onSelecionarCategoria(categoria)}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer shadow-xs ${
              isSelected
                ? "bg-brand text-white shadow-sm"
                : "bg-white text-gray-700 hover:bg-brand-soft hover:text-brand border border-gray-200"
            }`}
          >
            {categoria}
          </button>
        );
      })}
    </div>
  );
}

export default FiltroCategorias;
