// Arquivo central de comunicacao com o backend.
// Todas as telas devem usar essas funcoes em vez de fazer fetch() na mao.

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Pega o token salvo no login para mandar junto nas requisicoes protegidas
function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

// Trata erros de forma padronizada em todas as chamadas
async function tratarResposta(res: Response) {
  if (!res.ok) {
    const erroData = await res.json().catch(() => ({}));
    throw new Error(erroData.erro || 'Erro ao comunicar com o servidor.');
  }
  return res.json();
}

// ---------- AUTENTICACAO ----------
export async function login(email: string, senha: string) {
  const res = await fetch(`${API}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha })
  });
  return tratarResposta(res);
}

// ---------- CLIENTES ----------
export async function getClientes() {
  const res = await fetch(`${API}/clientes`, { headers: getHeaders() });
  return tratarResposta(res);
}

export async function criarCliente(data: { nome: string; endereco: string; telefone?: string }) {
  const res = await fetch(`${API}/clientes`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  return tratarResposta(res);
}

// ---------- PRODUTOS ----------
export async function getProdutos() {
  const res = await fetch(`${API}/produtos`, { headers: getHeaders() });
  return tratarResposta(res);
}

export async function criarProduto(data: {
  nome: string; descricao?: string; preco: number; desconto?: number; estoque?: number; estoqueMin?: number;
}) {
  const res = await fetch(`${API}/produtos`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  return tratarResposta(res);
}

export async function atualizarProduto(id: number, data: Partial<{
  nome: string; descricao: string; preco: number; desconto: number; estoque: number; estoqueMin: number;
}>) {
  const res = await fetch(`${API}/produtos/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  return tratarResposta(res);
}

export async function excluirProduto(id: number) {
  const res = await fetch(`${API}/produtos/${id}`, { method: 'DELETE', headers: getHeaders() });
  return tratarResposta(res);
}

// ---------- PEDIDOS ----------
export async function getPedidos() {
  const res = await fetch(`${API}/pedidos`, { headers: getHeaders() });
  return tratarResposta(res);
}

export async function criarPedido(data: { clienteId: number; itens: { produtoId: number; quantidade: number }[] }) {
  const res = await fetch(`${API}/pedidos`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  return tratarResposta(res);
}

export async function atualizarStatusPedido(id: number, status: string) {
  const res = await fetch(`${API}/pedidos/${id}/status`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify({ status })
  });
  return tratarResposta(res);
}

// ---------- USUARIOS (somente admin) ----------
export async function getUsuarios() {
  const res = await fetch(`${API}/usuarios`, { headers: getHeaders() });
  return tratarResposta(res);
}

export async function criarUsuario(data: { nome: string; email: string; senha: string; role: 'ADMIN' | 'VENDEDOR' }) {
  const res = await fetch(`${API}/usuarios`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  return tratarResposta(res);
}

// ---------- DASHBOARD (somente admin) ----------
export async function getDashboard() {
  const res = await fetch(`${API}/dashboard`, { headers: getHeaders() });
  return tratarResposta(res);
}
