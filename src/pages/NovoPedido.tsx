import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getClientes, getProdutos, criarCliente, criarPedido, atualizarPedido, getPedido, getPedidos } from '../api';

interface Cliente { id: number; nome: string; telefone: string | null; endereco: string | null; }
interface Produto { id: number; nome: string; unidade: string; preco: number; desconto: number; estoque: number; }

interface ItemCarrinho {
  chave: string;
  produtoId: number;
  nome: string;
  unidade: string;
  precoUnit: number;
  quantidade: number;
  estoqueDisponivel?: number;
}

const FORMAS_PAGAMENTO = [
  { valor: 'DINHEIRO', label: '💵 Dinheiro' },
  { valor: 'PIX', label: '📱 Pix' },
  { valor: 'CARTAO', label: '💳 Cartão' },
  { valor: 'FIADO', label: '📝 Fiado (a prazo)' }
];

export default function NovoPedido() {
  const { id } = useParams();
  const navigate = useNavigate();
  const modoEdicao = !!id;

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [clienteSel, setClienteSel] = useState<Cliente | null>(null);
  const [historicoCliente, setHistoricoCliente] = useState<any[]>([]);

  const [buscaProduto, setBuscaProduto] = useState('');
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [formaPagamento, setFormaPagamento] = useState('DINHEIRO');
  const [erro, setErro] = useState('');
  const [pedidoConcluido, setPedidoConcluido] = useState<{ cliente: Cliente; total: number } | null>(null);

  const [mostrarNovoCliente, setMostrarNovoCliente] = useState(false);
  const [novoClienteTelefone, setNovoClienteTelefone] = useState('');
  const [novoClienteEndereco, setNovoClienteEndereco] = useState('');

  useEffect(() => {
    async function carregarDados() {
      try {
        const [c, p] = await Promise.all([getClientes(), getProdutos()]);
        setClientes(c);
        setProdutos(p);

        if (modoEdicao && id) {
          const pedido = await getPedido(Number(id));
          setClienteSel(pedido.cliente);
          setFormaPagamento(pedido.formaPagamento);
          setItens(pedido.itens.filter((i: any) => i.produtoId).map((i: any) => ({
            chave: `prod-${i.produtoId}`,
            produtoId: i.produtoId,
            nome: i.produto?.nome || 'Produto',
            unidade: i.produto?.unidade || 'Unidade',
            precoUnit: i.precoUnit,
            quantidade: i.quantidade,
            estoqueDisponivel: i.produto?.estoque
          })));
        }
      } catch (err: any) {
        setErro(err.message);
      }
    }
    carregarDados();
  }, [id]);

  useEffect(() => {
    if (!clienteSel) { setHistoricoCliente([]); return; }
    getPedidos({ clienteId: clienteSel.id }).then((lista) => {
      setHistoricoCliente(lista.filter((p: any) => p.id !== Number(id)).slice(0, 3));
    }).catch(() => {});
  }, [clienteSel]);

  const clientesFiltrados = buscaCliente ? clientes.filter(c => c.nome.toLowerCase().includes(buscaCliente.toLowerCase())) : [];

  const selecionarCliente = (c: Cliente) => {
    setClienteSel(c);
    setBuscaCliente('');
    setMostrarNovoCliente(false);
  };

  const cadastrarClienteRapido = async () => {
    if (!buscaCliente.trim()) return;
    try {
      const novo = await criarCliente({ nome: buscaCliente.trim(), endereco: novoClienteEndereco || undefined, telefone: novoClienteTelefone || undefined });
      setClientes(prev => [...prev, novo]);
      selecionarCliente(novo);
      setNovoClienteTelefone(''); setNovoClienteEndereco('');
    } catch (err: any) {
      setErro(err.message);
    }
  };

  const produtosFiltrados = buscaProduto ? produtos.filter(p => p.nome.toLowerCase().includes(buscaProduto.toLowerCase())) : produtos;
  const precoComDesconto = (p: Produto) => (p.preco || 0) * (1 - (p.desconto || 0) / 100);

  const adicionarItem = (produto: Produto) => {
    setItens(prev => {
      const existente = prev.find(i => i.produtoId === produto.id);
      if (existente) return prev.map(i => i.produtoId === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i);
      return [...prev, {
        chave: `prod-${produto.id}`, produtoId: produto.id, nome: produto.nome, unidade: produto.unidade,
        precoUnit: precoComDesconto(produto), quantidade: 1, estoqueDisponivel: produto.estoque
      }];
    });
  };

  const alterarQuantidade = (chave: string, delta: number) => {
    setItens(prev => prev.map(i => i.chave === chave ? { ...i, quantidade: i.quantidade + delta } : i).filter(i => i.quantidade > 0));
  };

  const totalPedido = itens.reduce((acc, i) => acc + i.precoUnit * i.quantidade, 0);

  const finalizarPedido = async () => {
    setErro('');
    if (!clienteSel || itens.length === 0) { setErro('Selecione um cliente e ao menos um produto!'); return; }

    const itensEnvio = itens.map(i => ({ produtoId: i.produtoId, quantidade: i.quantidade, precoUnit: i.precoUnit }));

    try {
      if (modoEdicao && id) {
        await atualizarPedido(Number(id), { clienteId: clienteSel.id, itens: itensEnvio, formaPagamento });
        navigate('/pedidos');
        return;
      }

      await criarPedido({ clienteId: clienteSel.id, itens: itensEnvio, formaPagamento });
      setPedidoConcluido({ cliente: clienteSel, total: totalPedido });

      const texto = `Olá, ${clienteSel.nome}! Seu pedido foi registrado. Total: R$ ${totalPedido.toFixed(2)}. Obrigado pela preferência! 🐦`;
      const telefone = clienteSel.telefone?.replace(/\D/g, '');
      if (telefone) window.open(`https://wa.me/55${telefone}?text=${encodeURIComponent(texto)}`, '_blank');

      setItens([]); setClienteSel(null); setFormaPagamento('DINHEIRO');
    } catch (err: any) {
      setErro(err.message);
    }
  };

  const enviarWhatsapp = () => {
    if (!pedidoConcluido) return;
    const texto = `Olá, ${pedidoConcluido.cliente.nome}! Seu pedido foi registrado. Total: R$ ${pedidoConcluido.total.toFixed(2)}. Obrigado pela preferência! 🐦`;
    const telefone = pedidoConcluido.cliente.telefone?.replace(/\D/g, '');
    const url = telefone ? `https://wa.me/55${telefone}?text=${encodeURIComponent(texto)}` : `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  if (pedidoConcluido) {
    return (
      <div style={{ padding: '20px', maxWidth: '450px', margin: '40px auto', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>✅</div>
        <h3 style={{ color: '#22c55e' }}>Pedido registrado!</h3>
        <p style={{ color: '#ccc' }}>{pedidoConcluido.cliente.nome} — R$ {pedidoConcluido.total.toFixed(2)}</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '25px' }}>
          <button onClick={enviarWhatsapp} style={{ padding: '14px', backgroundColor: '#25D366', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1rem' }}>
            📲 Enviar confirmação no WhatsApp
          </button>
          <button onClick={() => setPedidoConcluido(null)} style={{ padding: '14px', backgroundColor: 'transparent', color: '#ccc', border: '1px solid #333', borderRadius: '10px', cursor: 'pointer', fontSize: '1rem' }}>
            Fazer Novo Pedido
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h3 style={{ color: '#22c55e', marginTop: 0 }}>{modoEdicao ? `Editando Pedido #${id}` : 'Fazer Pedido'}</h3>
      {erro && <div style={{ color: '#f87171', marginBottom: '15px' }}>{erro}</div>}

      <div style={{ background: '#111', padding: '15px', borderRadius: '10px', marginBottom: '15px' }}>
        {!clienteSel ? (
          <>
            <input placeholder="Buscar cliente pelo nome..." value={buscaCliente} onChange={e => setBuscaCliente(e.target.value)} style={inStyle} />
            {buscaCliente && (
              <div style={{ marginTop: '10px', border: '1px solid #333', borderRadius: '8px', overflow: 'hidden' }}>
                {clientesFiltrados.map(c => (
                  <div key={c.id} onClick={() => selecionarCliente(c)} style={{ padding: '12px', borderBottom: '1px solid #222', cursor: 'pointer' }}>{c.nome}</div>
                ))}
                {!mostrarNovoCliente ? (
                  <div onClick={() => setMostrarNovoCliente(true)} style={{ padding: '12px', color: '#22c55e', cursor: 'pointer', fontWeight: 'bold' }}>
                    + Cadastrar "{buscaCliente}" como novo cliente
                  </div>
                ) : (
                  <div style={{ padding: '12px', backgroundColor: '#0a0a0a' }}>
                    <div style={{ color: '#22c55e', marginBottom: '8px', fontWeight: 'bold' }}>Novo cliente: {buscaCliente}</div>
                    <input placeholder="Telefone (opcional)" value={novoClienteTelefone} onChange={e => setNovoClienteTelefone(e.target.value)} style={{ ...inStyle, marginBottom: '8px' }} />
                    <input placeholder="Endereço (opcional)" value={novoClienteEndereco} onChange={e => setNovoClienteEndereco(e.target.value)} style={{ ...inStyle, marginBottom: '8px' }} />
                    <button onClick={cadastrarClienteRapido} style={{ ...btnPrimario, width: '100%' }}>Salvar e Selecionar</button>
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <div style={{ color: '#22c55e', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
            <span>✓ {clienteSel.nome}</span>
            <button onClick={() => setClienteSel(null)} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}>trocar</button>
          </div>
        )}

        {clienteSel && historicoCliente.length > 0 && (
          <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #222' }}>
            <div style={{ color: '#777', fontSize: '0.8rem', marginBottom: '8px' }}>📜 Últimos pedidos deste cliente:</div>
            {historicoCliente.map((p: any) => (
              <div key={p.id} style={{ fontSize: '0.85rem', color: '#aaa', padding: '4px 0' }}>
                {new Date(p.createdAt).toLocaleDateString('pt-BR')} — {p.itens.map((i: any) => i.produto?.nome || i.nomeAvulso).join(', ')} (R$ {p.valorTotal.toFixed(2)})
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ background: '#111', padding: '15px', borderRadius: '10px' }}>
        <input placeholder="Buscar produto..." value={buscaProduto} onChange={e => setBuscaProduto(e.target.value)} style={{ ...inStyle, marginBottom: '10px' }} />
        {produtosFiltrados.map(p => (
          <div key={p.id} onClick={() => adicionarItem(p)} style={{ padding: '12px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', cursor: 'pointer' }}>
            <span>
              {p.nome} <span style={{ color: '#666', fontSize: '0.8rem' }}>({p.unidade})</span>
              {p.estoque <= 0 && <span style={{ color: '#f59e0b', fontSize: '0.8rem' }}> ⚠️ sem estoque</span>}
            </span>
            <span style={{ color: '#22c55e' }}>
              {p.desconto > 0 && <span style={{ color: '#777', textDecoration: 'line-through', marginRight: '8px' }}>R$ {p.preco.toFixed(2)}</span>}
              R$ {precoComDesconto(p).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {itens.length > 0 && (
        <div style={{ marginTop: '20px', padding: '15px', background: '#111', borderRadius: '10px' }}>
          <h4 style={{ marginTop: 0 }}>Carrinho</h4>
          {itens.map(i => (
            <div key={i.chave} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #222' }}>
              <span style={{ flex: 1 }}>
                {i.nome}
                {i.estoqueDisponivel !== undefined && i.quantidade > i.estoqueDisponivel && (
                  <div style={{ color: '#f59e0b', fontSize: '0.75rem' }}>⚠️ estoque: {i.estoqueDisponivel}</div>
                )}
              </span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button onClick={() => alterarQuantidade(i.chave, -1)} style={btnQtd}>-</button>
                <span style={{ minWidth: '20px', textAlign: 'center' }}>{i.quantidade}</span>
                <button onClick={() => alterarQuantidade(i.chave, 1)} style={btnQtd}>+</button>
                <span style={{ minWidth: '75px', textAlign: 'right' }}>R$ {(i.precoUnit * i.quantidade).toFixed(2)}</span>
              </div>
            </div>
          ))}

          <div style={{ marginTop: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#999', fontSize: '0.85rem' }}>Forma de Pagamento</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {FORMAS_PAGAMENTO.map(f => (
                <button key={f.valor} type="button" onClick={() => setFormaPagamento(f.valor)}
                  style={{
                    padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem',
                    border: formaPagamento === f.valor ? '2px solid #22c55e' : '1px solid #333',
                    backgroundColor: formaPagamento === f.valor ? '#0f2417' : '#1a1a1a',
                    color: formaPagamento === f.valor ? '#22c55e' : '#ccc'
                  }}>{f.label}</button>
              ))}
            </div>
          </div>

          <button onClick={finalizarPedido} style={{ width: '100%', padding: '15px', marginTop: '20px', backgroundColor: '#22c55e', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>
            {modoEdicao ? 'Salvar Alterações' : `ENVIAR PEDIDO (R$ ${totalPedido.toFixed(2)})`}
          </button>
        </div>
      )}
    </div>
  );
}

const inStyle = { width: '100%', padding: '12px', backgroundColor: '#000', border: '1px solid #333', color: '#fff', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' as const };
const btnQtd = { width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #333', backgroundColor: '#1a1a1a', color: '#fff', cursor: 'pointer', fontSize: '1rem' };
const btnPrimario = { padding: '10px 16px', backgroundColor: '#22c55e', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold' as const, cursor: 'pointer' };