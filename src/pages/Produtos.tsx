import { useState, useEffect } from 'react';
import { getProdutos, criarProduto, atualizarProduto, excluirProduto } from '../api';

interface Produto {
  id: number;
  nome: string;
  categoria: string | null;
  unidade: string;
  preco: number;
  desconto: number;
  estoque: number;
  estoqueMin: number;
}

const CATEGORIAS = ['Cerveja', 'Refrigerante', 'Destilado', 'Água', 'Energético', 'Vinho', 'Geral'];
const UNIDADES = ['Unidade', 'Caixa', 'Fardo', 'Garrafa', 'Pacote'];

export default function Produtos() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [busca, setBusca] = useState('');

  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('Cerveja');
  const [unidade, setUnidade] = useState('Caixa');
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
      await criarProduto({ nome, categoria, unidade, preco: Number(preco), desconto: Number(desconto), estoque: Number(estoque) });
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

  const produtosFiltrados = produtos.filter(p =>
    p.nome.toLowerCase().includes(busca.toLowerCase()) ||
    (p.categoria || '').toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div style={{ padding: '20px' }}>
      <section style={cardStyle}>
        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Cadastrar Produto</h3>
        {erro && <div style={{ color: '#f87171', marginBottom: '15px' }}>{erro}</div>}
        <form onSubmit={handleAdicionar} style={{ display: 'grid', gap: '15px' }}>
          <div className="grid-formulario" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))' }}>
            <div>
              <label style={labelStyle}>Nome do Produto</label>
              <input type="text" placeholder="Ex: Skol 350ml" value={nome} onChange={(e) => setNome(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Categoria</label>
              <select value={categoria} onChange={(e) => setCategoria(e.target.value)} style={inputStyle}>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Unidade</label>
              <select value={unidade} onChange={(e) => setUnidade(e.target.value)} style={inputStyle}>
                {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
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
          </div>
          <button type="submit" style={{ ...btnPrimaryStyle, alignSelf: 'start' }}>Adicionar Produto</button>
        </form>
      </section>

      <section style={{ ...cardStyle, marginTop: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ margin: 0 }}>Catálogo / Estoque ({produtosFiltrados.length})</h3>
          <input
            type="text" placeholder="🔎 Buscar produto ou categoria..."
            value={busca} onChange={(e) => setBusca(e.target.value)}
            style={{ ...inputStyle, maxWidth: '280px' }}
          />
        </div>

        {carregando ? <p style={{ color: '#777' }}>Carregando...</p> : (
          <>
            <div className="tabela-desktop tabela-responsiva">
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Produto</th>
                    <th style={thStyle}>Categoria</th>
                    <th style={thStyle}>Unidade</th>
                    <th style={thStyle}>Preço</th>
                    <th style={thStyle}>Desconto</th>
                    <th style={thStyle}>Estoque</th>
                    <th style={thStyle}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {produtosFiltrados.map(p => (
                    <tr key={p.id} style={trStyle}>
                      <td style={{ ...tdStyle, fontWeight: 'bold', color: '#fff' }}>{p.nome}</td>
                      <td style={tdStyle}>{p.categoria || '-'}</td>
                      <td style={tdStyle}>{p.unidade}</td>
                      <td style={tdStyle}>R$ {(p.preco || 0).toFixed(2)}</td>
                      <td style={tdStyle}>{p.desconto > 0 ? `${p.desconto}%` : '-'}</td>
                      <td style={{ ...tdStyle, color: p.estoque <= p.estoqueMin ? '#f87171' : '#ccc', fontWeight: p.estoque <= p.estoqueMin ? 'bold' : 'normal' }}>
                        {p.estoque} {p.estoque <= p.estoqueMin && '⚠️'}
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
            </div>

            <div className="cards-mobile">
              {produtosFiltrados.map(p => (
                <div key={p.id} className="card-mobile">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold', color: '#fff', fontSize: '1.05rem' }}>{p.nome}</span>
                    <span style={{ color: '#22c55e', fontWeight: 'bold' }}>R$ {(p.preco || 0).toFixed(2)}</span>
                  </div>
                  <div className="card-mobile-linha"><span className="card-mobile-label">Categoria</span><span className="card-mobile-valor">{p.categoria} · {p.unidade}</span></div>
                  <div className="card-mobile-linha"><span className="card-mobile-label">Desconto</span><span className="card-mobile-valor">{p.desconto > 0 ? `${p.desconto}%` : '-'}</span></div>
                  <div className="card-mobile-linha">
                    <span className="card-mobile-label">Estoque</span>
                    <span className="card-mobile-valor" style={{ color: p.estoque <= p.estoqueMin ? '#f87171' : '#eee' }}>{p.estoque} {p.estoque <= p.estoqueMin && '⚠️'}</span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button onClick={() => handleEstoqueRapido(p, 10)} style={{ ...btnActionStyle, flex: 1 }}>+10</button>
                    <button onClick={() => handleEstoqueRapido(p, -1)} style={{ ...btnActionStyle, flex: 1 }}>-1</button>
                    <button onClick={() => handleExcluir(p.id)} style={{ ...btnActionStyle, color: '#f87171', flex: 1 }}>Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

const cardStyle = { backgroundColor: '#111111', padding: '20px', borderRadius: '12px', border: '1px solid #222222' };
const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '0.85rem', color: '#999' };
const inputStyle = { width: '100%', padding: '12px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '1rem', boxSizing: 'border-box' as const };
const btnPrimaryStyle = { padding: '12px 24px', backgroundColor: '#22c55e', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold' as const, cursor: 'pointer', fontSize: '1rem' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.95rem' };
const thStyle = { textAlign: 'left' as const, padding: '15px', color: '#777', borderBottom: '2px solid #222' };
const trStyle = { borderBottom: '1px solid #1a1a1a' };
const tdStyle = { padding: '15px', color: '#ccc' };
const btnActionStyle = { padding: '8px 12px', backgroundColor: '#2a2a2a', color: '#ccc', border: 'none', borderRadius: '6px', cursor: 'pointer', marginRight: '5px', fontSize: '0.85rem' };
