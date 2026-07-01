import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linkStyle = ({ isActive }: { isActive: boolean }) => ({
  padding: '10px 16px',
  borderRadius: '8px',
  textDecoration: 'none',
  color: isActive ? '#000' : '#ccc',
  backgroundColor: isActive ? '#22c55e' : 'transparent',
  fontWeight: isActive ? 'bold' as const : 'normal' as const,
  fontSize: '0.9rem'
});

export default function Menu() {
  const { usuario, deslogar } = useAuth();

  return (
    <nav style={{
      display: 'flex', gap: '8px', alignItems: 'center', padding: '15px 20px',
      backgroundColor: '#0a0a0a', borderBottom: '1px solid #222', flexWrap: 'wrap'
    }}>
      <strong style={{ color: '#22c55e', marginRight: '20px' }}>M&P Distribuidora</strong>

      {usuario?.role === 'VENDEDOR' && (
        <>
          <NavLink to="/" style={linkStyle} end>Novo Pedido</NavLink>
          <NavLink to="/clientes" style={linkStyle}>Clientes</NavLink>
          <NavLink to="/pedidos" style={linkStyle}>Meus Pedidos</NavLink>
          <NavLink to="/rotas" style={linkStyle}>Rotas</NavLink>
        </>
      )}

      {usuario?.role === 'ADMIN' && (
        <>
          <NavLink to="/" style={linkStyle} end>Dashboard</NavLink>
          <NavLink to="/produtos" style={linkStyle}>Produtos / Estoque</NavLink>
          <NavLink to="/clientes" style={linkStyle}>Clientes</NavLink>
          <NavLink to="/pedidos" style={linkStyle}>Pedidos</NavLink>
          <NavLink to="/usuarios" style={linkStyle}>Equipe</NavLink>
        </>
      )}

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <span style={{ color: '#777', fontSize: '0.85rem' }}>{usuario?.nome}</span>
        <button
          onClick={deslogar}
          style={{ background: 'transparent', border: '1px solid #333', color: '#ccc', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer' }}
        >
          Sair
        </button>
      </div>
    </nav>
  );
}
