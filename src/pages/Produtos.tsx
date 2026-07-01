import { useState, useEffect } from 'react';
import { getProdutos, criarProduto, atualizarProduto, excluirProduto } from '../api';

interface Produto {
  id: number;
  nome: string;
  descricao: string | null;
  preco: number;
  desconto: number;
  estoque: number;
  estoqueMin: number;
}

// Tela do ADMIN: cadastra produtos, define preço, desconto e controla estoque
export default function Produtos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  const [nome, setNome] = useState('');
  const [preco, setPreco] = useState('');
  const [desconto, setDesconto] = useState('0');
  const [estoque, setEstoque] = useState('0');

  async function carregar() {
    setCarregando(true);
    try {
      setProdutos(await getProdutos());
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, []);

  const handleAdicionar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!nome || !preco) { setErro('Preencha nome e preço.'); return; }

    try {
      await criarProduto({ nome, preco: Number(preco), desconto: Number(desconto), estoque: Number(estoque) });
      setNome(''); setPreco(''); setDesconto('0'); setEstoque('0');
      carregar();
    } catch (err: any) {
      setErro(err.message);
    }
  };

  const handleEstoqueRapido = async (produto: Produto, delta: number) => {
    const novoEstoque = Math.max(0, produto.estoque + delta);
    await atualizarProduto(produto.id, { estoque: novoEstoque });
    carregar();
  };

  const handleExcluir = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      await excluirProduto(id);
      carregar();
    } catch (err: any) {
      setErro(err.message);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <section style={cardStyle}>
        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Cadastrar Produto</h3>
        {erro && <div style={{ color: '#f87171', marginBottom: '15px' }}>{erro}</div>}
        <form onSubmit={handleAdicionar} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '15px', alignItems: 'end' }}>
          <div>
            <label style={labelStyle}>Nome do Produto</label>
            <input type="text" placeholder="Ex: Cerveja Skol 350ml" value={nome} onChange={(e) => setNome(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Preço (R$)</label>
            <input type="number" step="0.01" value={preco} onChange={(e) => setPreco(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Desconto (%)</label>
            <input type="number" step="0.01" value={desconto} onChange={(e) => setDesconto(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Estoque inicial</label>
            <input type="number" value={estoque} onChange={(e) => setEstoque(e.target.value)} style={inputStyle} />
          </div>
          <button type="submit" style={btnPrimaryStyle}>Adicionar</button>
        </form>
      </section>

      <section style={{ ...cardStyle, marginTop: '30px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Catálogo / Estoque</h3>
        {carregando ? <p style={{ color: '#777' }}>Carregando...</p> : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Produto</th>
                <th style={thStyle}>Preço</th>
                <th style={thStyle}>Desconto</th>
                <th style={thStyle}>Estoque</th>
                <th style={thStyle}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map(p => (
                <tr key={p.id} style={trStyle}>
                  <td style={{ ...tdStyle, fontWeight: 'bold', color: '#fff' }}>{p.nome}</td>
                  <td style={tdStyle}>R$ {p.preco.toFixed(2)}</td>
                  <td style={tdStyle}>{p.desconto > 0 ? `${p.desconto}%` : '-'}</td>
                  <td style={{ ...tdStyle, color: p.estoque <= p.estoqueMin ? '#f87171' : '#ccc', fontWeight: p.estoque <= p.estoqueMin ? 'bold' : 'normal' }}>
                    {p.estoque} {p.estoque <= p.estoqueMin && '⚠️ baixo'}
                  </td>
                  <td style={tdStyle}>
                    <button onClick={() => handleEstoqueRapido(p, 10)} style={btnActionStyle}>+10</button>
                    <button onClick={() => handleEstoqueRapido(p, -1)} style={btnActionStyle}>-1</button>
                    <button onClick={() => handleExcluir(p.id)} style={{ ...btnActionStyle, color: '#f87171' }}>Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

const cardStyle = { backgroundColor: '#111111', padding: '25px', borderRadius: '12px', border: '1px solid #222222' };
const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: '#999' };
const inputStyle = { width: '100%', padding: '12px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '1rem', boxSizing: 'border-box' as const };
const btnPrimaryStyle = { padding: '12px 24px', backgroundColor: '#22c55e', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold' as const, cursor: 'pointer', fontSize: '1rem' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.95rem' };
const thStyle = { textAlign: 'left' as const, padding: '15px', color: '#777', borderBottom: '2px solid #222' };
const trStyle = { borderBottom: '1px solid #1a1a1a' };
const tdStyle = { padding: '15px', color: '#ccc' };
const btnActionStyle = { padding: '6px 12px', backgroundColor: '#2a2a2a', color: '#ccc', border: 'none', borderRadius: '4px', cursor: 'pointer', marginRight: '5px' };
