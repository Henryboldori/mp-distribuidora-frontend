import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginApi } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);
  const { logar } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    setCarregando(true);
    try {
      const data = await loginApi(email, senha);
      logar({ id: data.id, nome: data.nome, role: data.role }, data.token);
      navigate('/');
    } catch (err: any) {
      setErro(err.message || 'Erro ao fazer login.');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#050505' }}>
      <div style={{ backgroundColor: '#111', padding: '30px', borderRadius: '15px', width: '350px', border: '1px solid #222' }}>
        <h2 style={{ color: '#22c55e', textAlign: 'center', fontFamily: 'monospace' }}>🐦 Bebidas Pelicano</h2>
        <form onSubmit={handleLogin} style={{ marginTop: '20px' }}>
          <input
            type="email"
            style={inputStyle}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="E-mail"
            required
          />
          <input
            type="password"
            style={inputStyle}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="Senha"
            required
          />
          {erro && <div style={{ color: '#f87171', fontSize: '0.85rem', marginBottom: '15px' }}>{erro}</div>}
          <button type="submit" style={buttonStyle} disabled={carregando}>
            {carregando ? 'Entrando...' : 'ENTRAR'}
          </button>
        </form>
      </div>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '12px', marginBottom: '15px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff', outline: 'none', boxSizing: 'border-box' as const };
const buttonStyle = { width: '100%', padding: '12px', backgroundColor: '#22c55e', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold' as const, cursor: 'pointer' };
