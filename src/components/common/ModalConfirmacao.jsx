import React from 'react';
import { MdHelpOutline, MdWarning, MdDeleteOutline, MdClose } from 'react-icons/md';

export default function ModalConfirmacao({
  aberto,
  titulo = 'Confirmação',
  mensagem = '',
  detalhes = null,
  tipo = 'perigo', // 'perigo' | 'aviso' | 'info'
  onConfirmar,
  onCancelar,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
  processando = false,
}) {
  if (!aberto) return null;

  const icones = {
    perigo: <MdDeleteOutline className="text-red-600 text-3xl" />,
    aviso: <MdWarning className="text-[#B78A10] text-3xl" />,
    info: <MdHelpOutline className="text-[#9C1C0E] text-3xl" />,
  };

  const coresBotao = {
    perigo: 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20',
    aviso: 'bg-[#B78A10] hover:bg-amber-700 text-white shadow-amber-600/20',
    info: 'bg-[#9C1C0E] hover:bg-[#7a160b] text-white shadow-[#9C1C0E]/20',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-[Poppins]">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-200 transform transition-all animate-fade-in">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-gray-100 shrink-0">
              {icones[tipo] || icones.info}
            </div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight">{titulo}</h3>
          </div>
          <button
            onClick={onCancelar}
            disabled={processando}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <MdClose size={20} />
          </button>
        </div>

        <div className="mt-4 text-sm text-gray-600 leading-relaxed whitespace-pre-line">
          {mensagem}
        </div>

        {detalhes && (
          <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-500">
            {detalhes}
          </div>
        )}

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancelar}
            disabled={processando}
            className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-bold rounded-2xl transition-all cursor-pointer"
          >
            {textoCancelar}
          </button>
          <button
            type="button"
            onClick={onConfirmar}
            disabled={processando}
            className={`px-5 py-2.5 font-bold text-xs sm:text-sm rounded-2xl shadow-md transition-all cursor-pointer flex items-center gap-2 ${coresBotao[tipo] || coresBotao.info} disabled:opacity-50`}
          >
            {processando && (
              <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
