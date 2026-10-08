import { useNavigate } from 'react-router-dom';

/**
 * Tela de erro exibida quando o pedido não é encontrado ou o orderId é inválido.
 *
 * @param {{ message?: string, orderId?: string }} props
 */
export default function OrderNotFound({ message, orderId }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9ECE5] via-white to-[#F9ECE5] font-[Poppins] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Ícone de erro */}
        <div className="w-24 h-24 mx-auto mb-6 bg-red-100 rounded-full flex items-center justify-center">
          <svg
            className="w-12 h-12 text-[#9C1C0E]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
          Pedido não encontrado
        </h1>

        <p className="text-gray-600 leading-relaxed mb-2">
          {message || 'Não conseguimos localizar o pedido solicitado. Verifique o código e tente novamente.'}
        </p>

        {orderId && (
          <p className="text-sm text-gray-400 mb-8">
            Código informado: <code className="bg-gray-100 px-2 py-0.5 rounded text-gray-600">{orderId}</code>
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#9C1C0E] text-white font-semibold rounded-xl hover:bg-[#7a160b] shadow-lg shadow-[#9C1C0E]/20 transition-all cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            Voltar ao Início
          </button>

          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:border-[#B78A10] hover:text-[#B78A10] transition-all cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />
            </svg>
            Tentar Novamente
          </button>
        </div>
      </div>
    </div>
  );
}
