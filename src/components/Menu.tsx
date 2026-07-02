import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { buscarGeral } from '../api';

const linkStyle = ({ isActive }: { isActive: boolean }) => ({
  padding: '10px 16px', borderRadius: '8px', textDecoration: 'none',
  color: isActive ? '#000' : '#ccc', backgroundColor: isActive ? '#22c55e' : 'transparent',
  fontWeight: isActive ? 'bold' as const : 'normal' as const, fontSize: '0.95rem', display: 'block'
});

export default function Menu() {
  const { usuario, deslogar } = useAuth();
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState<any>(null);
  const navigate = useNavigate();

  const links = usuario?.role === 'ADMIN'
    ? [
        { to: '/', label: 'Início', end: true },
        { to: '/pedidos', label: 'Pedidos' },
        { to: '/romaneio', label: 'Romaneio' },
        { to: '/clientes', label: 'Clientes' },
        { to: '/produtos', label: 'Estoque' },
        { to: '/relatorios', label: 'Relatórios' },
        { to: '/contas-a-receber', label: 'A Receber' },
        { to: '/fornecedores', label: 'Fornecedores' },
        { to: '/usuarios', label: 'Equipe' }
      ]
    : [
        { to: '/', label: 'Início', end: true },
        { to: '/novo-pedido', label: 'Fazer Pedido' },
        { to: '/pedidos', label: 'Meus Pedidos' },
        { to: '/romaneio', label: 'Romaneio' },
        { to: '/clientes', label: 'Clientes' },
        { to: '/rotas', label: 'Rotas' }
      ];

  const handleClickLink = () => setAberto(false);
  const handleSair = () => { deslogar(); navigate('/login'); };

  const handleBusca = async (texto: string) => {
    setBusca(texto);
    if (texto.length < 2) { setResultados(null); return; }
    try { setResultados(await buscarGeral(texto)); } catch { setResultados(null); }
  };

  const fecharBusca = () => { setBusca(''); setResultados(null); };

  return (
    <nav style={{ backgroundColor: '#0a0a0a', borderBottom: '1px solid #222', position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 20px', gap: '15px' }}>
        <strong style={{ color: '#22c55e', fontSize: '1.05rem', whiteSpace: 'nowrap' }}>🐦 Bebidas Pelicano</strong>

        {/* Busca geral - visivel em todas as telas */}
        <div style={{ position: 'relative', flex: '0 1 260px' }}>
          <input
            placeholder="🔎 Buscar cliente, produto, pedido..."
            value={busca}
            onChange={(e) => handleBusca(e.target.value)}
            style={{ width: '100%', padding: '9px 12px', backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', color: '#fff', fontSize: '0.85rem', boxSizing: 'border-box' }}
          />
          {resultados && (
            <div style={{ position: 'absolute', top: '105%', left: 0, right: 0, backgroundColor: '#161616', border: '1px solid #333', borderRadius: '10px', maxHeight: '350px', overflowY: 'auto', zIndex: 50 }}>
              {resultados.clientes?.length > 0 && (
                <div>
                  <div style={{ padding: '8px 12px', color: '#666', fontSize: '0.7rem' }}>CLIENTES</div>
                  {resultados.clientes.map((c: any) => (
                    <div key={c.id} onClick={() => { navigate('/clientes'); fecharBusca(); }} style={{ padding: '10px 12px', color: '#ccc', cursor: 'pointer', borderTop: '1px solid #222' }}>{c.nome}</div>
                  ))}
                </div>
              )}
              {resultados.produtos?.length > 0 && (
                <div>
                  <div style={{ padding: '8px 12px', color: '#666', fontSize: '0.7rem' }}>PRODUTOS</div>
                  {resultados.produtos.map((p: any) => (
                    <div key={p.id} onClick={() => { navigate('/produtos'); fecharBusca(); }} style={{ padding: '10px 12px', color: '#ccc', cursor: 'pointer', borderTop: '1px solid #222' }}>{p.nome} — R$ {p.preco.toFixed(2)}</div>
                  ))}
                </div>
              )}
              {resultados.pedidos?.length > 0 && (
                <div>
                  <div style={{ padding: '8px 12px', color: '#666', fontSize: '0.7rem' }}>PEDIDOS</div>
                  {resultados.pedidos.map((p: any) => (
                    <div key={p.id} onClick={() => { navigate('/pedidos'); fecharBusca(); }} style={{ padding: '10px 12px', color: '#ccc', cursor: 'pointer', borderTop: '1px solid #222' }}>#{p.id} — {p.cliente?.nome}</div>
                  ))}
                </div>
              )}
              {!resultados.clientes?.length && !resultados.produtos?.length && !resultados.pedidos?.length && (
                <div style={{ padding: '15px', color: '#666', textAlign: 'center', fontSize: '0.85rem' }}>Nada encontrado.</div>
              )}
            </div>
          )}
        </div>

        <button onClick={() => setAberto(!aberto)} className="botao-hamburguer"
          style={{ background: 'none', border: '1px solid #333', borderRadius: '8px', color: '#fff', padding: '8px 12px', cursor: 'pointer', fontSize: '1.1rem', display: 'none' }}>
          {aberto ? '✕' : '☰'}
        </button>

        <div className="menu-desktop" style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
          {links.map(l => <NavLink key={l.to} to={l.to} end={l.end} style={linkStyle}>{l.label}</NavLink>)}
          <span style={{ color: '#777', fontSize: '0.85rem', marginLeft: '10px', whiteSpace: 'nowrap' }}>{usuario?.nome}</span>
          <button onClick={handleSair} style={{ background: 'transparent', border: '1px solid #333', color: '#ccc', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer' }}>Sair</button>
        </div>
      </div>

      {aberto && (
        <div className="menu-mobile" style={{ padding: '10px 20px 20px', display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid #1a1a1a' }}>
          {links.map(l => (
            <div key={l.to} onClick={handleClickLink}><NavLink to={l.to} end={l.end} style={linkStyle}>{l.label}</NavLink></div>
          ))}
          <div style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#777', fontSize: '0.85rem' }}>{usuario?.nome}</span>
            <button onClick={handleSair} style={{ background: 'transparent', border: '1px solid #333', color: '#ccc', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer' }}>Sair</button>
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