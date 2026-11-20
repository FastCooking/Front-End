import { MdErrorOutline, MdHome, MdRefresh } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { Button, Card } from "../../../components/ui";

export default function OrderNotFound({ message, orderId }) {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center p-8">
        <div className="w-16 h-16 mx-auto mb-5 bg-red-50 text-brand rounded-2xl flex items-center justify-center">
          <MdErrorOutline size={36} />
        </div>

        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
          Pedido não encontrado
        </h1>

        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-3">
          {message ||
            "Não conseguimos localizar o pedido solicitado. Verifique o código e tente novamente."}
        </p>

        {orderId && (
          <p className="text-xs text-gray-400 mb-6">
            Código informado:{" "}
            <code className="bg-surface border border-gray-200 px-2 py-0.5 rounded-lg text-gray-600">
              {orderId}
            </code>
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
          <Button icon={MdHome} onClick={() => navigate("/")}>
            Voltar ao Início
          </Button>
          <Button
            variant="secondary"
            icon={MdRefresh}
            onClick={() => window.location.reload()}
          >
            Tentar Novamente
          </Button>
        </div>
      </Card>
    </div>
  );
}
