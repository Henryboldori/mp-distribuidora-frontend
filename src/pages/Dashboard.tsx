import { useEffect, useState } from 'react';
import { getDashboard } from '../api';

interface DashboardData {
  totalProdutos: number;
  totalPedidos: number;
  totalClientes: number;
  valorTotalVendido: number;
  valorEmEstoque: number;
  produtosEstoqueBaixo: { id: number; nome: string; estoque: number }[];
}

export default function Dashboard() {
  const [dados, setDados] = useState<DashboardData | null>(null);

  useEffect(() => {
    getDashboard().then(setDados).catch(() => {});
  }, []);

  if (!dados) return <div style={{ padding: '20px', color: '#777' }}>Carregando dashboard...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ color: '#22c55e' }}>Visão Geral</h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', marginTop: '20px' }}>
        <Card titulo="Vendido (total)" valor={`R$ ${dados.valorTotalVendido.toFixed(2)}`} />
        <Card titulo="Valor em Estoque" valor={`R$ ${dados.valorEmEstoque.toFixed(2)}`} />
        <Card titulo="Pedidos" valor={dados.totalPedidos.toString()} />
        <Card titulo="Clientes" valor={dados.totalClientes.toString()} />
        <Card titulo="Produtos Cadastrados" valor={dados.totalProdutos.toString()} />
      </div>

      {dados.produtosEstoqueBaixo.length > 0 && (
        <div style={{ marginTop: '30px', backgroundColor: '#1a1010', border: '1px solid #f8717140', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ marginTop: 0, color: '#f87171' }}>⚠️ Estoque Baixo</h3>
          {dados.produtosEstoqueBaixo.map(p => (
            <div key={p.id} style={{ padding: '8px 0', borderBottom: '1px solid #2a1a1a', color: '#ccc' }}>
              {p.nome} — restam {p.estoque} unidades
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Card({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div style={{ backgroundColor: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #222' }}>
      <div style={{ color: '#777', fontSize: '0.8rem', marginBottom: '8px' }}>{titulo}</div>
      <div style={{ color: '#fff', fontSize: '1.6rem', fontWeight: 'bold' }}>{valor}</div>
    </div>
  );
}
