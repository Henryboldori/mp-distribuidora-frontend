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

  // Junta catalogo + avulsos numa lista unica, so pra impressao simples
  const todosItens = dados ? [...dados.itensCatalogo, ...dados.itensAvulsos].sort((a, b) => b.quantidade - a.quantidade) : [];
  const dataFormatada = new Date(data + 'T12:00:00').toLocaleDateString('pt-BR');

  return (
    <div style={{ padding: '20px' }}>
      <header className="tela-nao-imprimir" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h2 style={{ margin: 0, color: '#22c55e' }}>📋 Romaneio de Carga</h2>
          <p style={{ color: '#777', margin: '5px 0 0 0', fontSize: '0.85rem' }}>Soma de todos os pedidos pendentes/em rota do dia</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input type="date" value={data} onChange={(e) => setData(e.target.value)} style={{ padding: '10px', backgroundColor: '#111', border: '1px solid #333', color: '#fff', borderRadius: '8px' }} />
          <button onClick={handleImprimir} style={{ padding: '10px 16px', backgroundColor: '#22c55e', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>🖨️ Imprimir</button>
        </div>
      </header>

      {carregando ? <p className="tela-nao-imprimir" style={{ color: '#777' }}>Carregando...</p> : dados && (
        <>
          {/* ---------- TELA (detalhado) ---------- */}
          <div className="tela-nao-imprimir">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '15px', marginBottom: '25px' }}>
              <div style={{ backgroundColor: '#111', padding: '18px', borderRadius: '12px', border: '1px solid #222' }}>
                <div style={{ color: '#777', fontSize: '0.75rem' }}>PEDIDOS NA ROTA</div>
                <div style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 'bold' }}>{dados.totalPedidos}</div>
              </div>
              <div style={{ backgroundColor: '#111', padding: '18px', borderRadius: '12px', border: '1px solid #222' }}>
                <div style={{ color: '#777', fontSize: '0.75rem' }}>ITENS DIFERENTES</div>
                <div style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 'bold' }}>{todosItens.length}</div>
              </div>
            </div>

            {todosItens.length === 0 ? (
              <p style={{ color: '#666' }}>Nenhum item pendente para essa data.</p>
            ) : (
              <section style={{ backgroundColor: '#0a0a0a', borderRadius: '15px', border: '1px solid #222', overflow: 'hidden', marginBottom: '20px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Produto</th>
                      <th style={thStyle}>Unidade</th>
                      <th style={{ ...thStyle, textAlign: 'right' }}>Qtd Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todosItens.map((item: any, idx: number) => (
                      <tr key={idx} style={{ borderBottom: '1px solid #111' }}>
                        <td style={{ ...tdStyle, fontWeight: 'bold', color: '#fff' }}>{item.nome} {!item.produtoId && <span style={{ color: '#f59e0b', fontSize: '0.75rem' }}>(avulso)</span>}</td>
                        <td style={tdStyle}>{item.unidade}</td>
                        <td style={{ ...tdStyle, textAlign: 'right', color: '#4ade80', fontSize: '1.1rem', fontWeight: 'bold' }}>{item.quantidade}</td>
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
          </div>

          {/* ---------- IMPRESSÃO (estilo relatório de impressora matricial) ---------- */}
          <div className="somente-impressao">
            <div className="rel-cabecalho">
              <span>BEBIDAS PELICANO</span>
              <span>ROMANEIO DE CARGA</span>
              <span>DATA: {dataFormatada}</span>
            </div>
            <div className="rel-linha-dupla" />

            <div className="rel-linha rel-titulo">
              <span className="rel-col-produto">PRODUTO</span>
              <span className="rel-col-unid">UNID.</span>
              <span className="rel-col-qtd">QTD</span>
            </div>
            <div className="rel-linha-tracejada" />

            {todosItens.map((item: any, idx: number) => (
              <div className="rel-linha" key={idx}>
                <span className="rel-col-produto">
                  {item.nome}{!item.produtoId ? ' (avulso)' : ''}
                </span>
                <span className="rel-col-unid">{item.unidade}</span>
                <span className="rel-col-qtd">{item.quantidade}</span>
              </div>
            ))}

            <div className="rel-linha-tracejada" />
            <div className="rel-rodape">
              <span>TOTAL DE PEDIDOS: {dados.totalPedidos}</span>
              <span>ITENS DIFERENTES: {todosItens.length}</span>
            </div>
          </div>
        </>
      )}

      <style>{`
        .somente-impressao { display: none; }
        @media print {
          @page { size: auto; margin: 10mm; }
          .tela-nao-imprimir { display: none !important; }
          .somente-impressao {
            display: block !important;
            font-family: 'Courier New', Courier, monospace;
            color: #000;
          }
          body { background: #fff !important; color: #000 !important; }

          .rel-cabecalho {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            font-size: 0.95rem;
            margin-bottom: 6px;
          }
          .rel-linha-dupla { border-top: 2px solid #000; margin: 4px 0 8px 0; }
          .rel-linha-tracejada { border-top: 1px dashed #000; margin: 6px 0; }

          .rel-linha {
            display: flex;
            justify-content: space-between;
            font-size: 0.85rem;
            padding: 2px 0;
          }
          .rel-titulo { font-weight: bold; }

          .rel-col-produto { flex: 3; text-align: left; padding-right: 8px; }
          .rel-col-unid { flex: 1; text-align: center; }
          .rel-col-qtd { flex: 1; text-align: right; }

          .rel-rodape {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            font-size: 0.85rem;
            margin-top: 8px;
          }
        }
      `}</style>
    </div>
  );
}

const thStyle = { textAlign: 'left' as const, padding: '12px 20px', color: '#777', fontSize: '0.8rem', borderBottom: '2px solid #222' };
const tdStyle = { padding: '12px 20px', color: '#ccc' };