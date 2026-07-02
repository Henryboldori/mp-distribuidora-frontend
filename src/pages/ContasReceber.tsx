import { useState, useEffect } from 'react';
import { getPedidos, atualizarPagamentoPedido } from '../api';

export default function ContasReceber() {
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

  // Agrupa por cliente
  const porCliente: Record<string, any[]> = {};
  pedidos.forEach(p => {
    const nome = p.cliente?.nome || 'Desconhecido';
    if (!porCliente[nome]) porCliente[nome] = [];
    porCliente[nome].push(p);
  });

  const totalGeral = pedidos.reduce((acc, p) => acc + p.valorTotal, 0);

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ color: '#22c55e', marginTop: 0 }}>💰 Contas a Receber</h2>

      <div style={{ backgroundColor: '#1a1010', border: '1px solid #f8717140', borderRadius: '12px', padding: '18px', marginBottom: '20px' }}>
        <div style={{ color: '#888', fontSize: '0.8rem' }}>TOTAL PENDENTE</div>
        <div style={{ color: '#f87171', fontSize: '1.8rem', fontWeight: 'bold' }}>R$ {totalGeral.toFixed(2)}</div>
      </div>

      {carregando ? <p style={{ color: '#777' }}>Carregando...</p> : Object.keys(porCliente).length === 0 ? (
        <p style={{ color: '#777' }}>Nenhuma pendência de pagamento. 🎉</p>
      ) : (
        Object.entries(porCliente).map(([nomeCliente, pedidosCliente]) => {
          const totalCliente = pedidosCliente.reduce((acc, p) => acc + p.valorTotal, 0);
          return (
            <div key={nomeCliente} style={{ backgroundColor: '#111', border: '1px solid #222', borderRadius: '12px', padding: '18px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <strong style={{ color: '#fff' }}>{nomeCliente}</strong>
                <strong style={{ color: '#f87171' }}>R$ {totalCliente.toFixed(2)}</strong>
              </div>
              {pedidosCliente.map((p: any) => (
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
          );
        })
      )}
    </div>
  );
}