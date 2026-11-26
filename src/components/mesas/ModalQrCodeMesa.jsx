import { useEffect, useState } from "react";
import { MdDownload, MdLaunch, MdPrint, MdQrCode2 } from "react-icons/md";
import { obterQrCodeMesaUrl } from "../../services/mesaService";
import { Button, Modal, Spinner } from "../ui";

export default function ModalQrCodeMesa({ mesa, onClose }) {
  const [qrCodeUrl, setQrCodeUrl] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const idRestauranteResolvido = (() => {
    if (mesa?.idRestaurante) return String(mesa.idRestaurante);
    try {
      const stored = JSON.parse(localStorage.getItem("user") || "null");
      if (stored?.idRestaurante) return String(stored.idRestaurante);
      const token = localStorage.getItem("token");
      if (token) {
        const base64Url = token.split(".")[1];
        if (base64Url) {
          const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
          const padded = base64.padEnd(
            base64.length + ((4 - (base64.length % 4)) % 4),
            "="
          );
          const payload = JSON.parse(atob(padded));
          if (payload?.idRestaurante) return String(payload.idRestaurante);
        }
      }
    } catch {
      // ignore
    }
    return "";
  })();

  const urlAutoatendimento = `${window.location.origin}/autoatendimento?idMesa=${encodeURIComponent(
    mesa.idMesa
  )}${
    idRestauranteResolvido
      ? `&idRestaurante=${encodeURIComponent(idRestauranteResolvido)}`
      : ""
  }&mesa=${encodeURIComponent(mesa.numero)}`;

  useEffect(() => {
    let ativo = true;
    let urlCriada = null;

    async function carregar() {
      try {
        setCarregando(true);
        const url = await obterQrCodeMesaUrl(mesa.idMesa);
        urlCriada = url;
        if (ativo) setQrCodeUrl(url);
      } catch (err) {
        if (ativo) {
          setErro(
            err.message || "Não foi possível carregar a imagem do QR Code."
          );
        }
      } finally {
        if (ativo) setCarregando(false);
      }
    }

    if (mesa?.idMesa) {
      carregar();
    }

    return () => {
      ativo = false;
      if (urlCriada) {
        URL.revokeObjectURL(urlCriada);
      }
    };
  }, [mesa]);

  function handleImprimir() {
    const janelaImpressao = window.open("", "_blank");
    if (!janelaImpressao) return;
    janelaImpressao.document.write(`
      <html>
        <head>
          <title>QR Code - Mesa ${mesa.numero}</title>
          <style>
            body {
              font-family: Poppins, Arial, sans-serif;
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
            <p>Escaneie com a câmera do seu celular para ver o cardápio e fazer seu pedido!</p>
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
    <Modal
      open
      onClose={onClose}
      title={`QR Code — Mesa #${mesa.numero}`}
      subtitle="Autoatendimento oficial para pedidos nesta mesa"
      icon={MdQrCode2}
      size="sm"
    >
      {carregando ? (
        <div className="py-10 flex justify-center">
          <Spinner size="lg" label="Gerando QR Code..." />
        </div>
      ) : erro ? (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs">
          {erro}
        </div>
      ) : (
        <div className="flex flex-col items-center text-center">
          <div className="p-3 bg-white border-2 border-dashed border-gold rounded-2xl mb-4">
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
            className="text-xs text-brand hover:underline inline-flex items-center gap-1 mb-5 font-semibold"
          >
            Testar link de autoatendimento <MdLaunch size={14} />
          </a>

          <div className="flex gap-2.5 w-full">
            <a
              href={qrCodeUrl}
              download={`mesa-${mesa.numero}-qrcode.png`}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-brand-soft text-gray-700 hover:text-brand border border-gray-200 rounded-xl text-xs font-semibold transition-colors shadow-xs"
            >
              <MdDownload size={16} /> Baixar
            </a>
            <Button
              size="sm"
              icon={MdPrint}
              onClick={handleImprimir}
              className="flex-1"
            >
              Imprimir
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
