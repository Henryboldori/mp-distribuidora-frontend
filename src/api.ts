// Arquivo central de comunicacao com o backend.
// Todas as telas devem usar essas funcoes em vez de fazer fetch() na mao.

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

function getHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
}

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

export async function criarCliente(data: { nome: string; endereco?: string; telefone?: string; categoria?: string; observacoes?: string }) {
  const res = await fetch(`${API}/clientes`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
  return tratarResposta(res);
}

export async function atualizarCliente(id: number, data: Partial<{ nome: string; endereco: string; telefone: string; categoria: string; observacoes: string }>) {
  const res = await fetch(`${API}/clientes/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) });
  return tratarResposta(res);
}

export async function excluirCliente(id: number) {
  const res = await fetch(`${API}/clientes/${id}`, { method: 'DELETE', headers: getHeaders() });
  return tratarResposta(res);
}

// ---------- PRODUTOS ----------
export async function getProdutos() {
  const res = await fetch(`${API}/produtos`, { headers: getHeaders() });
  return tratarResposta(res);
}

export async function criarProduto(data: {
  nome: string; descricao?: string; categoria?: string; unidade?: string; preco: number; desconto?: number; estoque?: number; estoqueMin?: number;
}) {
  const res = await fetch(`${API}/produtos`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
  return tratarResposta(res);
}

export async function atualizarProduto(id: number, data: Partial<{
  nome: string; descricao: string; categoria: string; unidade: string; preco: number; desconto: number; estoque: number; estoqueMin: number;
}>) {
  const res = await fetch(`${API}/produtos/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) });
  return tratarResposta(res);
}

export async function excluirProduto(id: number) {
  const res = await fetch(`${API}/produtos/${id}`, { method: 'DELETE', headers: getHeaders() });
  return tratarResposta(res);
}

// ---------- PEDIDOS ----------
export async function getPedidos(filtros?: { clienteId?: number; data?: string }) {
  const params = new URLSearchParams();
  if (filtros?.clienteId) params.set('clienteId', String(filtros.clienteId));
  if (filtros?.data) params.set('data', filtros.data);
  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API}/pedidos${qs}`, { headers: getHeaders() });
  return tratarResposta(res);
}

export async function getPedido(id: number) {
  const res = await fetch(`${API}/pedidos/${id}`, { headers: getHeaders() });
  return tratarResposta(res);
}

interface ItemCarrinhoEnvio {
  produtoId?: number;
  nomeAvulso?: string;
  unidadeAvulso?: string;
  quantidade: number;
  precoUnit?: number;
}

export async function criarPedido(data: {
  clienteId: number; itens: ItemCarrinhoEnvio[]; formaPagamento?: string; observacoes?: string;
}) {
  const res = await fetch(`${API}/pedidos`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
  return tratarResposta(res);
}

export async function atualizarPedido(id: number, data: {
  clienteId?: number; itens: ItemCarrinhoEnvio[]; formaPagamento?: string; observacoes?: string;
}) {
  const res = await fetch(`${API}/pedidos/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(data) });
  return tratarResposta(res);
}

export async function atualizarStatusPedido(id: number, status: string) {
  const res = await fetch(`${API}/pedidos/${id}/status`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ status }) });
  return tratarResposta(res);
}

export async function atualizarPagamentoPedido(id: number, statusPagamento: string) {
  const res = await fetch(`${API}/pedidos/${id}/pagamento`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify({ statusPagamento }) });
  return tratarResposta(res);
}

export async function excluirPedido(id: number) {
  const res = await fetch(`${API}/pedidos/${id}`, { method: 'DELETE', headers: getHeaders() });
  return tratarResposta(res);
}

// ---------- ROMANEIO ----------
export async function getRomaneio(data?: string) {
  const qs = data ? `?data=${data}` : '';
  const res = await fetch(`${API}/romaneio${qs}`, { headers: getHeaders() });
  return tratarResposta(res);
}

// ---------- BUSCA GERAL ----------
export async function buscarGeral(q: string) {
  const res = await fetch(`${API}/busca?q=${encodeURIComponent(q)}`, { headers: getHeaders() });
  return tratarResposta(res);
}

// ---------- USUARIOS (somente admin) ----------
export async function getUsuarios() {
  const res = await fetch(`${API}/usuarios`, { headers: getHeaders() });
  return tratarResposta(res);
}

export async function criarUsuario(data: { nome: string; email: string; senha: string; role: 'ADMIN' | 'VENDEDOR' }) {
  const res = await fetch(`${API}/usuarios`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
  return tratarResposta(res);
}

// ---------- DASHBOARD ----------
export async function getDashboard() {
  const res = await fetch(`${API}/dashboard`, { headers: getHeaders() });
  return tratarResposta(res);
}

// ---------- FORNECEDORES E ENTRADA DE ESTOQUE (somente admin) ----------
export async function getFornecedores() {
  const res = await fetch(`${API}/fornecedores`, { headers: getHeaders() });
  return tratarResposta(res);
}

export async function criarFornecedor(data: { nome: string; telefone?: string }) {
  const res = await fetch(`${API}/fornecedores`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
  return tratarResposta(res);
}

export async function getEntradasEstoque(produtoId?: number) {
  const qs = produtoId ? `?produtoId=${produtoId}` : '';
  const res = await fetch(`${API}/fornecedores/entradas${qs}`, { headers: getHeaders() });
  return tratarResposta(res);
}

export async function registrarEntradaEstoque(data: { produtoId: number; fornecedorId?: number; quantidade: number; custoUnitario?: number }) {
  const res = await fetch(`${API}/fornecedores/entradas`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(data) });
  return tratarResposta(res);
}

// ---------- RELATORIOS ----------
export async function getRelatorio(inicio?: string, fim?: string, vendedorId?: number) {
  const params = new URLSearchParams();
  if (inicio) params.set('inicio', inicio);
  if (fim) params.set('fim', fim);
  if (vendedorId) params.set('vendedorId', String(vendedorId));
  const qs = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API}/relatorios${qs}`, { headers: getHeaders() });
  return tratarResposta(res);
}

// ---------- CONTAS A RECEBER (inadimplentes) ----------
export async function getInadimplentes() {
  const res = await fetch(`${API}/relatorios/inadimplentes`, { headers: getHeaders() });
  return tratarResposta(res);
}

// ---------- CLIENTES INATIVOS ----------
export async function getClientesInativos(dias?: number) {
  const qs = dias ? `?dias=${dias}` : '';
  const res = await fetch(`${API}/relatorios/clientes-inativos${qs}`, { headers: getHeaders() });
  return tratarResposta(res);
}