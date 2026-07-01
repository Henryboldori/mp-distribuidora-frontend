import { useState, useEffect } from 'react';
import { getClientes, getProdutos, criarPedido } from '../api';

interface Cliente { id: number; nome: string; telefone: string | null; }
interface Produto { id: number; nome: string; unidade: string; preco: number; desconto: number; estoque: number; }
interface ItemCarrinho extends Produto { quantidade: number; }

const FORMAS_PAGAMENTO = [
  { valor: 'DINHEIRO', label: '💵 Dinheiro' },
  { valor: 'PIX', label: '📱 Pix' },
  { valor: 'CARTAO', label: '💳 Cartão' },
  { valor: 'FIADO', label: '📝 Fiado (a prazo)' }
];

export default function NovoPedido() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [clienteSel, setClienteSel] = useState<Cliente | null>(null);
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [formaPagamento, setFormaPagamento] = useState('DINHEIRO');
  const [erro, setErro] = useState('');
  const [pedidoConcluido, setPedidoConcluido] = useState<{ cliente: Cliente; total: number } | null>(null);

  useEffect(() => {
    async function carregarDados() {
      try {
        const [c, p] = await Promise.all([getClientes(), getProdutos()]);
        setClientes(c);
        setProdutos(p);
      } catch (err: any) {
        setErro(err.message);
      }
    }
    carregarDados();
  }, []);

  const adicionarItem = (produto: Produto) => {
    if (produto.estoque === 0) return;
    setItens(prev => {
      const existente = prev.find(i => i.id === produto.id);
      if (existente) {
        return prev.map(i => i.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i);
      }
      return [...prev, { ...produto, quantidade: 1 }];
    });
  };

  const alterarQuantidade = (id: number, delta: number) => {
    setItens(prev => prev
      .map(i => i.id === id ? { ...i, quantidade: i.quantidade + delta } : i)
      .filter(i => i.quantidade > 0));
  };

  const precoComDesconto = (p: { preco: number; desconto: number }) => (p.preco || 0) * (1 - (p.desconto || 0) / 100);
  const totalPedido = itens.reduce((acc, i) => acc + precoComDesconto(i) * i.quantidade, 0);

  const finalizarPedido = async () => {
    setErro('');
    if (!clienteSel || itens.length === 0) { setErro('Selecione um cliente e ao menos um produto!'); return; }

    try {
      await criarPedido({
        clienteId: clienteSel.id,
        itens: itens.map(i => ({ produtoId: i.id, quantidade: i.quantidade })),
        formaPagamento
      });
      setPedidoConcluido({ cliente: clienteSel, total: totalPedido });
      setItens([]);
      setClienteSel(null);
      setFormaPagamento('DINHEIRO');
    } catch (err: any) {
      setErro(err.message);
    }
  };

  const enviarWhatsapp = () => {
    if (!pedidoConcluido) return;
    const texto = `Olá, ${pedidoConcluido.cliente.nome}! Seu pedido foi registrado. Total: R$ ${pedidoConcluido.total.toFixed(2)}. Obrigado pela preferência! 🐦`;
    const telefone = pedidoConcluido.cliente.telefone?.replace(/\D/g, '');
    const url = telefone
      ? `https://wa.me/55${telefone}?text=${encodeURIComponent(texto)}`
      : `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  if (pedidoConcluido) {
    return (
      <div style={{ padding: '20px', maxWidth: '450px', margin: '40px auto', textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>✅</div>
        <h3 style={{ color: '#22c55e' }}>Pedido enviado com sucesso!</h3>
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
      <h3 style={{ color: '#22c55e', marginTop: 0 }}>Novo Pedido</h3>
      {erro && <div style={{ color: '#f87171', marginBottom: '15px' }}>{erro}</div>}

      <div style={{ background: '#111', padding: '15px', borderRadius: '10px', marginBottom: '15px' }}>
        <input
          placeholder="Buscar Cliente..."
          value={buscaCliente}
          onChange={e => setBuscaCliente(e.target.value)}
          style={inStyle}
        />
        {buscaCliente && !clienteSel && (
          <div style={{ marginTop: '10px', border: '1px solid #333', borderRadius: '8px', overflow: 'hidden' }}>
            {clientes.filter(c => c.nome.toLowerCase().includes(buscaCliente.toLowerCase())).map(c => (
              <div key={c.id} onClick={() => { setClienteSel(c); setBuscaCliente(''); }} style={{ padding: '12px', borderBottom: '1px solid #222', cursor: 'pointer' }}>
                {c.nome}
              </div>
            ))}
          </div>
        )}
        {clienteSel && (
          <div style={{ marginTop: '10px', color: '#22c55e', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
            <span>✓ {clienteSel.nome}</span>
            <button onClick={() => setClienteSel(null)} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}>trocar</button>
          </div>
        )}
      </div>

      <div style={{ background: '#111', padding: '15px', borderRadius: '10px' }}>
        <h4 style={{ marginTop: 0 }}>Produtos</h4>
        {produtos.map(p => (
          <div key={p.id} onClick={() => adicionarItem(p)} style={{ padding: '12px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', cursor: p.estoque === 0 ? 'not-allowed' : 'pointer', opacity: p.estoque === 0 ? 0.4 : 1 }}>
            <span>{p.nome} <span style={{ color: '#666', fontSize: '0.8rem' }}>({p.unidade})</span> {p.estoque === 0 && '— sem estoque'}</span>
            <span style={{ color: '#22c55e' }}>
              {p.desconto > 0 && <span style={{ color: '#777', textDecoration: 'line-through', marginRight: '8px' }}>R$ {(p.preco || 0).toFixed(2)}</span>}
              R$ {precoComDesconto(p).toFixed(2)}
            </span>
          </div>
        ))}
      </div>

      {itens.length > 0 && (
        <div style={{ marginTop: '20px', padding: '15px', background: '#111', borderRadius: '10px' }}>
          <h4 style={{ marginTop: 0 }}>Carrinho</h4>
          {itens.map(i => (
            <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #222' }}>
              <span style={{ flex: 1 }}>{i.nome}</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button onClick={() => alterarQuantidade(i.id, -1)} style={btnQtd}>-</button>
                <span style={{ minWidth: '20px', textAlign: 'center' }}>{i.quantidade}</span>
                <button onClick={() => alterarQuantidade(i.id, 1)} style={btnQtd}>+</button>
                <span style={{ minWidth: '75px', textAlign: 'right' }}>R$ {(precoComDesconto(i) * i.quantidade).toFixed(2)}</span>
              </div>
            </div>
          ))}

          <div style={{ marginTop: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#999', fontSize: '0.85rem' }}>Forma de Pagamento</label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {FORMAS_PAGAMENTO.map(f => (
                <button
                  key={f.valor}
                  type="button"
                  onClick={() => setFormaPagamento(f.valor)}
                  style={{
                    padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem',
                    border: formaPagamento === f.valor ? '2px solid #22c55e' : '1px solid #333',
                    backgroundColor: formaPagamento === f.valor ? '#0f2417' : '#1a1a1a',
                    color: formaPagamento === f.valor ? '#22c55e' : '#ccc'
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={finalizarPedido} style={{ width: '100%', padding: '15px', marginTop: '20px', backgroundColor: '#22c55e', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>
            ENVIAR PEDIDO (R$ {totalPedido.toFixed(2)})
          </button>
        </div>
      )}
    </div>
  );
}

const inStyle = { width: '100%', padding: '12px', backgroundColor: '#000', border: '1px solid #333', color: '#fff', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' as const };
const btnQtd = { width: '28px', height: '28px', borderRadius: '6px', border: '1px solid #333', backgroundColor: '#1a1a1a', color: '#fff', cursor: 'pointer', fontSize: '1rem' };
