import { MdClear, MdSearch } from "react-icons/md";
import { Input } from "../ui";

function CampoPesquisa({ valor, onChange }) {
  return (
    <div className="relative w-full max-w-md mx-auto mb-3">
      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
        <MdSearch size={20} />
      </div>
      <Input
        type="text"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Pesquisar produto pelo nome..."
        className="pl-10 pr-10 rounded-2xl shadow-xs"
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
