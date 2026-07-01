import { useState, useEffect } from 'react';
import { getClientes, criarCliente } from '../api';

interface Cliente {
  id: number;
  nome: string;
  endereco: string;
  telefone: string | null;
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [nome, setNome] = useState('');
  const [endereco, setEndereco] = useState('');
  const [telefone, setTelefone] = useState('');
  const [erro, setErro] = useState('');

  async function carregar() {
    setCarregando(true);
    try {
      const data = await getClientes();
      setClientes(data);
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

    if (!nome || !endereco) {
      setErro('Preencha Nome e Endereço!');
      return;
    }

    try {
      await criarCliente({ nome, endereco, telefone });
      setNome(''); setEndereco(''); setTelefone('');
      carregar(); // recarrega a lista vinda do banco
    } catch (err: any) {
      setErro(err.message);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <section style={cardStyle}>
        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Cadastrar Novo Cliente</h3>
        {erro && <div style={{ color: '#f87171', marginBottom: '15px' }}>{erro}</div>}
        <form onSubmit={handleAdicionar} style={{ display: 'grid', gridTemplateColumns: '2fr 2fr 1fr auto', gap: '15px', alignItems: 'end' }}>
          <div>
            <label style={labelStyle}>Nome do Estabelecimento/Cliente</label>
            <input type="text" placeholder="Ex: Bar do Pedro" value={nome} onChange={(e) => setNome(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Endereço Completo</label>
            <input type="text" placeholder="Ex: Rua A, 10 - Bairro Centro" value={endereco} onChange={(e) => setEndereco(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Telefone</label>
            <input type="text" placeholder="(00) 00000-0000" value={telefone} onChange={(e) => setTelefone(e.target.value)} style={inputStyle} />
          </div>
          <button type="submit" style={btnPrimaryStyle}>Adicionar</button>
        </form>
      </section>

      <section style={{ ...cardStyle, marginTop: '30px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px' }}>Lista de Clientes</h3>
        {carregando ? <p style={{ color: '#777' }}>Carregando...</p> : (
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={thStyle}>Nome</th>
                <th style={thStyle}>Endereço</th>
                <th style={thStyle}>Telefone</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map(cliente => (
                <tr key={cliente.id} style={trStyle}>
                  <td style={{ ...tdStyle, fontWeight: 'bold', color: '#fff' }}>{cliente.nome}</td>
                  <td style={tdStyle}>{cliente.endereco}</td>
                  <td style={tdStyle}>{cliente.telefone || '-'}</td>
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
