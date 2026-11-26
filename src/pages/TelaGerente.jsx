import {
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  MdHistory,
  MdInventory,
  MdPeople,
  MdRestaurantMenu,
  MdSoupKitchen,
  MdTableBar,
} from "react-icons/md";
import { useNavigate, useSearchParams } from "react-router-dom";

import AppShell from "../components/layout/AppShell";
import { Card, Spinner, useToast } from "../components/ui";
import { API_BASE } from "../config/api";
import { listarItensCardapio } from "../services/cardapioService";
import { buscarInsumos } from "../services/insumosService";
import { listarMesas } from "../services/mesaService";
import { listarPedidos, obterFilaCozinha } from "../services/pedidoService";
import { listarRestaurantes } from "../services/restauranteService";
import { listarUsuarios, obterUsuarioPorId } from "../services/usuarioService";

const SecaoEquipe = lazy(() => import("./gerente/SecaoEquipe"));
const SecaoCardapio = lazy(() => import("./gerente/SecaoCardapio"));
const SecaoEstoque = lazy(() => import("./gerente/SecaoEstoque"));
const SecaoMesas = lazy(() => import("./gerente/SecaoMesas"));
const SecaoCozinha = lazy(() => import("./gerente/SecaoCozinha"));
const SecaoHistorico = lazy(() => import("./gerente/SecaoHistorico"));

const SECOES_VALIDAS = new Set([
  "usuarios",
  "cardapio",
  "estoque",
  "mesas",
  "cozinha",
  "historico",
]);

function buildWsUrl() {
  const wsBase = API_BASE.replace(/^http/, "ws");
  return `${wsBase}/pedidos/ws`;
}

function decodeJwtPayload() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const base64Url = token.split(".")[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function getUserIdFromToken() {
  const payload = decodeJwtPayload();
  return payload?.sub ? String(payload.sub) : null;
}

function getInitialUserFromStorage() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function TelaGerente() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const toast = useToast();

  const secaoUrl = searchParams.get("secao");
  const abaAtiva = SECOES_VALIDAS.has(secaoUrl) ? secaoUrl : "usuarios";

  function setAbaAtiva(novaSecao) {
    setSearchParams({ secao: novaSecao }, { replace: true });
  }

  const [usuarioLogado, setUsuarioLogado] = useState(() =>
    getInitialUserFromStorage()
  );
  const [idRestauranteGerente, setIdRestauranteGerente] = useState(() => {
    const stored = getInitialUserFromStorage();
    if (stored?.idRestaurante) return String(stored.idRestaurante);
    const jwtPayload = decodeJwtPayload();
    return jwtPayload?.idRestaurante ? String(jwtPayload.idRestaurante) : null;
  });

  const wsRef = useRef(null);
  const isMountedRef = useRef(true);
  const reconnectTimerRef = useRef(null);

  const [usuarios, setUsuarios] = useState([]);
  const [restaurantes, setRestaurantes] = useState([]);
  const [carregandoUsuarios, setCarregandoUsuarios] = useState(false);
  const [filtroFuncaoUsuario, setFiltroFuncaoUsuario] = useState("");
  const [buscaUsuario, setBuscaUsuario] = useState("");

  const [itensCardapio, setItensCardapio] = useState([]);
  const [carregandoCardapio, setCarregandoCardapio] = useState(false);

  const [itensEstoque, setItensEstoque] = useState([]);
  const [carregandoEstoque, setCarregandoEstoque] = useState(false);

  const [mesas, setMesas] = useState([]);
  const [carregandoMesas, setCarregandoMesas] = useState(false);

  const [filaCozinha, setFilaCozinha] = useState([]);
  const [carregandoCozinha, setCarregandoCozinha] = useState(false);

  const [historicoPedidos, setHistoricoPedidos] = useState([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(false);

  const jaCarregouMesasRef = useRef(false);
  const jaCarregouCozinhaRef = useRef(false);
  const jaCarregouHistoricoRef = useRef(false);

  useEffect(() => {
    const funcao = localStorage.getItem("funcao");
    const token = localStorage.getItem("token");

    if (!token) {
      navigate("/login");
      return;
    }

    const funcaoNormalizada = (funcao || "").toLowerCase();
    if (funcaoNormalizada === "adm") {
      navigate("/administrativo");
      return;
    }
    if (funcaoNormalizada !== "gerente") {
      toast.error("Acesso restrito ao perfil de Gerente.");
      if (funcaoNormalizada === "garcom") navigate("/garcom");
      else if (
        funcaoNormalizada === "cozinheiro" ||
        funcaoNormalizada === "cozinha"
      )
        navigate("/cozinha");
      else navigate("/login");
      return;
    }

    let ativo = true;
    async function resolverDadosGerente() {
      const idUser = getUserIdFromToken();
      if (idUser) {
        try {
          const dadosUser = await obterUsuarioPorId(idUser);
          if (ativo && dadosUser) {
            setUsuarioLogado(dadosUser);
            if (dadosUser.idRestaurante) {
              setIdRestauranteGerente(dadosUser.idRestaurante);
            }
          }
        } catch {
          // Silencia falha opcional
        }
      }
    }

    resolverDadosGerente();
    return () => {
      ativo = false;
    };
  }, [navigate, toast]);

  useEffect(() => {
    let ativo = true;
    async function carregarRestaurantes() {
      try {
        const dados = await listarRestaurantes();
        if (ativo) setRestaurantes(dados || []);
      } catch {
        // Silencia erro
      }
    }
    carregarRestaurantes();
    return () => {
      ativo = false;
    };
  }, []);

  const carregarUsuarios = useCallback(async () => {
    try {
      setCarregandoUsuarios(true);
      const params = {};
      if (idRestauranteGerente) params.idRestaurante = idRestauranteGerente;
      if (filtroFuncaoUsuario) params.funcao = filtroFuncaoUsuario;
      if (buscaUsuario.trim()) params.busca = buscaUsuario.trim();

      const dados = await listarUsuarios(params);

      const usuariosValidos = (dados || []).filter((u) => {
        if (
          idRestauranteGerente &&
          String(u.idRestaurante) !== String(idRestauranteGerente)
        ) {
          return false;
        }
        const nomeUpper = u.nome?.toUpperCase() || "";
        const emailLower = u.email?.toLowerCase() || "";
        if (nomeUpper.includes("USUARIO REMOVIDO")) return false;
        if (
          emailLower.includes("@anonimizado.local") ||
          emailLower.startsWith("removido_")
        )
          return false;
        return true;
      });

      setUsuarios(usuariosValidos);
    } catch {
      toast.error("Não foi possível carregar a lista de usuários.");
    } finally {
      setCarregandoUsuarios(false);
    }
  }, [idRestauranteGerente, filtroFuncaoUsuario, buscaUsuario, toast]);

  useEffect(() => {
    let ativo = true;
    if (abaAtiva === "usuarios") {
      Promise.resolve().then(() => {
        if (ativo) carregarUsuarios();
      });
    }
    return () => {
      ativo = false;
    };
  }, [abaAtiva, carregarUsuarios]);

  const carregarCardapio = useCallback(async () => {
    try {
      setCarregandoCardapio(true);
      const dados = await listarItensCardapio(idRestauranteGerente);
      setItensCardapio(dados || []);
    } catch {
      // Silencia erro
    } finally {
      setCarregandoCardapio(false);
    }
  }, [idRestauranteGerente]);

  useEffect(() => {
    let ativo = true;
    if (abaAtiva === "cardapio") {
      Promise.resolve().then(() => {
        if (ativo) carregarCardapio();
      });
    }
    return () => {
      ativo = false;
    };
  }, [abaAtiva, carregarCardapio]);

  const carregarEstoque = useCallback(async () => {
    try {
      setCarregandoEstoque(true);
      const dados = await buscarInsumos();
      setItensEstoque(dados || []);
    } catch {
      // Silencia erro
    } finally {
      setCarregandoEstoque(false);
    }
  }, []);

  useEffect(() => {
    let ativo = true;
    if (abaAtiva === "estoque") {
      Promise.resolve().then(() => {
        if (ativo) carregarEstoque();
      });
    }
    return () => {
      ativo = false;
    };
  }, [abaAtiva, carregarEstoque]);

  const carregarMesas = useCallback(
    async ({ silencioso = false } = {}) => {
      if (!idRestauranteGerente) return;
      const exibirLoading = !silencioso && !jaCarregouMesasRef.current;
      try {
        if (exibirLoading) setCarregandoMesas(true);
        const dados = await listarMesas(idRestauranteGerente);
        setMesas(dados || []);
        jaCarregouMesasRef.current = true;
      } catch {
        // Silencia erro
      } finally {
        if (exibirLoading) setCarregandoMesas(false);
      }
    },
    [idRestauranteGerente]
  );

  useEffect(() => {
    let ativo = true;
    if (abaAtiva === "mesas") {
      Promise.resolve().then(() => {
        if (ativo) carregarMesas({ silencioso: jaCarregouMesasRef.current });
      });
      const intervalId = setInterval(() => {
        if (ativo) carregarMesas({ silencioso: true });
      }, 8000);
      return () => {
        ativo = false;
        clearInterval(intervalId);
      };
    }
    return () => {
      ativo = false;
    };
  }, [abaAtiva, carregarMesas]);

  const carregarFilaCozinha = useCallback(
    async ({ silencioso = false } = {}) => {
      const exibirLoading = !silencioso && !jaCarregouCozinhaRef.current;
      try {
        if (exibirLoading) setCarregandoCozinha(true);
        const dados = await obterFilaCozinha();
        setFilaCozinha(dados?.items || []);
        jaCarregouCozinhaRef.current = true;
      } catch {
        // Silencia erro
      } finally {
        if (exibirLoading) setCarregandoCozinha(false);
      }
    },
    []
  );

  useEffect(() => {
    let ativo = true;
    if (abaAtiva === "cozinha") {
      Promise.resolve().then(() => {
        if (ativo)
          carregarFilaCozinha({ silencioso: jaCarregouCozinhaRef.current });
      });
      const intervalId = setInterval(() => {
        if (ativo) carregarFilaCozinha({ silencioso: true });
      }, 10000);
      return () => {
        ativo = false;
        clearInterval(intervalId);
      };
    }
    return () => {
      ativo = false;
    };
  }, [abaAtiva, carregarFilaCozinha]);

  const carregarHistorico = useCallback(
    async ({ silencioso = false } = {}) => {
      if (!idRestauranteGerente) return;
      const exibirLoading = !silencioso && !jaCarregouHistoricoRef.current;
      try {
        if (exibirLoading) setCarregandoHistorico(true);
        const dados = await listarPedidos({
          idRestaurante: idRestauranteGerente,
          tipo: "historico",
        });
        setHistoricoPedidos(dados || []);
        jaCarregouHistoricoRef.current = true;
      } catch {
        // Silencia erro
      } finally {
        if (exibirLoading) setCarregandoHistorico(false);
      }
    },
    [idRestauranteGerente]
  );

  useEffect(() => {
    let ativo = true;
    if (abaAtiva === "historico") {
      Promise.resolve().then(() => {
        if (ativo)
          carregarHistorico({ silencioso: jaCarregouHistoricoRef.current });
      });
    }
    return () => {
      ativo = false;
    };
  }, [abaAtiva, carregarHistorico]);

  const carregarMesasRef = useRef(carregarMesas);
  const carregarFilaCozinhaRef = useRef(carregarFilaCozinha);
  const carregarHistoricoRef = useRef(carregarHistorico);

  useEffect(() => {
    carregarMesasRef.current = carregarMesas;
    carregarFilaCozinhaRef.current = carregarFilaCozinha;
    carregarHistoricoRef.current = carregarHistorico;
  }, [carregarMesas, carregarFilaCozinha, carregarHistorico]);

  useEffect(() => {
    isMountedRef.current = true;
    const token = localStorage.getItem("token");
    if (!token) return;

    function abrirSocket() {
      if (wsRef.current) wsRef.current.close();

      try {
        const ws = new WebSocket(buildWsUrl());
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMountedRef.current) return;
          ws.send(JSON.stringify({ type: "authenticate", token }));
        };

        ws.onmessage = (event) => {
          if (!isMountedRef.current) return;
          try {
            const payload = JSON.parse(event.data);
            if (
              payload.type === "table.opened" ||
              payload.type === "table.status_changed" ||
              payload.type === "order.closed" ||
              payload.type === "order.created" ||
              payload.type === "mesa.garcom_chamado" ||
              payload.type === "mesa.garcom_atendido" ||
              payload.type === "queue.updated" ||
              payload.type === "kds:item_ready" ||
              payload.type === "delivery:claimed"
            ) {
              const idMesa = payload.idMesa || payload.mesa?.idMesa;
              const novoStatus = payload.status || payload.mesa?.status;
              if (idMesa && novoStatus) {
                setMesas((prev) =>
                  prev.map((m) =>
                    String(m.idMesa) === String(idMesa)
                      ? { ...m, status: novoStatus }
                      : m
                  )
                );
              }
              carregarMesasRef.current?.({ silencioso: true });
              carregarHistoricoRef.current?.({ silencioso: true });
            } else if (
              payload.type === "item.status_changed" ||
              payload.type === "kds.updated"
            ) {
              carregarFilaCozinhaRef.current?.({ silencioso: true });
              carregarMesasRef.current?.({ silencioso: true });
            }
          } catch {
            // Ignora payload malformado
          }
        };

        ws.onclose = () => {
          if (!isMountedRef.current) return;
          reconnectTimerRef.current = setTimeout(() => {
            if (isMountedRef.current) abrirSocket();
          }, 4000);
        };
      } catch {
        // Ignora erro de inicialização
      }
    }

    abrirSocket();

    return () => {
      isMountedRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  function handleLogout() {
    localStorage.removeItem("token");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    localStorage.removeItem("funcao");
    navigate("/login");
  }

  const mapRestaurantes = useMemo(
    () =>
      restaurantes.reduce((acc, curr) => {
        acc[curr.idRestaurante] = curr.nome;
        return acc;
      }, {}),
    [restaurantes]
  );

  const nomeRestauranteAtual = idRestauranteGerente
    ? mapRestaurantes[idRestauranteGerente]
    : undefined;

  const secoes = useMemo(
    () => [
      { id: "usuarios", label: "Equipe", icon: MdPeople },
      { id: "cardapio", label: "Cardápio", icon: MdRestaurantMenu },
      { id: "estoque", label: "Estoque", icon: MdInventory },
      { id: "mesas", label: "Mesas", icon: MdTableBar },
      { id: "cozinha", label: "Cozinha", icon: MdSoupKitchen },
      { id: "historico", label: "Histórico", icon: MdHistory },
    ],
    []
  );

  return (
    <AppShell
      modulo="Painel do Gerente"
      restauranteNome={nomeRestauranteAtual}
      secoes={secoes}
      secaoAtiva={abaAtiva}
      onSecao={setAbaAtiva}
      usuario={usuarioLogado}
      onLogout={handleLogout}
    >
      <Suspense
        fallback={
          <Card className="py-16 flex justify-center">
            <Spinner size="lg" label="Carregando seção..." />
          </Card>
        }
      >
        {abaAtiva === "usuarios" && (
          <SecaoEquipe
            usuarios={usuarios}
            carregando={carregandoUsuarios}
            restaurantes={restaurantes}
            mapRestaurantes={mapRestaurantes}
            idRestauranteGerente={idRestauranteGerente}
            buscaUsuario={buscaUsuario}
            setBuscaUsuario={setBuscaUsuario}
            filtroFuncaoUsuario={filtroFuncaoUsuario}
            setFiltroFuncaoUsuario={setFiltroFuncaoUsuario}
            onRecarregar={carregarUsuarios}
          />
        )}

        {abaAtiva === "cardapio" && (
          <SecaoCardapio
            itensCardapio={itensCardapio}
            carregando={carregandoCardapio}
            idRestauranteGerente={idRestauranteGerente}
            onRecarregar={carregarCardapio}
          />
        )}

        {abaAtiva === "estoque" && (
          <SecaoEstoque
            itensEstoque={itensEstoque}
            carregando={carregandoEstoque}
            idRestauranteGerente={idRestauranteGerente}
            onRecarregar={carregarEstoque}
          />
        )}

        {abaAtiva === "mesas" && (
          <SecaoMesas
            mesas={mesas}
            carregando={carregandoMesas}
            idRestauranteGerente={idRestauranteGerente}
            onRecarregar={carregarMesas}
          />
        )}

        {abaAtiva === "cozinha" && (
          <SecaoCozinha
            filaCozinha={filaCozinha}
            carregando={carregandoCozinha}
            onRecarregar={carregarFilaCozinha}
          />
        )}

        {abaAtiva === "historico" && (
          <SecaoHistorico
            historicoPedidos={historicoPedidos}
            carregando={carregandoHistorico}
            onRecarregar={carregarHistorico}
          />
        )}
      </Suspense>
    </AppShell>
  );
}

export default TelaGerente;
