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
  const [pedidosImprimindo, setPedidosImprimindo] = useState<Pedido[] | null>(null);
  const [selecionados, setSelecionados] = useState<Set<number>>(new Set());
  const { usuario } = useAuth();
  const ehAdmin = usuario?.role === 'ADMIN';

  async function carregar(data?: string) {
    setCarregando(true);
    try { setLista(await getPedidos(data ? { data } : undefined)); }
    catch (err) { console.error(err); }
    finally { setCarregando(false); }
  }

  useEffect(() => { carregar(dataFiltro || undefined); setSelecionados(new Set()); }, [dataFiltro]);

  const mudarStatus = async (id: number, status: string) => { await atualizarStatusPedido(id, status); carregar(dataFiltro || undefined); };
  const marcarPago = async (id: number) => { await atualizarPagamentoPedido(id, 'PAGO'); carregar(dataFiltro || undefined); };
  const handleExcluir = async (id: number) => {
    if (!confirm('Excluir este pedido? O estoque será devolvido.')) return;
    await excluirPedido(id); carregar(dataFiltro || undefined);
  };
  const handleImprimirTudo = () => { setPedidosImprimindo(null); window.print(); };

  const nomeItem = (i: { produto?: { nome: string }; nomeAvulso?: string }) => i.produto ? i.produto.nome : (i.nomeAvulso || 'Item');
  const listaItens = (p: Pedido) => p.itens.map(i => `${i.quantidade}x ${nomeItem(i)}`).join(', ');

  // ---------- SELECAO ----------
  const toggleSelecionado = (id: number) => {
    setSelecionados(prev => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id); else novo.add(id);
      return novo;
    });
  };

  const todosSelecionados = lista.length > 0 && lista.every(p => selecionados.has(p.id));
  const toggleSelecionarTodos = () => {
    setSelecionados(todosSelecionados ? new Set() : new Set(lista.map(p => p.id)));
  };

  const pedidosSelecionadosLista = lista.filter(p => selecionados.has(p.id));

  // ---------- IMPRESSAO INDIVIDUAL / EM LOTE (formato do formulario 240x140mm) ----------
  const imprimirRecibo = (p: Pedido) => {
    setPedidosImprimindo([p]);
    setTimeout(() => { window.print(); setPedidosImprimindo(null); }, 100);
  };

  const imprimirSelecionados = () => {
    if (pedidosSelecionadosLista.length === 0) return;
    setPedidosImprimindo(pedidosSelecionadosLista);
    setTimeout(() => { window.print(); setPedidosImprimindo(null); }, 100);
  };

  // ---------- WHATSAPP ----------
  const textoPedido = (p: Pedido) => {
    const linhas = p.itens.map(i => `${i.quantidade}x ${nomeItem(i)} - R$ ${(i.precoUnit * i.quantidade).toFixed(2)}`).join('\n');
    return `*PEDIDO #${p.id}*\nCliente: ${p.cliente?.nome}\nVendedor: ${p.vendedor?.nome || '-'}\nData: ${new Date(p.createdAt).toLocaleDateString('pt-BR')}\n\n${linhas}\n\n*Total: R$ ${(p.valorTotal || 0).toFixed(2)}*\nPagamento: ${formaPagamentoLabel[p.formaPagamento] || p.formaPagamento}`;
  };

  const enviarPedidoWhatsapp = (p: Pedido) => {
    window.open(`https://wa.me/${WHATSAPP_NUMERO_LOJA}?text=${encodeURIComponent(textoPedido(p))}`, '_blank');
  };

  const enviarSelecionadosWhatsapp = () => {
    if (pedidosSelecionadosLista.length === 0) return;
    const textoCompleto = pedidosSelecionadosLista.map(textoPedido).join('\n\n----------------------\n\n');
    window.open(`https://wa.me/${WHATSAPP_NUMERO_LOJA}?text=${encodeURIComponent(textoCompleto)}`, '_blank');
  };

  const excluirSelecionados = async () => {
    if (pedidosSelecionadosLista.length === 0) return;
    if (!confirm(`Excluir ${pedidosSelecionadosLista.length} pedido(s) selecionado(s)? O estoque será devolvido.`)) return;
    for (const p of pedidosSelecionadosLista) {
      await excluirPedido(p.id);
    }
    setSelecionados(new Set());
    carregar(dataFiltro || undefined);
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
            🖨️ Imprimir lista (A4)
          </button>
        </div>
      </div>

      {/* ---------- BARRA DE ACOES EM LOTE ---------- */}
      {selecionados.size > 0 && (
        <div className="tela-nao-imprimir" style={{
          display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap',
          backgroundColor: '#0f2417', border: '1px solid #22c55e50', borderRadius: '10px',
          padding: '12px 16px', marginTop: '15px'
        }}>
          <span style={{ color: '#22c55e', fontWeight: 'bold' }}>{selecionados.size} selecionado(s)</span>
          <button onClick={imprimirSelecionados} style={{ padding: '8px 14px', backgroundColor: '#1a1a1a', color: '#fff', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer' }}>
            🖨️ Imprimir selecionados
          </button>
          <button onClick={enviarSelecionadosWhatsapp} style={{ padding: '8px 14px', backgroundColor: '#1a1a1a', color: '#25D366', border: '1px solid #25D36650', borderRadius: '8px', cursor: 'pointer' }}>
            📲 Enviar todos por WhatsApp
          </button>
          {ehAdmin && (
            <button onClick={excluirSelecionados} style={{ padding: '8px 14px', backgroundColor: '#1a1a1a', color: '#f87171', border: '1px solid #f8717150', borderRadius: '8px', cursor: 'pointer' }}>
              🗑️ Excluir selecionados
            </button>
          )}
          <button onClick={() => setSelecionados(new Set())} style={{ padding: '8px 14px', backgroundColor: 'transparent', color: '#999', border: '1px solid #333', borderRadius: '8px', cursor: 'pointer' }}>
            Limpar seleção
          </button>
        </div>
      )}

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
                    <th style={{ padding: '10px' }}>
                      <input type="checkbox" checked={todosSelecionados} onChange={toggleSelecionarTodos} />
                    </th>
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
                      <td style={{ padding: '10px' }}>
                        <input type="checkbox" checked={selecionados.has(p.id)} onChange={() => toggleSelecionado(p.id)} />
                      </td>
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
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: '#fff' }}>
                      <input type="checkbox" checked={selecionados.has(p.id)} onChange={() => toggleSelecionado(p.id)} />
                      #{p.id} — {p.cliente?.nome}
                    </label>
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

          {/* ---------- IMPRESSÃO: LISTA COMPLETA A4 ---------- */}
          {!pedidosImprimindo && (
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

          {/* ---------- IMPRESSÃO: RECIBOS (1 ou vários, formulario 240x140mm) ---------- */}
          {pedidosImprimindo && (
            <div className="somente-impressao-recibo">
              {pedidosImprimindo.map((p, idx) => (
                <div className="recibo-pagina" key={p.id}>
                  <div className="recibo">
                    <div className="recibo-linha-dupla" />
                    <div className="recibo-centro">BEBIDAS PELICANO</div>
                    <div className="recibo-centro">PEDIDO #{p.id}</div>
                    <div className="recibo-linha-tracejada" />
                    <div>Data: {new Date(p.createdAt).toLocaleDateString('pt-BR')}</div>
                    <div>Cliente: {p.cliente?.nome}</div>
                    {p.vendedor?.nome && <div>Vendedor: {p.vendedor.nome}</div>}
                    <div className="recibo-linha-tracejada" />
                    {p.itens.map((i, idx2) => (
                      <div className="recibo-item" key={idx2}>
                        <span>{i.quantidade}x {nomeItem(i)}</span>
                        <span>R$ {(i.precoUnit * i.quantidade).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="recibo-linha-tracejada" />
                    <div className="recibo-item recibo-total">
                      <span>TOTAL</span>
                      <span>R$ {(p.valorTotal || 0).toFixed(2)}</span>
                    </div>
                    <div>Pagamento: {formaPagamentoLabel[p.formaPagamento] || p.formaPagamento}</div>
                    <div className="recibo-linha-dupla" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <style>{`
        .somente-impressao-lista, .somente-impressao-recibo { display: none; }

        @media print {
          .tela-nao-imprimir { display: none !important; }
          body { background: #fff !important; color: #000 !important; }

          /* Lista completa (impressao em A4 normal) */
          .somente-impressao-lista { display: block !important; }
          .pedido-impresso { border-bottom: 1px solid #ccc; padding: 10px 0; }
          .pedido-impresso-header { font-size: 1rem; margin-bottom: 4px; }
          .pedido-impresso ul { margin: 4px 0; padding-left: 20px; }
          .pedido-impresso-total { font-weight: bold; margin-top: 4px; }

          /* Recibos - formato do formulario continuo 240mm x 140mm (autocopiativo 2 vias) */
          .somente-impressao-recibo { display: block !important; }
          @page { size: 240mm 140mm; margin: 6mm; }

          .recibo-pagina { page-break-after: always; }
          .recibo-pagina:last-child { page-break-after: auto; }

          .recibo {
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