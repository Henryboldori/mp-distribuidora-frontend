import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const linkStyle = ({ isActive }: { isActive: boolean }) => ({
  padding: '10px 16px',
  borderRadius: '8px',
  textDecoration: 'none',
  color: isActive ? '#000' : '#ccc',
  backgroundColor: isActive ? '#22c55e' : 'transparent',
  fontWeight: isActive ? 'bold' as const : 'normal' as const,
  fontSize: '0.95rem',
  display: 'block'
});

export default function Menu() {
  const { usuario, deslogar } = useAuth();
  const [aberto, setAberto] = useState(false);
  const navigate = useNavigate();

  const links = usuario?.role === 'ADMIN'
    ? [
        { to: '/', label: 'Início', end: true },
        { to: '/pedidos', label: 'Pedidos' },
        { to: '/clientes', label: 'Clientes' },
        { to: '/produtos', label: 'Produtos / Estoque' },
        { to: '/usuarios', label: 'Equipe' }
      ]
    : [
        { to: '/', label: 'Início', end: true },
        { to: '/novo-pedido', label: 'Novo Pedido' },
        { to: '/pedidos', label: 'Meus Pedidos' },
        { to: '/clientes', label: 'Clientes' },
        { to: '/rotas', label: 'Rotas' }
      ];

  const handleClickLink = () => setAberto(false);

  const handleSair = () => {
    deslogar();
    navigate('/login');
  };

  return (
    <nav style={{ backgroundColor: '#0a0a0a', borderBottom: '1px solid #222' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 20px' }}>
        <strong style={{ color: '#22c55e', fontSize: '1.05rem' }}>🐦 Bebidas Pelicano</strong>

        {/* Botão hambúrguer, só aparece no mobile via CSS */}
        <button
          onClick={() => setAberto(!aberto)}
          className="botao-hamburguer"
          style={{ background: 'none', border: '1px solid #333', borderRadius: '8px', color: '#fff', padding: '8px 12px', cursor: 'pointer', fontSize: '1.1rem', display: 'none' }}
        >
          {aberto ? '✕' : '☰'}
        </button>

        {/* Menu de desktop, sempre visível em telas largas */}
        <div className="menu-desktop" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {links.map(l => (
            <NavLink key={l.to} to={l.to} end={l.end} style={linkStyle}>{l.label}</NavLink>
          ))}
          <span style={{ color: '#777', fontSize: '0.85rem', marginLeft: '15px' }}>{usuario?.nome}</span>
          <button onClick={handleSair} style={{ background: 'transparent', border: '1px solid #333', color: '#ccc', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer' }}>
            Sair
          </button>
        </div>
      </div>

      {/* Menu mobile (dropdown) */}
      {aberto && (
        <div className="menu-mobile" style={{ padding: '10px 20px 20px', display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid #1a1a1a' }}>
          {links.map(l => (
            <div key={l.to} onClick={handleClickLink}>
              <NavLink to={l.to} end={l.end} style={linkStyle}>{l.label}</NavLink>
            </div>
          ))}
          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#777', fontSize: '0.85rem' }}>{usuario?.nome}</span>
            <button onClick={handleSair} style={{ background: 'transparent', border: '1px solid #333', color: '#ccc', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer' }}>
              Sair
            </button>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 799px) {
          .botao-hamburguer { display: block !important; }
          .menu-desktop { display: none !important; }
        }
        @media (min-width: 800px) {
          .menu-mobile { display: none !important; }
        }
      `}</style>
    </nav>
  );
}
