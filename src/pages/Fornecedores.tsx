import { useState, useEffect } from 'react';
import { getFornecedores, criarFornecedor, getEntradasEstoque, registrarEntradaEstoque, getProdutos } from '../api';

export default function Fornecedores() {
  const [fornecedores, setFornecedores] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [entradas, setEntradas] = useState<any[]>([]);
  const [erro, setErro] = useState('');

  const [nomeFornecedor, setNomeFornecedor] = useState('');
  const [telefoneFornecedor, setTelefoneFornecedor] = useState('');

  const [produtoId, setProdutoId] = useState('');
  const [fornecedorId, setFornecedorId] = useState('');
  const [quantidade, setQuantidade] = useState('');
  const [custoUnitario, setCustoUnitario] = useState('');

  const carregar = async () => {
    try {
      const [f, p, e] = await Promise.all([getFornecedores(), getProdutos(), getEntradasEstoque()]);
      setFornecedores(f); setProdutos(p); setEntradas(e);
    } catch (err: any) { setErro(err.message); }
  };

  useEffect(() => { carregar(); }, []);

  const handleCriarFornecedor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomeFornecedor) return;
    try {
      await criarFornecedor({ nome: nomeFornecedor, telefone: telefoneFornecedor || undefined });
      setNomeFornecedor(''); setTelefoneFornecedor('');
      carregar();
    } catch (err: any) { setErro(err.message); }
  };

  const handleRegistrarEntrada = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!produtoId || !quantidade) { setErro('Escolha o produto e a quantidade.'); return; }
    try {
      await registrarEntradaEstoque({
        produtoId: Number(produtoId),
        fornecedorId: fornecedorId ? Number(fornecedorId) : undefined,
        quantidade: Number(quantidade),
        custoUnitario: custoUnitario ? Number(custoUnitario) : undefined
      });
      setProdutoId(''); setFornecedorId(''); setQuantidade(''); setCustoUnitario('');
      carregar();
    } catch (err: any) { setErro(err.message); }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ color: '#22c55e', marginTop: 0 }}>🚚 Fornecedores & Entrada de Estoque</h2>
      {erro && <div style={{ color: '#f87171', marginBottom: '15px' }}>{erro}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '25px' }}>
        <section style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Cadastrar Fornecedor</h3>
          <form onSubmit={handleCriarFornecedor} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <input placeholder="Nome do fornecedor" value={nomeFornecedor} onChange={e => setNomeFornecedor(e.target.value)} style={inputStyle} />
            <input placeholder="Telefone (opcional)" value={telefoneFornecedor} onChange={e => setTelefoneFornecedor(e.target.value)} style={inputStyle} />
            <button type="submit" style={btnPrimario}>Cadastrar</button>
          </form>
          <div style={{ marginTop: '15px' }}>
            {fornecedores.map(f => (
              <div key={f.id} style={{ padding: '8px 0', borderBottom: '1px solid #1a1a1a', color: '#ccc', fontSize: '0.9rem' }}>
                {f.nome} {f.telefone && <span style={{ color: '#666' }}>· {f.telefone}</span>}
              </div>
            ))}
          </div>
        </section>

        <section style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Registrar Entrada de Estoque</h3>
          <form onSubmit={handleRegistrarEntrada} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <select value={produtoId} onChange={e => setProdutoId(e.target.value)} style={inputStyle}>
              <option value="">Selecione o produto...</option>
              {produtos.map(p => <option key={p.id} value={p.id}>{p.nome} (estoque atual: {p.estoque})</option>)}
            </select>
            <select value={fornecedorId} onChange={e => setFornecedorId(e.target.value)} style={inputStyle}>
              <option value="">Fornecedor (opcional)...</option>
              {fornecedores.map(f => <option key={f.id} value={f.id}>{f.nome}</option>)}
            </select>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <input type="number" placeholder="Quantidade" value={quantidade} onChange={e => setQuantidade(e.target.value)} style={inputStyle} />
              <input type="number" step="0.01" placeholder="Custo unit. (opcional)" value={custoUnitario} onChange={e => setCustoUnitario(e.target.value)} style={inputStyle} />
            </div>
            <button type="submit" style={btnPrimario}>Registrar Entrada</button>
          </form>
        </section>
      </div>

      <section style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>Histórico de Entradas</h3>
        {entradas.length === 0 ? <p style={{ color: '#666' }}>Nenhuma entrada registrada ainda.</p> : (
          entradas.map((e: any) => (
            <div key={e.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #1a1a1a', fontSize: '0.9rem' }}>
              <span style={{ color: '#ccc' }}>{e.produto.nome} {e.fornecedor && `— ${e.fornecedor.nome}`}</span>
              <span style={{ color: '#4ade80' }}>+{e.quantidade} · {new Date(e.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
          ))
        )}
      </section>
    </div>
  );
}

const cardStyle = { backgroundColor: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #222' };
const inputStyle = { width: '100%', padding: '12px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '1rem', boxSizing: 'border-box' as const };
const btnPrimario = { padding: '12px', backgroundColor: '#22c55e', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold' as const, cursor: 'pointer' };