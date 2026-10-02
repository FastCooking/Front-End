const BASE_URL = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const API_URL = `${BASE_URL}/mesas`;

function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

// Chave para armazenamento local em caso de fallback mock
const MOCK_STORAGE_KEY = 'fastcooking_mesas_mock';

function gerarTokenMesa() {
  const rand = Math.random().toString(36).substring(2, 10);
  return `tbl_${rand}`;
}

function gerarQrCodeUrl(token) {
  const path = `/cliente/mesa/${token}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(path)}`;
}

function obterMesasMock() {
  const salvas = localStorage.getItem(MOCK_STORAGE_KEY);
  if (salvas) {
    try {
      return JSON.parse(salvas);
    } catch {
      // Ignora erro de parse e reseta
    }
  }

  // Dados iniciais de exemplo se não houver no localStorage
  const mesasIniciais = [
    {
      idMesa: 'mesa-1',
      numero: 1,
      status: 'Disponivel',
      token: 'tbl_m1_abc',
      link: '/cliente/mesa/tbl_m1_abc',
      qrCodeUrl: gerarQrCodeUrl('tbl_m1_abc'),
      pedidosAtivos: [],
    },
    {
      idMesa: 'mesa-2',
      numero: 2,
      status: 'Ocupada',
      token: 'tbl_m2_def',
      link: '/cliente/mesa/tbl_m2_def',
      qrCodeUrl: gerarQrCodeUrl('tbl_m2_def'),
      pedidosAtivos: [
        {
          idPedido: 'PED-1042',
          status: 'Em Preparo',
          total: 89.90,
          qtdItens: 3,
          dataAbertura: new Date().toISOString(),
        },
      ],
    },
    {
      idMesa: 'mesa-3',
      numero: 3,
      status: 'Disponivel',
      token: 'tbl_m3_ghi',
      link: '/cliente/mesa/tbl_m3_ghi',
      qrCodeUrl: gerarQrCodeUrl('tbl_m3_ghi'),
      pedidosAtivos: [],
    },
  ];

  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mesasIniciais));
  return mesasIniciais;
}

function salvarMesasMock(mesas) {
  localStorage.setItem(MOCK_STORAGE_KEY, JSON.stringify(mesas));
}

export async function listarMesas(idRestaurante) {
  try {
    const query = idRestaurante ? `?idRestaurante=${idRestaurante}` : '';
    const response = await fetch(`${API_URL}${query}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('Backend indisponível para mesas, utilizando dados mock locais.', err);
  }

  // Fallback para mock
  return obterMesasMock();
}

export async function criarMesa(dados) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(dados),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('Backend indisponível para criação de mesa, utilizando mock local.', err);
  }

  // Fallback mock
  const mesas = obterMesasMock();
  const numeroNum = Number(dados.numero);
  
  if (mesas.some((m) => Number(m.numero) === numeroNum)) {
    throw new Error(`A Mesa ${numeroNum} já existe.`);
  }

  const token = gerarTokenMesa();
  const novaMesa = {
    idMesa: `mesa_${Date.now()}`,
    numero: numeroNum,
    status: dados.status || 'Disponivel',
    token,
    link: `/cliente/mesa/${token}`,
    qrCodeUrl: gerarQrCodeUrl(token),
    pedidosAtivos: [],
  };

  mesas.push(novaMesa);
  salvarMesasMock(mesas);
  return novaMesa;
}

export async function atualizarMesa(idMesa, dados) {
  try {
    const response = await fetch(`${API_URL}/${idMesa}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(dados),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('Backend indisponível para atualização de mesa, utilizando mock local.', err);
  }

  // Fallback mock
  const mesas = obterMesasMock();
  const index = mesas.findIndex((m) => String(m.idMesa) === String(idMesa));
  
  if (index === -1) {
    throw new Error('Mesa não encontrada.');
  }

  if (dados.numero !== undefined) {
    const num = Number(dados.numero);
    if (mesas.some((m, idx) => idx !== index && Number(m.numero) === num)) {
      throw new Error(`A Mesa ${num} já existe.`);
    }
    mesas[index].numero = num;
  }

  if (dados.status) {
    mesas[index].status = dados.status;
  }

  salvarMesasMock(mesas);
  return mesas[index];
}

export async function renovarTokenMesa(idMesa) {
  try {
    const response = await fetch(`${API_URL}/${idMesa}/renovar-token`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('Backend indisponível para renovação de token, utilizando mock local.', err);
  }

  // Fallback mock
  const mesas = obterMesasMock();
  const index = mesas.findIndex((m) => String(m.idMesa) === String(idMesa));
  
  if (index === -1) {
    throw new Error('Mesa não encontrada.');
  }

  const novoToken = gerarTokenMesa();
  mesas[index].token = novoToken;
  mesas[index].link = `/cliente/mesa/${novoToken}`;
  mesas[index].qrCodeUrl = gerarQrCodeUrl(novoToken);

  salvarMesasMock(mesas);
  return mesas[index];
}

export async function excluirMesa(idMesa) {
  try {
    const response = await fetch(`${API_URL}/${idMesa}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (response.ok || response.status === 204) {
      return true;
    }
  } catch (err) {
    console.warn('Backend indisponível para exclusão de mesa, utilizando mock local.', err);
  }

  // Fallback mock
  const mesas = obterMesasMock();
  const novasMesas = mesas.filter((m) => String(m.idMesa) !== String(idMesa));
  salvarMesasMock(novasMesas);
  return true;
}
