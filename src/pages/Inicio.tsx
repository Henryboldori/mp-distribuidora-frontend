import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard } from '../api';
import { useAuth } from '../context/AuthContext';

interface DashboardData {
  totalProdutos: number;
  totalPedidos: number;
  totalClientes: number;
  valorTotalVendido: number;
  valorVendidoHoje: number;
  pedidosHoje: number;
  valorPendenteRecebimento: number;
  valorEmEstoque?: number;
  produtosEstoqueBaixo?: { id: number; nome: string; estoque: number }[];
  vendasPorVendedor?: { nome: string; total: number }[];
}

// Tela "Início": a MESMA para admin e vendedor.
// O admin ve numeros globais + estoque + ranking. O vendedor ve so os proprios numeros.
export default function Inicio() {
  const { usuario } = useAuth();
  const [dados, setDados] = useState<DashboardData | null>(null);
  const [erro, setErro] = useState('');
  const ehAdmin = usuario?.role === 'ADMIN';

  // Formata numeros com seguranca: nunca quebra se o valor vier undefined/null
  const fmt = (valor: number | undefined | null) => `R$ ${(valor || 0).toFixed(2)}`;

  useEffect(() => {
    getDashboard().then(setDados).catch((err) => setErro(err.message || 'Erro ao carregar o painel.'));
  }, []);

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ color: '#22c55e', marginTop: 0 }}>Olá, {usuario?.nome}! 👋</h2>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '25px' }}>
        <Link to="/novo-pedido" style={btnAcao}>➕ Novo Pedido</Link>
        <Link to="/clientes" style={btnAcaoSecundario}>👤 Clientes</Link>
        {ehAdmin && <Link to="/produtos" style={btnAcaoSecundario}>📦 Estoque</Link>}
      </div>

      {erro && <div style={{ color: '#f87171', marginBottom: '15px' }}>{erro}</div>}

      {!dados ? (
        <p style={{ color: '#777' }}>Carregando...</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '15px' }}>
            <Card titulo="Vendido Hoje" valor={fmt(dados.valorVendidoHoje)} destaque />
            <Card titulo="Pedidos Hoje" valor={(dados.pedidosHoje ?? 0).toString()} />
            <Card titulo={ehAdmin ? 'Vendido (total)' : 'Meu Total Vendido'} valor={fmt(dados.valorTotalVendido)} />
            <Card titulo="A Receber (Fiado)" valor={fmt(dados.valorPendenteRecebimento)} alerta={(dados.valorPendenteRecebimento || 0) > 0} />
            {ehAdmin && <Card titulo="Valor em Estoque" valor={fmt(dados.valorEmEstoque)} />}
            <Card titulo="Clientes" valor={(dados.totalClientes ?? 0).toString()} />
          </div>

          {ehAdmin && dados.produtosEstoqueBaixo && dados.produtosEstoqueBaixo.length > 0 && (
            <div style={{ marginTop: '25px', backgroundColor: '#1a1010', border: '1px solid #f8717140', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ marginTop: 0, color: '#f87171', fontSize: '1rem' }}>⚠️ Estoque Baixo</h3>
              {dados.produtosEstoqueBaixo.map(p => (
                <div key={p.id} style={{ padding: '8px 0', borderBottom: '1px solid #2a1a1a', color: '#ccc', fontSize: '0.9rem' }}>
                  {p.nome} — restam {p.estoque} unidades
                </div>
              ))}
            </div>
          )}

          {ehAdmin && dados.vendasPorVendedor && dados.vendasPorVendedor.length > 0 && (
            <div style={{ marginTop: '25px', backgroundColor: '#111', border: '1px solid #222', borderRadius: '12px', padding: '20px' }}>
              <h3 style={{ marginTop: 0, fontSize: '1rem' }}>🏆 Vendas por Vendedor</h3>
              {dados.vendasPorVendedor.map((v, i) => (
                <div key={v.nome} style={{ padding: '8px 0', borderBottom: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', color: '#ccc', fontSize: '0.9rem' }}>
                  <span>{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`} {v.nome}</span>
                  <strong style={{ color: '#4ade80' }}>{fmt(v.total)}</strong>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Card({ titulo, valor, destaque, alerta }: { titulo: string; valor: string; destaque?: boolean; alerta?: boolean }) {
  return (
    <div style={{
      backgroundColor: destaque ? '#0f2417' : '#111',
      padding: '18px',
      borderRadius: '12px',
      border: `1px solid ${alerta ? '#f8717150' : destaque ? '#22c55e50' : '#222'}`
    }}>
      <div style={{ color: '#888', fontSize: '0.75rem', marginBottom: '6px' }}>{titulo}</div>
      <div style={{ color: alerta ? '#f87171' : '#fff', fontSize: '1.4rem', fontWeight: 'bold' }}>{valor}</div>
    </div>
  );
}

const btnAcao = {
  padding: '14px 20px', backgroundColor: '#22c55e', color: '#000', borderRadius: '10px',
  fontWeight: 'bold' as const, textDecoration: 'none', fontSize: '0.95rem'
};
const btnAcaoSecundario = {
  padding: '14px 20px', backgroundColor: '#161616', color: '#ccc', borderRadius: '10px',
  border: '1px solid #333', fontWeight: 'bold' as const, textDecoration: 'none', fontSize: '0.95rem'
};
