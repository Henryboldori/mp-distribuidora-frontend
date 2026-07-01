import { useState, useEffect } from 'react';
import { getClientes, getProdutos, criarPedido } from '../api';

interface Cliente { id: number; nome: string; }
interface Produto { id: number; nome: string; preco: number; desconto: number; estoque: number; }
interface ItemCarrinho extends Produto { quantidade: number; }

export default function NovoPedido() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [buscaCliente, setBuscaCliente] = useState('');
  const [clienteSel, setClienteSel] = useState<Cliente | null>(null);
  const [itens, setItens] = useState<ItemCarrinho[]>([]);
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

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
    setItens(prev => {
      const existente = prev.find(i => i.id === produto.id);
      if (existente) {
        return prev.map(i => i.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i);
      }
      return [...prev, { ...produto, quantidade: 1 }];
    });
  };

  const removerItem = (id: number) => {
    setItens(prev => prev.filter(i => i.id !== id));
  };

  const precoComDesconto = (p: { preco: number; desconto: number }) => p.preco * (1 - p.desconto / 100);
  const totalPedido = itens.reduce((acc, i) => acc + precoComDesconto(i) * i.quantidade, 0);

  const finalizarPedido = async () => {
    setErro(''); setSucesso('');
    if (!clienteSel || itens.length === 0) { setErro('Selecione um cliente e ao menos um produto!'); return; }

    try {
      await criarPedido({
        clienteId: clienteSel.id,
        itens: itens.map(i => ({ produtoId: i.id, quantidade: i.quantidade }))
      });
      setSucesso('Pedido enviado com sucesso!');
      setItens([]);
      setClienteSel(null);
    } catch (err: any) {
      setErro(err.message);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h3 style={{ color: '#22c55e', marginTop: 0 }}>Novo Pedido</h3>
      {erro && <div style={{ color: '#f87171', marginBottom: '15px' }}>{erro}</div>}
      {sucesso && <div style={{ color: '#4ade80', marginBottom: '15px' }}>{sucesso}</div>}

      <div style={{ background: '#111', padding: '15px', borderRadius: '10px', marginBottom: '15px' }}>
        <input
          placeholder="Buscar Cliente..."
          value={buscaCliente}
          onChange={e => setBuscaCliente(e.target.value)}
          style={inStyle}
        />
        {buscaCliente && !clienteSel && (
          <div style={{ marginTop: '10px', border: '1px solid #333' }}>
            {clientes.filter(c => c.nome.toLowerCase().includes(buscaCliente.toLowerCase())).map(c => (
              <div key={c.id} onClick={() => { setClienteSel(c); setBuscaCliente(''); }} style={{ padding: '12px', borderBottom: '1px solid #222', cursor: 'pointer' }}>
                {c.nome}
              </div>
            ))}
          </div>
        )}
        {clienteSel && (
          <div style={{ marginTop: '10px', color: '#22c55e', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
            <span>Cliente: {clienteSel.nome}</span>
            <button onClick={() => setClienteSel(null)} style={{ background: 'none', border: 'none', color: '#999', cursor: 'pointer' }}>trocar</button>
          </div>
        )}
      </div>

      <div style={{ background: '#111', padding: '15px', borderRadius: '10px' }}>
        <h4 style={{ marginTop: 0 }}>Produtos</h4>
        {produtos.map(p => (
          <div key={p.id} onClick={() => adicionarItem(p)} style={{ padding: '12px', borderBottom: '1px solid #222', display: 'flex', justifyContent: 'space-between', cursor: 'pointer', opacity: p.estoque === 0 ? 0.4 : 1 }}>
            <span>{p.nome} {p.estoque === 0 && '(sem estoque)'}</span>
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
            <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #222' }}>
              <span>{i.quantidade}x {i.nome}</span>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span>R$ {(precoComDesconto(i) * i.quantidade).toFixed(2)}</span>
                <button onClick={() => removerItem(i.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>x</button>
              </div>
            </div>
          ))}
          <button onClick={finalizarPedido} style={{ width: '100%', padding: '15px', marginTop: '15px', backgroundColor: '#22c55e', color: '#000', border: 'none', borderRadius: '10px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer' }}>
            ENVIAR PEDIDO (R$ {totalPedido.toFixed(2)})
          </button>
        </div>
      )}
    </div>
  );
}

const inStyle = { width: '100%', padding: '12px', backgroundColor: '#000', border: '1px solid #333', color: '#fff', borderRadius: '8px', outline: 'none', boxSizing: 'border-box' as const };
