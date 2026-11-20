import { MdCheckCircle, MdError, MdInfo, MdWarning } from "react-icons/md";
import { Button, Modal } from "../ui";

const ICON_MAP = {
  info: MdInfo,
  sucesso: MdCheckCircle,
  erro: MdError,
  aviso: MdWarning,
};

export default function ModalAlerta({
  aberto,
  titulo = "Aviso",
  mensagem = "",
  tipo = "info",
  onFechar,
  textoBotao = "Entendido",
}) {
  return (
    <Modal
      open={Boolean(aberto)}
      onClose={onFechar}
      title={titulo}
      icon={ICON_MAP[tipo] || MdInfo}
      size="sm"
      footer={
        <Button variant="primary" size="sm" onClick={onFechar}>
          {textoBotao}
        </Button>
      }
    >
      <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
        {mensagem}
      </div>
    </Modal>
  );
}
