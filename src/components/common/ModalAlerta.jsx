import React from 'react';
import { MdCheckCircle, MdError, MdWarning, MdInfo, MdClose } from 'react-icons/md';

export default function ModalAlerta({
  aberto,
  titulo = 'Aviso',
  mensagem = '',
  tipo = 'info', // 'info' | 'sucesso' | 'erro' | 'aviso'
  onFechar,
  textoBotao = 'Entendido',
}) {
  if (!aberto) return null;

  const icones = {
    info: <MdInfo className="text-blue-600 text-3xl" />,
    sucesso: <MdCheckCircle className="text-emerald-600 text-3xl" />,
    erro: <MdError className="text-red-600 text-3xl" />,
    aviso: <MdWarning className="text-[#B78A10] text-3xl" />,
  };

  const coresBorda = {
    info: 'border-blue-200',
    sucesso: 'border-emerald-200',
    erro: 'border-red-200',
    aviso: 'border-amber-200',
  };

  const coresFundoIcone = {
    info: 'bg-blue-50',
    sucesso: 'bg-emerald-50',
    erro: 'bg-red-50',
    aviso: 'bg-amber-50',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs font-[Poppins]">
      <div
        className={`bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border ${coresBorda[tipo] || 'border-gray-200'} transform transition-all animate-fade-in`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${coresFundoIcone[tipo] || 'bg-gray-100'} shrink-0`}>
              {icones[tipo] || icones.info}
            </div>
            <h3 className="text-lg font-black text-gray-900 tracking-tight">{titulo}</h3>
          </div>
          <button
            onClick={onFechar}
            className="text-gray-400 hover:text-gray-700 p-1 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <MdClose size={20} />
          </button>
        </div>

        <div className="mt-4 text-sm text-gray-600 leading-relaxed whitespace-pre-line">
          {mensagem}
        </div>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onFechar}
            className="px-5 py-2.5 bg-[#9C1C0E] hover:bg-[#7a160b] text-white text-xs sm:text-sm font-bold rounded-2xl shadow-md transition-all cursor-pointer"
          >
            {textoBotao}
          </button>
        </div>
      </div>
    </div>
  );
}
