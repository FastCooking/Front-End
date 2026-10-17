import { useState, useEffect } from "react";
import { MdQrCode2, MdDownload, MdPrint, MdLaunch } from "react-icons/md";
import { obterQrCodeMesaUrl } from "../../services/mesaService";

export default function ModalQrCodeMesa({ mesa, onClose }) {
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const urlAutoatendimento = `${window.location.origin}/cardapio?idMesa=${mesa.idMesa}&idRestaurante=${mesa.idRestaurante}&mesa=${mesa.numero}`;

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      try {
        setCarregando(true);
        const url = await obterQrCodeMesaUrl(mesa.idMesa);
        if (ativo) setQrCodeUrl(url);
      } catch (err) {
        if (ativo) setErro(err.message || "Não foi possível carregar a imagem do QR Code.");
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    if (mesa?.idMesa) {
      carregar();
    }

    return () => {
      ativo = false;
      if (qrCodeUrl) {
        URL.revokeObjectURL(qrCodeUrl);
      }
    };
  }, [mesa]);

  function handleImprimir() {
    const janelaImpressao = window.open("", "_blank");
    janelaImpressao.document.write(`
      <html>
        <head>
          <title>QR Code - Mesa ${mesa.numero}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              height: 90vh;
              margin: 0;
            }
            .card {
              border: 3px solid #9C1C0E;
              border-radius: 20px;
              padding: 30px;
              text-align: center;
              box-shadow: 0 4px 15px rgba(0,0,0,0.1);
              max-width: 350px;
            }
            h1 { color: #9C1C0E; margin-bottom: 5px; }
            h2 { color: #555; margin-top: 0; }
            img { width: 220px; height: 220px; margin: 15px 0; }
            p { font-size: 13px; color: #777; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>FastCooking</h1>
            <h2>MESA #${mesa.numero}</h2>
            <img src="${qrCodeUrl}" alt="QR Code Mesa ${mesa.numero}" />
            <p>Escaneie a câmera do seu celular para ver o cardápio e fazer seu pedido!</p>
          </div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    janelaImpressao.document.close();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center animate-fade-in">
        <div className="flex justify-between items-center mb-3 border-b pb-2 border-gray-100">
          <h2 className="text-lg font-bold text-[#9C1C0E] flex items-center gap-2">
            <MdQrCode2 size={24} /> QR Code - Mesa #{mesa.numero}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-2xl font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          QR Code oficial de autoatendimento para pedidos nesta mesa.
        </p>

        {carregando ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <div className="w-10 h-10 border-4 border-[#9C1C0E] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-gray-500 font-medium">Gerando QR Code...</span>
          </div>
        ) : erro ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-xl text-xs mb-4">
            {erro}
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="p-3 bg-white border-2 border-dashed border-[#B78A10] rounded-2xl shadow-inner mb-4">
              <img
                src={qrCodeUrl}
                alt={`QR Code Mesa ${mesa.numero}`}
                className="w-56 h-56 object-contain"
              />
            </div>

            <a
              href={urlAutoatendimento}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-blue-600 hover:underline flex items-center gap-1 mb-4 font-medium"
            >
              Testar link de autoatendimento <MdLaunch size={14} />
            </a>

            <div className="flex gap-2 w-full">
              <a
                href={qrCodeUrl}
                download={`mesa-${mesa.numero}-qrcode.png`}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-semibold transition-colors shadow-sm cursor-pointer"
              >
                <MdDownload size={16} /> Baixar Imagem
              </a>
              <button
                type="button"
                onClick={handleImprimir}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#9C1C0E] hover:bg-[#7a160b] text-white rounded-xl text-xs font-semibold transition-colors shadow-sm cursor-pointer"
              >
                <MdPrint size={16} /> Imprimir Cartão
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
