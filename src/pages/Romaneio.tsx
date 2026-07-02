import { useState, useEffect } from 'react';
import { getRomaneio } from '../api';

export default function Romaneio() {
  const [data, setData] = useState(new Date().toISOString().slice(0, 10));
  const [dados, setDados] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);

  const carregar = async (d: string) => {
    setCarregando(true);
    try { setDados(await getRomaneio(d)); }
    catch (err) { console.error(err); }
    finally { setCarregando(false); }
  };

  useEffect(() => { carregar(data); }, [data]);

  const handleImprimir = () => window.print();

  return (
    <div style={{ padding: '20px' }} className="romaneio-container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#22c55e' }}>📋 Romaneio de Carga</h2>
          <p style={{ color: '#777', margin: '5px 0 0 0', fontSize: '0.85rem' }}>Soma de todos os pedidos pendentes/em rota do dia</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} style={{ padding: '10px', backgroundColor: '#111', border: '1px solid #333', color: '#fff', borderRadius: '8px' }} />
          <button onClick={handleImprimir} style={{ padding: '10px 16px', backgroundColor: '#22c55e', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>🖨️ Imprimir</button>
        </div>
      </header>

      {carregando ? <p style={{ color: '#777' }}>Carregando...</p> : dados && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px', marginBottom: '25px' }}>
            <div style={{ backgroundColor: '#111', padding: '18px', borderRadius: '12px', border: '1px solid #222' }}>
              <div style={{ color: '#777', fontSize: '0.75rem' }}>PEDIDOS NA ROTA</div>
              <div style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 'bold' }}>{dados.totalPedidos}</div>
            </div>
            <div style={{ backgroundColor: '#111', padding: '18px', borderRadius: '12px', border: '1px solid #222' }}>
              <div style={{ color: '#777', fontSize: '0.75rem' }}>ITENS DO CATÁLOGO</div>
              <div style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 'bold' }}>{dados.itensCatalogo.length}</div>
            </div>
            <div style={{ backgroundColor: '#111', padding: '18px', borderRadius: '12px', border: '1px solid #222' }}>
              <div style={{ color: '#777', fontSize: '0.75rem' }}>ITENS AVULSOS</div>
              <div style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 'bold' }}>{dados.itensAvulsos.length}</div>
            </div>
          </div>

          <section style={{ backgroundColor: '#0a0a0a', borderRadius: '15px', border: '1px solid #222', overflow: 'hidden', marginBottom: '20px' }}>
            <h3 style={{ padding: '20px 20px 0', margin: 0, fontSize: '1rem' }}>Produtos do Catálogo</h3>
            {dados.itensCatalogo.length === 0 ? (
              <p style={{ padding: '20px', color: '#666' }}>Nenhum item de catálogo pendente para essa data.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Produto</th>
                    <th style={thStyle}>Categoria</th>
                    <th style={thStyle}>Unidade</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Qtd Total</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.itensCatalogo.map((item: any) => (
                    <tr key={item.produtoId} style={{ borderBottom: '1px solid #111' }}>
                      <td style={{ ...tdStyle, fontWeight: 'bold', color: '#fff' }}>{item.nome}</td>
                      <td style={tdStyle}>{item.categoria}</td>
                      <td style={tdStyle}>{item.unidade}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: '#4ade80', fontSize: '1.1rem', fontWeight: 'bold' }}>{item.quantidade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {dados.itensAvulsos.length > 0 && (
            <section style={{ backgroundColor: '#0a0a0a', borderRadius: '15px', border: '1px solid #222', overflow: 'hidden', marginBottom: '20px' }}>
              <h3 style={{ padding: '20px 20px 0', margin: 0, fontSize: '1rem', color: '#f59e0b' }}>Itens Avulsos (fora do catálogo)</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '15px' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Item</th>
                    <th style={thStyle}>Unidade</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Qtd Total</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.itensAvulsos.map((item: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #111' }}>
                      <td style={{ ...tdStyle, fontWeight: 'bold', color: '#fff' }}>{item.nome}</td>
                      <td style={tdStyle}>{item.unidade}</td>
                      <td style={{ ...tdStyle, textAlign: 'right', color: '#f59e0b', fontSize: '1.1rem', fontWeight: 'bold' }}>{item.quantidade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          )}

          <section style={{ backgroundColor: '#0a0a0a', borderRadius: '15px', border: '1px solid #222', padding: '20px' }}>
            <h3 style={{ marginTop: 0, fontSize: '1rem' }}>Pedidos incluídos</h3>
            {dados.pedidos.map((p: any) => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #151515', fontSize: '0.9rem', color: '#ccc' }}>
                <span>#{p.id} — {p.cliente} {p.vendedor && `(${p.vendedor})`}</span>
                <span>{p.qtdItens} itens — R$ {p.valorTotal.toFixed(2)}</span>
              </div>
            ))}
          </section>
        </>
      )}

      <style>{`
        @media print {
          body { background-color: #fff !important; color: #000 !important; }
          .romaneio-container { padding: 0 !important; }
          header button, header input { display: none !important; }
          section, div { background-color: #fff !important; border-color: #ddd !important; color: #000 !important; }
          th { color: #444 !important; }
        }
      `}</style>
    </div>
  );
}

const thStyle = { textAlign: 'left' as const, padding: '12px 20px', color: '#777', fontSize: '0.8rem', borderBottom: '2px solid #222' };
const tdStyle = { padding: '12px 20px', color: '#ccc' };