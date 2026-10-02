import { useState } from "react";
import { MdQrCode2, MdContentCopy, MdAutorenew, MdCheck } from "react-icons/md";
import { renovarTokenMesa } from "../../services/mesaService";

function ModalQrCodeMesa({ mesa, onClose, onTokenRenovado }) {
  const [mesaAtual, setMesaAtual] = useState(mesa);
  const [copiado, setCopiado] = useState(false);
  const [renovando, setRenovando] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");

  const urlCompleta = window.location.origin + (mesaAtual?.link || `/cliente/mesa/${mesaAtual?.token}`);

  function handleCopiarLink() {
    navigator.clipboard.writeText(urlCompleta);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  }

  async function handleRenovarToken() {
    const confirmar = window.confirm(
      `Deseja realmente renovar o QR Code e o Link da Mesa ${mesaAtual.numero}? O link antigo deixará de funcionar imediatamente!`
    );
    if (!confirmar) return;

    setRenovando(true);
    setErro("");
    setSucesso("");

    try {
      const id = mesaAtual.idMesa || mesaAtual.id;
      const mesaAtualizada = await renovarTokenMesa(id);
      setMesaAtual(mesaAtualizada);
      setSucesso("QR Code e Link renovados com sucesso!");
      if (onTokenRenovado) {
        onTokenRenovado(mesaAtualizada);
      }
      setTimeout(() => setSucesso(""), 4000);
    } catch (err) {
      console.error("Erro ao renovar token da mesa:", err);
      setErro(err.message || "Não foi possível renovar o QR Code.");
    } finally {
      setRenovando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 md:p-8 my-8 text-center">
        <div className="flex justify-between items-center mb-4 border-b pb-3 border-[#B78A10]/30 text-left">
          <h2 className="text-xl font-bold text-[#9C1C0E] flex items-center gap-2">
            <MdQrCode2 size={24} />
            Mesa {mesaAtual?.numero} - QR Code & Link
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>

        {erro && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded-lg mb-4 text-xs">
            {erro}
          </div>
        )}

        {sucesso && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-2 rounded-lg mb-4 text-xs">
            {sucesso}
          </div>
        )}

        {/* QR Code Container */}
        <div className="bg-gray-50 border border-gray-200 p-6 rounded-2xl flex flex-col items-center justify-center mb-4 shadow-inner">
          {mesaAtual?.qrCodeUrl ? (
            <img
              src={mesaAtual.qrCodeUrl}
              alt={`QR Code Mesa ${mesaAtual.numero}`}
              className="w-48 h-48 object-contain rounded-lg shadow-sm border border-white"
            />
          ) : (
            <div className="w-48 h-48 bg-gray-200 rounded-lg flex items-center justify-center text-gray-500 text-xs">
              QR Code Indisponível
            </div>
          )}
          <span className="text-xs text-gray-500 font-semibold mt-3">
            Escaneie para acessar o cardápio da Mesa {mesaAtual?.numero}
          </span>
        </div>

        {/* Campo de Link com Botão Copiar */}
        <div className="mb-6 text-left">
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Link direto da mesa:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={urlCompleta}
              className="flex-1 bg-gray-100 border border-gray-300 rounded-lg px-3 py-2 text-xs font-mono text-gray-700 select-all focus:outline-none"
            />
            <button
              onClick={handleCopiarLink}
              className="flex items-center gap-1 bg-[#9C1C0E] text-white px-3 py-2 rounded-lg text-xs font-medium hover:bg-[#7a160b] transition-colors cursor-pointer shrink-0"
              title="Copiar Link"
            >
              {copiado ? <MdCheck size={16} /> : <MdContentCopy size={16} />}
              {copiado ? "Copiado!" : "Copiar"}
            </button>
          </div>
        </div>

        {/* Botão de Renovação do Token/QR Code */}
        <div className="border-t border-gray-100 pt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <button
            onClick={handleRenovarToken}
            disabled={renovando}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 border border-[#9C1C0E] text-[#9C1C0E] hover:bg-[#9C1C0E] hover:text-white px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
            title="Gera um novo QR Code e invalida o link anterior"
          >
            <MdAutorenew size={18} className={renovando ? "animate-spin" : ""} />
            {renovando ? "Renovando..." : "Renovar QR Code / Link"}
          </button>

          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 text-xs font-medium rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ModalQrCodeMesa;
