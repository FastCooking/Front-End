import { MdDeleteOutline, MdHelpOutline, MdWarning } from "react-icons/md";
import { Button, Modal } from "../ui";

const ICON_MAP = {
  perigo: MdDeleteOutline,
  aviso: MdWarning,
  info: MdHelpOutline,
};

export default function ModalConfirmacao({
  aberto,
  titulo = "Confirmação",
  mensagem = "",
  detalhes = null,
  tipo = "perigo",
  onConfirmar,
  onCancelar,
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar",
  processando = false,
}) {
  const variant =
    tipo === "perigo" ? "danger" : tipo === "aviso" ? "gold" : "primary";

  return (
    <Modal
      open={Boolean(aberto)}
      onClose={processando ? undefined : onCancelar}
      title={titulo}
      icon={ICON_MAP[tipo] || MdHelpOutline}
      size="sm"
      footer={
        <>
          <Button
            variant="secondary"
            size="sm"
            onClick={onCancelar}
            disabled={processando}
          >
            {textoCancelar}
          </Button>
          <Button
            variant={variant}
            size="sm"
            onClick={onConfirmar}
            loading={processando}
          >
            {textoConfirmar}
          </Button>
        </>
      }
    >
      <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
        {mensagem}
      </div>
      {detalhes && (
        <div className="mt-3 p-3 bg-surface border border-gray-200 rounded-xl text-xs text-gray-500">
          {detalhes}
        </div>
      )}
    </Modal>
  );
}
