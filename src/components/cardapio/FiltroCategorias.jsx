import { CATEGORIAS } from "../../data/produtosMock";

function FiltroCategorias({ categoriaSelecionada, onSelecionarCategoria }) {
  return (
    <div className="flex items-center justify-start md:justify-center gap-2 overflow-x-auto pb-1 scrollbar-none px-1">
      {CATEGORIAS.map((categoria) => {
        const isSelected = categoriaSelecionada === categoria;
        return (
          <button
            key={categoria}
            onClick={() => onSelecionarCategoria(categoria)}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 whitespace-nowrap cursor-pointer shadow-xs ${
              isSelected
                ? "bg-[#9C1C0E] text-white shadow-md shadow-[#9C1C0E]/20 scale-105"
                : "bg-white text-gray-700 hover:bg-[#F9ECE5] hover:text-[#9C1C0E] border border-gray-200"
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
