import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPedidos, atualizarStatusPedido, atualizarPagamentoPedido, excluirPedido } from '../api';
import { useAuth } from '../context/AuthContext';

interface Pedido {
  id: number; valorTotal: number; status: string; formaPagamento: string; statusPagamento: string;
  createdAt: string; cliente: { nome: string; telefone?: string | null }; vendedor: { nome: string };
  itens: { quantidade: number; precoUnit: number; produto?: { nome: string }; nomeAvulso?: string }[];
}

const statusCores: Record<string, string> = { PENDENTE: '#f59e0b', EM_ROTA: '#3b82f6', ENTREGUE: '#22c55e', CANCELADO: '#f87171' };
const formaPagamentoLabel: Record<string, string> = { DINHEIRO: '💵 Dinheiro', PIX: '📱 Pix', CARTAO: '💳 Cartão', FIADO: '📝 Fiado' };

// Numero fixo que recebe cada pedido registrado (loja)
const WHATSAPP_NUMERO_LOJA = '5535998509060';

export default function Pedidos() {
  const [lista, setLista] = useState<Pedido[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [dataFiltro, setDataFiltro] = useState(''); // '' = todos os dias
  const [pedidoImprimindo, setPedidoImprimindo] = useState<Pedido | null>(null);
  const { usuario } = useAuth();
  const ehAdmin = usuario?.role === 'ADMIN';

  async function carregar(data?: string) {
    setCarregando(true);
    try { setLista(await getPedidos(data ? { data } : undefined)); }
    catch (err) { console.error(err); }
    finally { setCarregando(false); }
  }

  useEffect(() => { carregar(dataFiltro || undefined); }, [dataFiltro]);

  const mudarStatus = async (id: number, status: string) => { await atualizarStatusPedido(id, status); carregar(dataFiltro || undefined); };
  const marcarPago = async (id: number) => { await atualizarPagamentoPedido(id, 'PAGO'); carregar(dataFiltro || undefined); };
  const handleExcluir = async (id: number) => {
    if (!confirm('Excluir este pedido? O estoque será devolvido.')) return;
    await excluirPedido(id); carregar(dataFiltro || undefined);
  };
  const handleImprimirTudo = () => window.print();

  const nomeItem = (i: { produto?: { nome: string }; nomeAvulso?: string }) => i.produto ? i.produto.nome : (i.nomeAvulso || 'Item');
  const listaItens = (p: Pedido) => p.itens.map(i => `${i.quantidade}x ${nomeItem(i)}`).join(', ');

  // Imprime SOMENTE um pedido, em formato de recibo estreito (80 colunas / matricial)
  const imprimirRecibo = (p: Pedido) => {
    setPedidoImprimindo(p);
    setTimeout(() => {
      window.print();
      setPedidoImprimindo(null);
    }, 100);
  };

  const enviarPedidoWhatsapp = (p: Pedido) => {
    const linhas = p.itens.map(i => `${i.quantidade}x ${nomeItem(i)} - R$ ${(i.precoUnit * i.quantidade).toFixed(2)}`).join('\n');
    const texto = `*NOVO PEDIDO #${p.id}*\nCliente: ${p.cliente?.nome}\nVendedor: ${p.vendedor?.nome || '-'}\nData: ${new Date(p.createdAt).toLocaleDateString('pt-BR')}\n\n${linhas}\n\n*Total: R$ ${(p.valorTotal || 0).toFixed(2)}*\nPagamento: ${formaPagamentoLabel[p.formaPagamento] || p.formaPagamento}`;
    window.open(`https://wa.me/${WHATSAPP_NUMERO_LOJA}?text=${encodeURIComponent(texto)}`, '_blank');
  };

  return (
    <div style={{ padding: '20px' }}>
      <div className="tela-nao-imprimir" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
        <h2 style={{ color: '#22c55e', margin: 0 }}>{ehAdmin ? 'Todos os Pedidos' : 'Meus Pedidos'}</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            type="date"
            value={dataFiltro}
            onChange={e => setDataFiltro(e.target.value)}
            style={{ padding: '10px', backgroundColor: '#111', border: '1px solid #333', color: '#fff', borderRadius: '8px' }}
          />
          {dataFiltro && (
            <button onClick={() => setDataFiltro('')} style={{ padding: '10px 14px', backgroundColor: 'transparent', color: '#ccc', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer' }}>
              Limpar
            </button>
          )}
          <button onClick={handleImprimirTudo} style={{ padding: '10px 16px', backgroundColor: '#22c55e', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            🖨️ Imprimir lista
          </button>
        </div>
      </div>

      {carregando ? <p className="tela-nao-imprimir" style={{ color: '#777', marginTop: '20px' }}>Carregando...</p> : lista.length === 0 ? (
        <p className="tela-nao-imprimir" style={{ color: '#777', marginTop: '20px' }}>Nenhum pedido por aqui ainda.</p>
      ) : (
        <>
          {/* ---------- VERSÃO DE TELA ---------- */}
          <div className="tela-nao-imprimir">
            <div className="tabela-desktop tabela-responsiva">
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #22c55e', textAlign: 'left' }}>
                    <th style={{ padding: '10px' }}>ID</th>
                    <th style={{ padding: '10px' }}>Data</th>
                    <th style={{ padding: '10px' }}>Cliente</th>
                    {ehAdmin && <th style={{ padding: '10px' }}>Vendedor</th>}
                    <th style={{ padding: '10px' }}>Itens</th>
                    <th style={{ padding: '10px' }}>Total</th>
                    <th style={{ padding: '10px' }}>Pagamento</th>
                    <th style={{ padding: '10px' }}>Status</th>
                    <th style={{ padding: '10px' }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map(p => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #222' }}>
                      <td style={{ padding: '10px' }}>#{p.id}</td>
                      <td style={{ padding: '10px', color: '#999', fontSize: '0.85rem' }}>{new Date(p.createdAt).toLocaleDateString('pt-BR')}</td>
                      <td style={{ padding: '10px' }}>{p.cliente?.nome}</td>
                      {ehAdmin && <td style={{ padding: '10px' }}>{p.vendedor?.nome}</td>}
                      <td style={{ padding: '10px', color: '#ccc', fontSize: '0.85rem', maxWidth: '280px' }}>{listaItens(p)}</td>
                      <td style={{ padding: '10px' }}>R$ {(p.valorTotal || 0).toFixed(2)}</td>
                      <td style={{ padding: '10px' }}>
                        {formaPagamentoLabel[p.formaPagamento] || p.formaPagamento}
                        {p.statusPagamento === 'PENDENTE' && (
                          <span onClick={() => marcarPago(p.id)} style={{ marginLeft: '8px', color: '#f87171', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}>(marcar pago)</span>
                        )}
                      </td>
                      <td style={{ padding: '10px' }}>
                        <select value={p.status} onChange={(e) => mudarStatus(p.id, e.target.value)} style={{ backgroundColor: '#111', color: statusCores[p.status], border: '1px solid #333', borderRadius: '6px', padding: '6px' }}>
                          <option value="PENDENTE">PENDENTE</option>
                          <option value="EM_ROTA">EM ROTA</option>
                          <option value="ENTREGUE">ENTREGUE</option>
                          <option value="CANCELADO">CANCELADO</option>
                        </select>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          <Link to={`/pedido/${p.id}/editar`} style={{ color: '#3b82f6', textDecoration: 'none' }}>Editar</Link>
                          <button onClick={() => imprimirRecibo(p)} style={{ background: 'none', border: '1px solid #33333350', color: '#ccc', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.8rem' }}>🖨️ Recibo</button>
                          <button onClick={() => enviarPedidoWhatsapp(p)} style={{ background: 'none', border: '1px solid #25D36650', color: '#25D366', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.8rem' }}>📲 WhatsApp</button>
                          {ehAdmin && <button onClick={() => handleExcluir(p.id)} style={{ background: 'none', border: '1px solid #f8717150', color: '#f87171', borderRadius: '6px', padding: '4px 10px', cursor: 'pointer' }}>Excluir</button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="cards-mobile">
              {lista.map(p => (
                <div key={p.id} className="card-mobile">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 'bold', color: '#fff' }}>#{p.id} — {p.cliente?.nome}</span>
                    <span style={{ color: '#22c55e', fontWeight: 'bold' }}>R$ {(p.valorTotal || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ color: '#777', fontSize: '0.8rem', marginBottom: '8px' }}>{new Date(p.createdAt).toLocaleDateString('pt-BR')}</div>

                  <div style={{ color: '#ccc', fontSize: '0.85rem', marginBottom: '8px', paddingBottom: '8px', borderBottom: '1px solid #1f1f1f' }}>
                    {listaItens(p)}
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
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                    <Link to={`/pedido/${p.id}/editar`} style={{ flex: 1, minWidth: '80px', textAlign: 'center', padding: '10px', background: 'none', border: '1px solid #3b82f650', color: '#3b82f6', borderRadius: '6px', textDecoration: 'none' }}>Editar</Link>
                    <button onClick={() => imprimirRecibo(p)} style={{ flex: 1, minWidth: '80px', background: 'none', border: '1px solid #33333350', color: '#ccc', borderRadius: '6px', padding: '10px', cursor: 'pointer' }}>🖨️ Recibo</button>
                    <button onClick={() => enviarPedidoWhatsapp(p)} style={{ flex: 1, minWidth: '80px', background: 'none', border: '1px solid #25D36650', color: '#25D366', borderRadius: '6px', padding: '10px', cursor: 'pointer' }}>📲 Zap</button>
                    {ehAdmin && <button onClick={() => handleExcluir(p.id)} style={{ flex: 1, minWidth: '80px', background: 'none', border: '1px solid #f8717150', color: '#f87171', borderRadius: '6px', padding: '10px', cursor: 'pointer' }}>Excluir</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* ---------- IMPRESSÃO: LISTA COMPLETA (quando nao esta imprimindo um recibo individual) ---------- */}
          {!pedidoImprimindo && (
            <div className="somente-impressao-lista">
              <h2>Lista de Pedidos</h2>
              {lista.map(p => (
                <div key={p.id} className="pedido-impresso">
                  <div className="pedido-impresso-header">
                    <strong>{new Date(p.createdAt).toLocaleDateString('pt-BR')}</strong> — <strong>{p.cliente?.nome}</strong>
                  </div>
                  <ul>
                    {p.itens.map((i, idx) => <li key={idx}>{i.quantidade}x {nomeItem(i)}</li>)}
                  </ul>
                  <div className="pedido-impresso-total">Total: R$ {(p.valorTotal || 0).toFixed(2)}</div>
                </div>
              ))}
            </div>
          )}

          {/* ---------- IMPRESSÃO: RECIBO DE UM PEDIDO (80 colunas / matricial) ---------- */}
          {pedidoImprimindo && (
            <div className="somente-impressao-recibo">
              <div className="recibo">
                <div className="recibo-linha-dupla" />
                <div className="recibo-centro">BEBIDAS PELICANO</div>
                <div className="recibo-centro">PEDIDO #{pedidoImprimindo.id}</div>
                <div className="recibo-linha-tracejada" />
                <div>Data: {new Date(pedidoImprimindo.createdAt).toLocaleDateString('pt-BR')}</div>
                <div>Cliente: {pedidoImprimindo.cliente?.nome}</div>
                {pedidoImprimindo.vendedor?.nome && <div>Vendedor: {pedidoImprimindo.vendedor.nome}</div>}
                <div className="recibo-linha-tracejada" />
                {pedidoImprimindo.itens.map((i, idx) => (
                  <div className="recibo-item" key={idx}>
                    <span>{i.quantidade}x {nomeItem(i)}</span>
                    <span>R$ {(i.precoUnit * i.quantidade).toFixed(2)}</span>
                  </div>
                ))}
                <div className="recibo-linha-tracejada" />
                <div className="recibo-item recibo-total">
                  <span>TOTAL</span>
                  <span>R$ {(pedidoImprimindo.valorTotal || 0).toFixed(2)}</span>
                </div>
                <div>Pagamento: {formaPagamentoLabel[pedidoImprimindo.formaPagamento] || pedidoImprimindo.formaPagamento}</div>
                <div className="recibo-linha-dupla" />
              </div>
            </div>
          )}
        </>
      )}

      <style>{`
        .somente-impressao-lista, .somente-impressao-recibo { display: none; }

        @media print {
          @page { size: auto; margin: 10mm; }
          .tela-nao-imprimir { display: none !important; }
          body { background: #fff !important; color: #000 !important; }

          /* Lista completa (impressao em A4 normal) */
          .somente-impressao-lista { display: block !important; }
          .pedido-impresso { border-bottom: 1px solid #ccc; padding: 10px 0; }
          .pedido-impresso-header { font-size: 1rem; margin-bottom: 4px; }
          .pedido-impresso ul { margin: 4px 0; padding-left: 20px; }
          .pedido-impresso-total { font-weight: bold; margin-top: 4px; }

          /* Recibo individual - largura de 80 colunas (formulario continuo matricial) */
          .somente-impressao-recibo { display: block !important; }
          .recibo {
            width: 80ch;
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            color: #000;
          }
          .recibo-centro { text-align: center; font-weight: bold; }
          .recibo-linha-dupla { border-top: 2px solid #000; margin: 4px 0; }
          .recibo-linha-tracejada { border-top: 1px dashed #000; margin: 4px 0; }
          .recibo-item { display: flex; justify-content: space-between; padding: 2px 0; }
          .recibo-total { font-weight: bold; font-size: 13px; }
        }
      `}</style>
    </div>
  );
}