import { MdSearch, MdClear } from "react-icons/md";

function CampoPesquisa({ valor, onChange }) {
  return (
    <div className="relative w-full max-w-md mx-auto mb-3">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
        <MdSearch size={20} />
      </div>
      <input
        type="text"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Pesquisar produto pelo nome..."
        className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-200 rounded-2xl text-sm font-medium text-gray-800 placeholder-gray-400 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#9C1C0E] focus:border-transparent transition-all"
      />
      {valor && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 cursor-pointer"
          title="Limpar pesquisa"
        >
          <MdClear size={18} />
        </button>
      )}
    </div>
  );
}

export default CampoPesquisa;
