import { useState, useEffect } from 'react';
import { getClientes, criarCliente, atualizarCliente, excluirCliente } from '../api';
import { useAuth } from '../context/AuthContext';

interface Cliente {
  id: number;
  nome: string;
  endereco: string;
  telefone: string | null;
  categoria: string | null;
  observacoes: string | null;
}

const CATEGORIAS = ['Bar', 'Mercado', 'Restaurante', 'Padaria', 'Residencial', 'Outro'];

export default function Clientes() {
  const { usuario } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [busca, setBusca] = useState('');
  const [editandoId, setEditandoId] = useState<number | null>(null);

  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [telefone, setTelefone] = useState('');
  const [categoria, setCategoria] = useState('Bar');
  const [erro, setErro] = useState('');

  async function carregar() {
    setCarregando(true);
    try {
      setClientes(await getClientes());
    } catch (err: any) {
      setErro(err.message);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, []);

  const limparForm = () => {
    setNome(''); setEndereco(''); setTelefone(''); setCategoria('Bar'); setEditandoId(null);
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!nome || !endereco) { setErro('Preencha Nome e Endereço!'); return; }

    try {
      if (editandoId) {
        await atualizarCliente(editandoId, { nome, endereco, telefone, categoria });
      } else {
        await criarCliente({ nome, endereco, telefone, categoria });
      }
      limparForm();
      carregar();
    } catch (err: any) {
      setErro(err.message);
    }
  };

  const iniciarEdicao = (c: Cliente) => {
    setEditandoId(c.id);
    setNome(c.nome);
    setEndereco(c.endereco);
    setTelefone(c.telefone || '');
    setCategoria(c.categoria || 'Bar');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExcluir = async (id: number) => {
    if (!confirm('Excluir este cliente?')) return;
    try {
      await excluirCliente(id);
      carregar();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const clientesFiltrados = clientes.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.endereco.toLowerCase().includes(busca.toLowerCase())
  );

  return (
    <div style={{ padding: '20px' }}>
      <section style={cardStyle}>
        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>{editandoId ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}</h3>
        {erro && <div style={{ color: '#f87171', marginBottom: '15px' }}>{erro}</div>}
        <form onSubmit={handleSalvar} className="grid-formulario cols-4">
          <div>
            <label style={labelStyle}>Nome do Cliente</label>
            <input type="text" placeholder="Ex: Bar do Pedro" value={nome} onChange={(e) => setNome(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Endereço Completo</label>
            <input type="text" placeholder="Ex: Rua A, 10 - Centro" value={endereco} onChange={(e) => setEndereco(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Telefone</label>
            <input type="text" placeholder="(00) 00000-0000" value={telefone} onChange={(e) => setTelefone(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Categoria</label>
            <select value={categoria} onChange={(e) => setCategoria(e.target.value)} style={inputStyle}>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button type="submit" style={btnPrimaryStyle}>{editandoId ? 'Salvar' : 'Adicionar'}</button>
            {editandoId && <button type="button" onClick={limparForm} style={btnCancelStyle}>Cancelar</button>}
          </div>
        </form>
      </section>

      <section style={{ ...cardStyle, marginTop: '30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
          <h3 style={{ margin: 0 }}>Lista de Clientes ({clientesFiltrados.length})</h3>
          <input
            type="text" placeholder="🔎 Buscar por nome ou endereço..."
            value={busca} onChange={(e) => setBusca(e.target.value)}
            style={{ ...inputStyle, maxWidth: '280px' }}
          />
        </div>

        {carregando ? <p style={{ color: '#777' }}>Carregando...</p> : (
          <>
            {/* Tabela para desktop */}
            <div className="tabela-desktop tabela-responsiva">
              <table style={tableStyle}>
                <thead>
                  <tr>
                    <th style={thStyle}>Nome</th>
                    <th style={thStyle}>Categoria</th>
                    <th style={thStyle}>Endereço</th>
                    <th style={thStyle}>Telefone</th>
                    <th style={thStyle}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {clientesFiltrados.map(cliente => (
                    <tr key={cliente.id} style={trStyle}>
                      <td style={{ ...tdStyle, fontWeight: 'bold', color: '#fff' }}>{cliente.nome}</td>
                      <td style={tdStyle}>{cliente.categoria || '-'}</td>
                      <td style={tdStyle}>{cliente.endereco}</td>
                      <td style={tdStyle}>{cliente.telefone || '-'}</td>
                      <td style={tdStyle}>
                        <button onClick={() => iniciarEdicao(cliente)} style={btnActionStyle}>Editar</button>
                        {usuario?.role === 'ADMIN' && (
                          <button onClick={() => handleExcluir(cliente.id)} style={{ ...btnActionStyle, color: '#f87171' }}>Excluir</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cards para mobile */}
            <div className="cards-mobile">
              {clientesFiltrados.map(cliente => (
                <div key={cliente.id} className="card-mobile">
                  <div style={{ fontWeight: 'bold', color: '#fff', fontSize: '1.05rem', marginBottom: '8px' }}>{cliente.nome}</div>
                  <div className="card-mobile-linha"><span className="card-mobile-label">Categoria</span><span className="card-mobile-valor">{cliente.categoria || '-'}</span></div>
                  <div className="card-mobile-linha"><span className="card-mobile-label">Endereço</span><span className="card-mobile-valor">{cliente.endereco}</span></div>
                  <div className="card-mobile-linha"><span className="card-mobile-label">Telefone</span><span className="card-mobile-valor">{cliente.telefone || '-'}</span></div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <button onClick={() => iniciarEdicao(cliente)} style={{ ...btnActionStyle, flex: 1 }}>Editar</button>
                    {usuario?.role === 'ADMIN' && (
                      <button onClick={() => handleExcluir(cliente.id)} style={{ ...btnActionStyle, color: '#f87171', flex: 1 }}>Excluir</button>
                    )}
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
const btnPrimaryStyle = { padding: '12px 24px', backgroundColor: '#22c55e', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold' as const, cursor: 'pointer', fontSize: '1rem', flex: 1 };
const btnCancelStyle = { padding: '12px 20px', backgroundColor: 'transparent', color: '#ccc', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' };
const tableStyle = { width: '100%', borderCollapse: 'collapse' as const, fontSize: '0.95rem' };
const thStyle = { textAlign: 'left' as const, padding: '15px', color: '#777', borderBottom: '2px solid #222' };
const trStyle = { borderBottom: '1px solid #1a1a1a' };
const tdStyle = { padding: '15px', color: '#ccc' };
const btnActionStyle = { padding: '8px 12px', backgroundColor: '#2a2a2a', color: '#ccc', border: 'none', borderRadius: '6px', cursor: 'pointer', marginRight: '5px', fontSize: '0.85rem' };
