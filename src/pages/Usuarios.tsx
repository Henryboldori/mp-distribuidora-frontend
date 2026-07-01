import { useState, useEffect } from 'react';
import { getUsuarios, criarUsuario } from '../api';

interface Usuario {
  id?: number;
  nome: string;
  email: string;
  role: 'ADMIN' | 'VENDEDOR';
}

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'VENDEDOR'>('VENDEDOR');
  const [mensagem, setMensagem] = useState({ texto: '', tipo: '' });

  const carregarUsuarios = async () => {
    try {
      setUsuarios(await getUsuarios());
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  useEffect(() => { carregarUsuarios(); }, []);

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await criarUsuario({ nome, email, senha, role });
      setMensagem({ texto: 'Usuário criado com sucesso!', tipo: 'sucesso' });
      setNome(''); setEmail(''); setSenha('');
      carregarUsuarios();
    } catch (error: any) {
      setMensagem({ texto: error.message || 'Erro ao criar usuário.', tipo: 'erro' });
    }
  };

  return (
    <div style={{ padding: '30px' }}>
      <h2 style={{ marginBottom: '30px' }}>Equipe - Distribuidora M&P</h2>

      <div style={{ backgroundColor: '#111', padding: '25px', borderRadius: '12px', border: '1px solid #222', marginBottom: '30px' }}>
        <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.1rem' }}>Cadastrar Novo Membro</h3>

        {mensagem.texto && (
          <div style={{ padding: '10px', borderRadius: '6px', marginBottom: '20px', backgroundColor: mensagem.tipo === 'sucesso' ? '#065f4630' : '#991b1b30', color: mensagem.tipo === 'sucesso' ? '#34d399' : '#f87171', border: '1px solid' }}>
            {mensagem.texto}
          </div>
        )}

        <form onSubmit={handleSalvar} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px' }}>
          <div>
            <label style={labelStyle}>Nome</label>
            <input type="text" value={nome} onChange={e => setNome(e.target.value)} style={inputStyle} required />
          </div>
          <div>
            <label style={labelStyle}>E-mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} required />
          </div>
          <div>
            <label style={labelStyle}>Senha</label>
            <input type="password" value={senha} onChange={e => setSenha(e.target.value)} style={inputStyle} required />
          </div>
          <div>
            <label style={labelStyle}>Perfil (Cargo)</label>
            <select value={role} onChange={e => setRole(e.target.value as any)} style={inputStyle}>
              <option value="VENDEDOR">Vendedor (App Mobile)</option>
              <option value="ADMIN">Administrador (Painel Completo)</option>
            </select>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="submit" style={buttonStyle}>Criar Acesso</button>
          </div>
        </form>
      </div>

      <div style={{ backgroundColor: '#111', borderRadius: '12px', border: '1px solid #222', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead style={{ backgroundColor: '#1a1a1a', color: '#888' }}>
            <tr>
              <th style={thTdStyle}>Nome</th>
              <th style={thTdStyle}>E-mail</th>
              <th style={thTdStyle}>Acesso</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((u) => (
              <tr key={u.id} style={{ borderBottom: '1px solid #222' }}>
                <td style={thTdStyle}>{u.nome}</td>
                <td style={thTdStyle}>{u.email}</td>
                <td style={thTdStyle}>
                  <span style={{
                    padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem',
                    backgroundColor: u.role === 'ADMIN' ? '#3b82f630' : '#22c55e30',
                    color: u.role === 'ADMIN' ? '#60a5fa' : '#4ade80'
                  }}>
                    {u.role}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', marginBottom: '8px', fontSize: '0.8rem', color: '#888' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #333', backgroundColor: '#1a1a1a', color: '#fff', outline: 'none', boxSizing: 'border-box' as const };
const thTdStyle = { padding: '15px', borderBottom: '1px solid #222' };
const buttonStyle = { width: '100%', padding: '12px', backgroundColor: '#22c55e', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold' as const, cursor: 'pointer' };
