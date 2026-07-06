import { useState, useEffect } from 'react';
import { getPedidos, atualizarPagamentoPedido, getClientesInativos } from '../api';

interface GrupoCliente {
  nome: string;
  telefone: string | null;
  pedidos: any[];
  total: number;
  diasMaisAntigo: number;
}

export default function ContasReceber() {
  const [aba, setAba] = useState<'atraso' | 'inativos'>('atraso');

  // ---------- FIADO EM ATRASO ----------
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);

  const carregar = async () => {
    setCarregando(true);
    try {
      const todos = await getPedidos();
      setPedidos(todos.filter((p: any) => p.statusPagamento === 'PENDENTE'));
    } catch (err) { console.error(err); }
    finally { setCarregando(false); }
  };

  useEffect(() => { carregar(); }, []);

  const marcarPago = async (id: number) => {
    await atualizarPagamentoPedido(id, 'PAGO');
    carregar();
  };

  const diasAtras = (data: string) => Math.floor((Date.now() - new Date(data).getTime()) / 86400000);

  const gruposClientes: GrupoCliente[] = (() => {
    const porCliente: Record<string, GrupoCliente> = {};
    pedidos.forEach(p => {
      const nome = p.cliente?.nome || 'Desconhecido';
      if (!porCliente[nome]) {
        porCliente[nome] = { nome, telefone: p.cliente?.telefone || null, pedidos: [], total: 0, diasMaisAntigo: 0 };
      }
      porCliente[nome].pedidos.push(p);
      porCliente[nome].total += p.valorTotal;
    });

    return Object.values(porCliente)
      .map(g => {
        g.pedidos.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        g.diasMaisAntigo = diasAtras(g.pedidos[0].createdAt);
        return g;
      })
      .sort((a, b) => b.diasMaisAntigo - a.diasMaisAntigo);
  })();

  const totalGeral = pedidos.reduce((acc, p) => acc + p.valorTotal, 0);

  const cobrarWhatsapp = (grupo: GrupoCliente) => {
    const listaPedidos = grupo.pedidos.map(p => `#${p.id} - ${new Date(p.createdAt).toLocaleDateString('pt-BR')} - R$ ${p.valorTotal.toFixed(2)}`).join('\n');
    const texto = `Olá, ${grupo.nome}! Tudo bem? Passando pra lembrar que você tem pendências em aberto com a Bebidas Pelicano:\n\n${listaPedidos}\n\n*Total: R$ ${grupo.total.toFixed(2)}*\n\nQualquer dúvida estamos à disposição! 🐦`;
    const telefone = grupo.telefone?.replace(/\D/g, '');
    const url = telefone ? `https://wa.me/55${telefone}?text=${encodeURIComponent(texto)}` : `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  // ---------- CLIENTES INATIVOS ----------
  const [diasLimite, setDiasLimite] = useState(20);
  const [inativos, setInativos] = useState<any[]>([]);
  const [nuncaCompraram, setNuncaCompraram] = useState<any[]>([]);
  const [carregandoInativos, setCarregandoInativos] = useState(false);

  const carregarInativos = async (dias: number) => {
    setCarregandoInativos(true);
    try {
      const resultado = await getClientesInativos(dias);
      setInativos(resultado.inativos);
      setNuncaCompraram(resultado.nuncaCompraram);
    } catch (err) { console.error(err); }
    finally { setCarregandoInativos(false); }
  };

  useEffect(() => {
    if (aba === 'inativos') carregarInativos(diasLimite);
  }, [aba]);

  const chamarClienteInativo = (nome: string, telefone: string | null) => {
    const texto = `Olá, ${nome}! Faz um tempinho que você não faz um pedido com a gente 🐦 Tá precisando de alguma coisa? Estamos com ótimas ofertas te esperando!`;
    const tel = telefone?.replace(/\D/g, '');
    const url = tel ? `https://wa.me/55${tel}?text=${encodeURIComponent(texto)}` : `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ color: '#22c55e', marginTop: 0 }}>💰 Contas a Receber</h2>

      {/* ---------- ABAS ---------- */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button
          onClick={() => setAba('atraso')}
          style={{
            padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
            border: aba === 'atraso' ? '2px solid #f87171' : '1px solid #333',
            backgroundColor: aba === 'atraso' ? '#1a1010' : '#111',
            color: aba === 'atraso' ? '#f87171' : '#999'
          }}
        >
          Fiado em Atraso
        </button>
        <button
          onClick={() => setAba('inativos')}
          style={{
            padding: '10px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold',
            border: aba === 'inativos' ? '2px solid #3b82f6' : '1px solid #333',
            backgroundColor: aba === 'inativos' ? '#0a1420' : '#111',
            color: aba === 'inativos' ? '#3b82f6' : '#999'
          }}
        >
          Clientes Inativos
        </button>
      </div>

      {/* ---------- ABA: FIADO EM ATRASO ---------- */}
      {aba === 'atraso' && (
        <>
          <div style={{ backgroundColor: '#1a1010', border: '1px solid #f8717140', borderRadius: '12px', padding: '18px', marginBottom: '20px' }}>
            <div style={{ color: '#888', fontSize: '0.8rem' }}>TOTAL PENDENTE</div>
            <div style={{ color: '#f87171', fontSize: '1.8rem', fontWeight: 'bold' }}>R$ {totalGeral.toFixed(2)}</div>
          </div>

          {carregando ? <p style={{ color: '#777' }}>Carregando...</p> : gruposClientes.length === 0 ? (
            <p style={{ color: '#777' }}>Nenhuma pendência de pagamento. 🎉</p>
          ) : (
            gruposClientes.map((grupo) => (
              <div key={grupo.nome} style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '12px', padding: '18px', marginBottom: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                  <div>
                    <strong style={{ color: '#fff' }}>{grupo.nome}</strong>
                    <span style={{ marginLeft: '10px', color: grupo.diasMaisAntigo > 7 ? '#f87171' : '#666', fontSize: '0.8rem' }}>
                      pendente há {grupo.diasMaisAntigo} dias
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <strong style={{ color: '#f87171' }}>R$ {grupo.total.toFixed(2)}</strong>
                    <button
                      onClick={() => cobrarWhatsapp(grupo)}
                      style={{ padding: '6px 12px', backgroundColor: '#1a1a1a', color: '#25D366', border: '1px solid #25D36650', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
                    >
                      📲 Cobrar
                    </button>
                  </div>
                </div>
                {grupo.pedidos.map((p: any) => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid #1a1a1a', fontSize: '0.85rem' }}>
                    <span style={{ color: '#999' }}>
                      #{p.id} — {new Date(p.createdAt).toLocaleDateString('pt-BR')}
                      {' '}<span style={{ color: diasAtras(p.createdAt) > 7 ? '#f87171' : '#666' }}>({diasAtras(p.createdAt)} dias)</span>
                    </span>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <span style={{ color: '#ccc' }}>R$ {p.valorTotal.toFixed(2)}</span>
                      <button onClick={() => marcarPago(p.id)} style={{ padding: '6px 12px', backgroundColor: '#22c55e', color: '#000', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>
                        Marcar Pago
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </>
      )}

      {/* ---------- ABA: CLIENTES INATIVOS ---------- */}
      {aba === 'inativos' && (
        <>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap' }}>
            <label style={{ color: '#999', fontSize: '0.9rem' }}>Sem comprar há mais de</label>
            <input
              type="number"
              value={diasLimite}
              onChange={(e) => setDiasLimite(Number(e.target.value) || 0)}
              style={{ width: '70px', padding: '8px', backgroundColor: '#111', border: '1px solid #333', color: '#fff', borderRadius: '8px' }}
            />
            <span style={{ color: '#999', fontSize: '0.9rem' }}>dias</span>
            <button
              onClick={() => carregarInativos(diasLimite)}
              style={{ padding: '8px 14px', backgroundColor: '#3b82f6', color: '#000', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Buscar
            </button>
          </div>

          {carregandoInativos ? <p style={{ color: '#777' }}>Carregando...</p> : (
            <>
              {inativos.length === 0 ? (
                <p style={{ color: '#777' }}>Nenhum cliente inativo encontrado nesse período. 🎉</p>
              ) : (
                <div style={{ backgroundColor: '#0a0a0a', borderRadius: '15px', border: '1px solid #222', overflow: 'hidden' }}>
                  {inativos.map((c: any) => (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: '1px solid #151515', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <div style={{ color: '#fff', fontWeight: 'bold' }}>{c.nome}</div>
                        <div style={{ color: '#777', fontSize: '0.8rem' }}>Última compra há {c.diasSemComprar} dias</div>
                      </div>
                      <button
                        onClick={() => chamarClienteInativo(c.nome, c.telefone)}
                        style={{ padding: '8px 14px', backgroundColor: '#1a1a1a', color: '#25D366', border: '1px solid #25D36650', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}
                      >
                        📲 Chamar no WhatsApp
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {nuncaCompraram.length > 0 && (
                <div style={{ marginTop: '25px' }}>
                  <h4 style={{ color: '#999', fontSize: '0.9rem' }}>Nunca fizeram nenhum pedido ({nuncaCompraram.length})</h4>
                  <div style={{ backgroundColor: '#0a0a0a', borderRadius: '15px', border: '1px solid #222', overflow: 'hidden' }}>
                    {nuncaCompraram.map((c: any) => (
                      <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 18px', borderBottom: '1px solid #151515' }}>
                        <span style={{ color: '#ccc' }}>{c.nome}</span>
                        <button
                          onClick={() => chamarClienteInativo(c.nome, c.telefone)}
                          style={{ padding: '6px 12px', backgroundColor: '#1a1a1a', color: '#25D366', border: '1px solid #25D36650', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                          📲 Chamar
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}