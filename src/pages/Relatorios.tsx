import { useState, useEffect } from 'react';
import { getRelatorio } from '../api';

function hojeISO() { return new Date().toISOString().slice(0, 10); }
function diasAtrasISO(dias: number) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString().slice(0, 10);
}

export default function Relatorios() {
  const [inicio, setInicio] = useState(diasAtrasISO(7));
  const [fim, setFim] = useState(hojeISO());
  const [dados, setDados] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);

  const carregar = async () => {
    setCarregando(true);
    try { setDados(await getRelatorio(inicio, fim)); }
    catch (err) { console.error(err); }
    finally { setCarregando(false); }
  };

  useEffect(() => { carregar(); }, []);

  const aplicarAtalho = (dias: number) => {
    setInicio(dias === 0 ? hojeISO() : diasAtrasISO(dias));
    setFim(hojeISO());
  };

  useEffect(() => { carregar(); }, [inicio, fim]);

  const maiorValorDia = dados?.vendasPorDia?.length ? Math.max(...dados.vendasPorDia.map((d: any) => d.total)) : 0;

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ color: '#22c55e', marginTop: 0 }}>📊 Relatório de Vendas</h2>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '15px', alignItems: 'center' }}>
        <button onClick={() => aplicarAtalho(0)} style={btnAtalho}>Hoje</button>
        <button onClick={() => aplicarAtalho(7)} style={btnAtalho}>7 dias</button>
        <button onClick={() => aplicarAtalho(30)} style={btnAtalho}>30 dias</button>
        <input type="date" value={inicio} onChange={e => setInicio(e.target.value)} style={inputData} />
        <span style={{ color: '#666' }}>até</span>
        <input type="date" value={fim} onChange={e => setFim(e.target.value)} style={inputData} />
      </div>

      {carregando ? <p style={{ color: '#777' }}>Carregando...</p> : dados && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '15px', marginBottom: '25px' }}>
            <Card titulo="Total Vendido" valor={`R$ ${dados.totalVendido.toFixed(2)}`} destaque />
            <Card titulo="Pedidos" valor={dados.totalPedidos.toString()} />
            <Card titulo="Ticket Médio" valor={`R$ ${dados.ticketMedio.toFixed(2)}`} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', marginBottom: '25px' }}>
            {dados.produtoMaisVendido && (
              <div style={cardStyle}>
                <div style={{ color: '#777', fontSize: '0.8rem', marginBottom: '8px' }}>🏆 PRODUTO MAIS VENDIDO</div>
                <div style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 'bold' }}>{dados.produtoMaisVendido.nome}</div>
                <div style={{ color: '#4ade80' }}>{dados.produtoMaisVendido.quantidade} unidades</div>
              </div>
            )}
            {dados.clienteQueMaisCompra && (
              <div style={cardStyle}>
                <div style={{ color: '#777', fontSize: '0.8rem', marginBottom: '8px' }}>👑 CLIENTE QUE MAIS COMPROU</div>
                <div style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 'bold' }}>{dados.clienteQueMaisCompra.nome}</div>
                <div style={{ color: '#4ade80' }}>R$ {dados.clienteQueMaisCompra.total.toFixed(2)}</div>
              </div>
            )}
          </div>

          {dados.vendasPorDia.length > 0 && (
            <div style={{ ...cardStyle, marginBottom: '25px' }}>
              <h3 style={{ marginTop: 0, fontSize: '1rem' }}>Vendas por dia</h3>
              {dados.vendasPorDia.map((d: any) => (
                <div key={d.dia} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                  <span style={{ width: '90px', fontSize: '0.8rem', color: '#999' }}>{new Date(d.dia + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                  <div style={{ flex: 1, backgroundColor: '#1a1a1a', borderRadius: '4px', overflow: 'hidden', height: '20px' }}>
                    <div style={{ width: `${maiorValorDia ? (d.total / maiorValorDia) * 100 : 0}%`, backgroundColor: '#22c55e', height: '100%' }} />
                  </div>
                  <span style={{ width: '90px', textAlign: 'right', fontSize: '0.85rem', color: '#ccc' }}>R$ {d.total.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          <div style={cardStyle}>
            <h3 style={{ marginTop: 0, fontSize: '1rem' }}>Ranking de Produtos</h3>
            {dados.rankingProdutos.map((p: any, i: number) => (
              <div key={p.nome} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1a1a1a', color: '#ccc', fontSize: '0.9rem' }}>
                <span>{i + 1}º {p.nome}</span>
                <strong style={{ color: '#4ade80' }}>{p.quantidade} un.</strong>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Card({ titulo, valor, destaque }: { titulo: string; valor: string; destaque?: boolean }) {
  return (
    <div style={{ backgroundColor: destaque ? '#0f2417' : '#111', padding: '18px', borderRadius: '12px', border: `1px solid ${destaque ? '#22c55e50' : '#222'}` }}>
      <div style={{ color: '#888', fontSize: '0.75rem', marginBottom: '6px' }}>{titulo}</div>
      <div style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 'bold' }}>{valor}</div>
    </div>
  );
}

const cardStyle = { backgroundColor: '#111', padding: '20px', borderRadius: '12px', border: '1px solid #222' };
const btnAtalho = { padding: '8px 14px', backgroundColor: '#1a1a1a', color: '#ccc', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' };
const inputData = { padding: '8px', backgroundColor: '#111', border: '1px solid #333', color: '#fff', borderRadius: '8px' };