import { useMemo, useState } from "react";
import {
  MdAdd,
  MdDelete,
  MdEdit,
  MdQrCode2,
  MdReceiptLong,
  MdSearch,
  MdTableBar,
} from "react-icons/md";
import ModalComandaMesa from "../../components/mesas/ModalComandaMesa";
import ModalMesa from "../../components/mesas/ModalMesa";
import ModalQrCodeMesa from "../../components/mesas/ModalQrCodeMesa";
import {
  Button,
  DataTable,
  Input,
  PageHeader,
  Select,
  StatusBadge,
  useConfirm,
  useToast,
} from "../../components/ui";
import { excluirMesa } from "../../services/mesaService";

export default function SecaoMesas({
  mesas,
  carregando,
  idRestauranteGerente,
  onRecarregar,
}) {
  const toast = useToast();
  const confirm = useConfirm();

  const [buscaMesa, setBuscaMesa] = useState("");
  const [filtroStatusMesa, setFiltroStatusMesa] = useState("");
  const [modalMesa, setModalMesa] = useState(false);
  const [mesaEdicao, setMesaEdicao] = useState(null);
  const [mesaQrCode, setMesaQrCode] = useState(null);
  const [mesaComanda, setMesaComanda] = useState(null);

  const mesasFiltradas = useMemo(
    () =>
      mesas.filter((m) => {
        if (buscaMesa.trim()) {
          const termo = buscaMesa.toLowerCase().trim();
          const bateNumero = String(m.numero).includes(termo);
          const bateStatus = m.status?.toLowerCase().includes(termo);
          if (!bateNumero && !bateStatus) return false;
        }
        if (filtroStatusMesa && m.status !== filtroStatusMesa) {
          return false;
        }
        return true;
      }),
    [mesas, buscaMesa, filtroStatusMesa]
  );

  async function handleExcluirMesa(m) {
    const ok = await confirm({
      title: "Remover Mesa",
      message: `Deseja realmente remover a Mesa #${m.numero}? Esta ação não pode ser desfeita.`,
      confirmText: "Remover Mesa",
      tone: "danger",
    });
    if (!ok) return;

    try {
      await excluirMesa(m.idMesa);
      toast.success(`Mesa #${m.numero} removida com sucesso!`);
      onRecarregar();
    } catch (err) {
      toast.error(err.message || "Erro ao remover mesa.");
    }
  }

  const colunas = [
    {
      key: "mesa",
      header: "Mesa",
      render: (m) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-soft text-brand flex items-center justify-center font-bold text-sm">
            #{m.numero}
          </div>
          <span className="font-bold text-gray-900">Mesa {m.numero}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (m) => <StatusBadge status={m.status} />,
    },
    {
      key: "qrcode",
      header: "Autoatendimento (QR Code)",
      render: (m) => (
        <Button
          variant="secondary"
          size="xs"
          icon={MdQrCode2}
          onClick={() => setMesaQrCode(m)}
        >
          Ver QR Code
        </Button>
      ),
    },
    {
      key: "comanda",
      header: "Consumo / Comanda",
      render: (m) => (
        <Button
          variant="soft"
          size="xs"
          icon={MdReceiptLong}
          onClick={() => setMesaComanda(m)}
        >
          Ver Comanda
        </Button>
      ),
    },
    {
      key: "acoes",
      header: "Ações",
      align: "right",
      render: (m) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => {
              setMesaEdicao(m);
              setModalMesa(true);
            }}
            className="p-1.5 rounded-xl text-gray-600 hover:text-brand hover:bg-brand-soft transition-colors cursor-pointer"
            title="Editar Mesa"
          >
            <MdEdit size={18} />
          </button>
          <button
            type="button"
            onClick={() => handleExcluirMesa(m)}
            className="p-1.5 rounded-xl text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            title="Remover Mesa"
          >
            <MdDelete size={18} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Mesas do Restaurante"
        icon={MdTableBar}
        actions={
          <Button
            icon={MdAdd}
            onClick={() => {
              setMesaEdicao(null);
              setModalMesa(true);
            }}
          >
            Nova Mesa
          </Button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative sm:col-span-2">
          <MdSearch
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
            size={19}
          />
          <Input
            type="text"
            placeholder="Buscar mesa por número ou status..."
            value={buscaMesa}
            onChange={(e) => setBuscaMesa(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select
          value={filtroStatusMesa}
          onChange={(e) => setFiltroStatusMesa(e.target.value)}
        >
          <option value="">Todos os Status</option>
          <option value="Disponivel">Disponível</option>
          <option value="Ocupada">Ocupada</option>
          <option value="Reservada">Reservada</option>
          <option value="Manutencao">Manutenção</option>
        </Select>
      </div>

      <DataTable
        columns={colunas}
        rows={mesasFiltradas}
        rowKey={(m) => m.idMesa}
        loading={carregando}
        loadingLabel="Carregando mesas do restaurante..."
        emptyIcon={MdTableBar}
        emptyTitle="Nenhuma mesa encontrada"
        emptyDescription="Cadastre mesas para disponibilizar o atendimento e gerar QR Codes."
      />

      {modalMesa && (
        <ModalMesa
          mesa={mesaEdicao}
          idRestaurante={idRestauranteGerente}
          onClose={() => {
            setModalMesa(false);
            setMesaEdicao(null);
          }}
          onSuccess={() => {
            const editando = Boolean(mesaEdicao);
            setModalMesa(false);
            setMesaEdicao(null);
            toast.success(
              editando
                ? "Mesa atualizada com sucesso!"
                : "Mesa criada com sucesso!"
            );
            onRecarregar();
          }}
        />
      )}

      {mesaQrCode && (
        <ModalQrCodeMesa
          mesa={mesaQrCode}
          onClose={() => setMesaQrCode(null)}
        />
      )}

      {mesaComanda && (
        <ModalComandaMesa
          mesa={mesaComanda}
          onClose={() => setMesaComanda(null)}
        />
      )}
    </div>
  );
}
