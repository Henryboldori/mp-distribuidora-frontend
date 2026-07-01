import { useEffect, useState } from 'react';
import { getPedidos, atualizarStatusPedido } from '../api';
import { useAuth } from '../context/AuthContext';

interface Pedido {
  id: number;
  valorTotal: number;
  status: string;
  createdAt: string;
  cliente: { nome: string };
  vendedor: { nome: string };
}

const statusCores: Record<string, string> = {
  PENDENTE: '#f59e0b',
  EM_ROTA: '#3b82f6',
  ENTREGUE: '#22c55e',
  CANCELADO: '#f87171'
};

export default function Pedidos() {
  const [lista, setLista] = useState<Pedido[]>([]);
  const [carregando, setCarregando] = useState(true);
  const { usuario } = useAuth();

  async function carregar() {
    setCarregando(true);
    try {
      setLista(await getPedidos());
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, []);

  const mudarStatus = async (id: number, status: string) => {
    await atualizarStatusPedido(id, status);
    carregar();
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ color: '#22c55e' }}>{usuario?.role === 'ADMIN' ? 'Todos os Pedidos' : 'Meus Pedidos'}</h2>

      {carregando ? <p>Carregando...</p> : lista.length === 0 ? (
        <p style={{ color: '#777' }}>Nenhum pedido por aqui ainda.</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #22c55e', textAlign: 'left' }}>
              <th style={{ padding: '10px' }}>ID</th>
              <th style={{ padding: '10px' }}>Cliente</th>
              {usuario?.role === 'ADMIN' && <th style={{ padding: '10px' }}>Vendedor</th>}
              <th style={{ padding: '10px' }}>Total</th>
              <th style={{ padding: '10px' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {lista.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #222' }}>
                <td style={{ padding: '10px' }}>#{p.id}</td>
                <td style={{ padding: '10px' }}>{p.cliente?.nome}</td>
                {usuario?.role === 'ADMIN' && <td style={{ padding: '10px' }}>{p.vendedor?.nome}</td>}
                <td style={{ padding: '10px' }}>R$ {p.valorTotal.toFixed(2)}</td>
                <td style={{ padding: '10px' }}>
                  <select
                    value={p.status}
                    onChange={(e) => mudarStatus(p.id, e.target.value)}
                    style={{ backgroundColor: '#111', color: statusCores[p.status], border: '1px solid #333', borderRadius: '6px', padding: '5px' }}
                  >
                    <option value="PENDENTE">PENDENTE</option>
                    <option value="EM_ROTA">EM ROTA</option>
                    <option value="ENTREGUE">ENTREGUE</option>
                    <option value="CANCELADO">CANCELADO</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
