import { useState, useEffect, useRef } from 'react';
import { getClientes, getPedidos } from '../api';

interface Cliente { id: number; nome: string; endereco: string | null; telefone: string | null; }

export default function Rotas() {
  const [lista, setLista] = useState<Cliente[]>([]);
  const [visitadosHoje, setVisitadosHoje] = useState<Set<number>>(new Set());
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const chaveStorage = `rota_visitados_${new Date().toISOString().slice(0, 10)}`;

  useEffect(() => {
    getClientes().then(setLista);

    // Marca automaticamente como "visitado hoje" quem ja recebeu pedido hoje
    const hoje = new Date().toISOString().slice(0, 10);
    getPedidos({ data: hoje }).then((pedidos: any[]) => {
      const idsComPedidoHoje = new Set<number>(pedidos.map((p: any) => p.clienteId));
      const salvos = localStorage.getItem(chaveStorage);
      const idsManuais: number[] = salvos ? JSON.parse(salvos) : [];
      setVisitadosHoje(new Set([...idsComPedidoHoje, ...idsManuais]));
    }).catch(() => {});
  }, []);

  const handleSort = () => {
    if (dragItem.current !== null && dragOverItem.current !== null) {
      let novas = [...lista];
      const movido = novas.splice(dragItem.current, 1)[0];
      novas.splice(dragOverItem.current, 0, movido);
      setLista(novas);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const toggleVisitado = (id: number) => {
    setVisitadosHoje(prev => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id); else novo.add(id);
      const salvos = localStorage.getItem(chaveStorage);
      const idsManuais: number[] = salvos ? JSON.parse(salvos) : [];
      const atualizados = novo.has(id) ? [...new Set([...idsManuais, id])] : idsManuais.filter(x => x !== id);
      localStorage.setItem(chaveStorage, JSON.stringify(atualizados));
      return novo;
    });
  };

  const totalVisitados = lista.filter(c => visitadosHoje.has(c.id)).length;

  return (
    <div style={{ padding: '20px', paddingBottom: '100px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h2 style={{ color: '#22c55e', margin: 0 }}>Minha Rota 📍</h2>
        <span style={{ color: '#4ade80', fontWeight: 'bold', fontSize: '0.9rem' }}>{totalVisitados}/{lista.length} visitados</span>
      </div>

      <div style={{ backgroundColor: '#1a1a1a', borderRadius: '8px', height: '8px', marginBottom: '20px', overflow: 'hidden' }}>
        <div style={{ width: `${lista.length ? (totalVisitados / lista.length) * 100 : 0}%`, backgroundColor: '#22c55e', height: '100%', transition: 'width 0.3s' }} />
      </div>

      {lista.map((item, index) => {
        const visitado = visitadosHoje.has(item.id);
        return (
          <div
            key={item.id} draggable
            onDragStart={() => (dragItem.current = index)}
            onDragEnter={() => (dragOverItem.current = index)}
            onDragEnd={handleSort}
            onDragOver={(e) => e.preventDefault()}
            style={{
              display: 'flex', alignItems: 'center', backgroundColor: visitado ? '#0f1f14' : '#111',
              padding: '15px', borderRadius: '12px', marginBottom: '10px',
              borderLeft: `5px solid ${visitado ? '#22c55e' : '#333'}`, opacity: visitado ? 0.7 : 1
            }}
          >
            <span style={{ marginRight: '15px', cursor: 'grab', color: '#444' }}>☰</span>
            <div onClick={() => toggleVisitado(item.id)} style={{ marginRight: '15px', cursor: 'pointer', fontSize: '1.3rem' }}>
              {visitado ? '✅' : '⬜'}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 'bold', textDecoration: visitado ? 'line-through' : 'none' }}>{item.nome}</div>
              <div style={{ fontSize: '0.8rem', color: '#aaa' }}>{item.endereco || 'Endereço não cadastrado'}</div>
            </div>
            {item.endereco && (
              <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.endereco!)}`, '_blank')}
                style={{ backgroundColor: '#22c55e', border: 'none', padding: '8px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>GPS</button>
            )}
          </div>
        );
      })}
    </div>
  );
}