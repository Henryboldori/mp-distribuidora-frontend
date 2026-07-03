import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPedidos, atualizarStatusPedido, atualizarPagamentoPedido, excluirPedido } from '../api';
import { useAuth } from '../context/AuthContext';

interface Pedido {
  id: number; valorTotal: number; status: string; formaPagamento: string; statusPagamento: string;
  createdAt: string; cliente: { nome: string }; vendedor: { nome: string };
}

const statusCores: Record<string, string> = { PENDENTE: '#f59e0b', EM_ROTA: '#3b82f6', ENTREGUE: '#22c55e', CANCELADO: '#f87171' };
const formaPagamentoLabel: Record<string, string> = { DINHEIRO: '💵 Dinheiro', PIX: '📱 Pix', CARTAO: '💳 Cartão', FIADO: '📝 Fiado' };

export default function Pedidos() {
  const [lista, setLista] = useState<Pedido[]>([]);
  const [carregando, setCarregando] = useState(true);
  const { usuario } = useAuth();
  const ehAdmin = usuario?.role === 'ADMIN';

  async function carregar() {
    setCarregando(true);
    try { setLista(await getPedidos()); }
    catch (err) { console.error(err); }
    finally { setCarregando(false); }
  }

  useEffect(() => { carregar(); }, []);

  const mudarStatus = async (id: number, status: string) => { await atualizarStatusPedido(id, status); carregar(); };
  const marcarPago = async (id: number) => { await atualizarPagamentoPedido(id, 'PAGO'); carregar(); };
  const handleExcluir = async (id: number) => {
    if (!confirm('Excluir este pedido? O estoque será devolvido.')) return;
    await excluirPedido(id); carregar();
  };
  const handleImprimir = () => window.print();

  return (
    <div style={{ padding: '20px' }} className="pedidos-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ color: '#22c55e', margin: 0 }}>{ehAdmin ? 'Todos os Pedidos' : 'Meus Pedidos'}</h2>
        <button onClick={handleImprimir} className="botao-imprimir" style={{ padding: '10px 16px', backgroundColor: '#22c55e', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
          🖨️ Imprimir
        </button>
      </div>

      {carregando ? <p style={{ color: '#777', marginTop: '20px' }}>Carregando...</p> : lista.length === 0 ? (
        <p style={{ color: '#777', marginTop: '20px' }}>Nenhum pedido por aqui ainda.</p>
      ) : (
        <>
          <div className="tabela-desktop tabela-responsiva">
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #22c55e', textAlign: 'left' }}>
                  <th style={{ padding: '10px' }}>ID</th>
                  <th style={{ padding: '10px' }}>Data</th>
                  <th style={{ padding: '10px' }}>Cliente</th>
                  {ehAdmin && <th style={{ padding: '10px' }}>Vendedor</th>}
                  <th style={{ padding: '10px' }}>Total</th>
                  <th style={{ padding: '10px' }}>Pagamento</th>
                  <th style={{ padding: '10px' }}>Status</th>
                  <th style={{ padding: '10px' }} className="coluna-acoes">Ações</th>
                </tr>
              </thead>
              <tbody>
                {lista.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid #222' }}>
                    <td style={{ padding: '10px' }}>#{p.id}</td>
                    <td style={{ padding: '10px' }}>{new Date(p.createdAt).toLocaleDateString('pt-BR')}</td>
                    <td style={{ padding: '10px' }}>{p.cliente?.nome}</td>
                    {ehAdmin && <td style={{ padding: '10px' }}>{p.vendedor?.nome}</td>}
                    <td style={{ padding: '10px' }}>R$ {(p.valorTotal || 0).toFixed(2)}</td>
                    <td style={{ padding: '10px' }}>
                      {formaPagamentoLabel[p.formaPagamento] || p.formaPagamento}
                      {p.statusPagamento === 'PENDENTE' && (
                        <span onClick={() => marcarPago(p.id)} className="acao-nao-imprimir" style={{ marginLeft: '8px', color: '#f87171', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}>(marcar pago)</span>
                      )}
                    </td>
                    <td style={{ padding: '10px' }}>
                      <span className="status-texto-impressao" style={{ color: statusCores[p.status] }}>{p.status}</span>
                      <select value={p.status} onChange={(e) => mudarStatus(p.id, e.target.value)} className="acao-nao-imprimir" style={{ backgroundColor: '#111', color: statusCores[p.status], border: '1px solid #333', borderRadius: '6px', padding: '6px' }}>
                        <option value="PENDENTE">PENDENTE</option>
                        <option value="EM_ROTA">EM ROTA</option>
                        <option value="ENTREGUE">ENTREGUE</option>
                        <option value="CANCELADO">CANCELADO</option>
                      </select>
                    </td>
                    <td style={{ padding: '10px' }} className="coluna-acoes acao-nao-imprimir">
                      <Link to={`/pedido/${p.id}/editar`} style={{ marginRight: '8px', color: '#3b82f6', textDecoration: 'none' }}>Editar</Link>
                      {ehAdmin && <button onClick={() => handleExcluir(p.id)} style={{ background: 'none', border: '1px solid #f8717150', color: '#f87171', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}>Excluir</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="cards-mobile">
            {lista.map(p => (
              <div key={p.id} className="card-mobile">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold', color: '#fff' }}>#{p.id} — {p.cliente?.nome}</span>
                  <span style={{ color: '#22c55e', fontWeight: 'bold' }}>R$ {(p.valorTotal || 0).toFixed(2)}</span>
                </div>
                {ehAdmin && <div className="card-mobile-linha"><span className="card-mobile-label">Vendedor</span><span className="card-mobile-valor">{p.vendedor?.nome}</span></div>}
                <div className="card-mobile-linha">
                  <span className="card-mobile-label">Pagamento</span>
                  <span className="card-mobile-valor">
                    {formaPagamentoLabel[p.formaPagamento] || p.formaPagamento}
                    {p.statusPagamento === 'PENDENTE' && <span onClick={() => marcarPago(p.id)} style={{ marginLeft: '8px', color: '#f87171', textDecoration: 'underline' }}>(pagar)</span>}
                  </span>
                </div>
                <div style={{ marginTop: '10px' }}>
                  <select value={p.status} onChange={(e) => mudarStatus(p.id, e.target.value)} style={{ width: '100%', backgroundColor: '#111', color: statusCores[p.status], border: '1px solid #333', borderRadius: '6px', padding: '10px' }}>
                    <option value="PENDENTE">PENDENTE</option>
                    <option value="EM_ROTA">EM ROTA</option>
                    <option value="ENTREGUE">ENTREGUE</option>
                    <option value="CANCELADO">CANCELADO</option>
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <Link to={`/pedido/${p.id}/editar`} style={{ flex: 1, textAlign: 'center', padding: '10px', background: 'none', border: '1px solid #3b82f650', color: '#3b82f6', borderRadius: '6px', textDecoration: 'none' }}>Editar</Link>
                  {ehAdmin && <button onClick={() => handleExcluir(p.id)} style={{ flex: 1, background: 'none', border: '1px solid #f8717150', color: '#f87171', borderRadius: '6px', padding: '10px', cursor: 'pointer' }}>Excluir</button>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <style>{`
        .status-texto-impressao { display: none; }
        @media print {
          body { background-color: #fff !important; color: #000 !important; }
          .pedidos-container { padding: 0 !important; }
          .botao-imprimir, .acao-nao-imprimir, .coluna-acoes { display: none !important; }
          .status-texto-impressao { display: inline !important; font-weight: bold; }
          .cards-mobile { display: none !important; }
          .tabela-desktop { display: table !important; }
          table, td, th { background-color: #fff !important; color: #000 !important; border-color: #ccc !important; }
        }
      `}</style>
    </div>
  );
}