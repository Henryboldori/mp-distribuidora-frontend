import { useState, useEffect, useRef } from 'react';
import { getClientes } from '../api';

interface Cliente { id: number; nome: string; endereco: string; }

export default function Rotas() {
  const [lista, setLista] = useState<Cliente[]>([]);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    getClientes().then(setLista).catch(() => {});
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

  return (
    <div style={{ padding: '20px', paddingBottom: '100px' }}>
      <h2 style={{ color: '#22c55e' }}>Minha Rota 📍</h2>
      {lista.map((item, index) => (
        <div
          key={item.id} draggable
          onDragStart={() => (dragItem.current = index)}
          onDragEnter={() => (dragOverItem.current = index)}
          onDragEnd={handleSort}
          onDragOver={(e) => e.preventDefault()}
          style={{ display: 'flex', alignItems: 'center', backgroundColor: '#111', padding: '15px', borderRadius: '12px', marginBottom: '10px', borderLeft: '5px solid #22c55e' }}
        >
          <span style={{ marginRight: '15px', cursor: 'grab', color: '#444' }}>☰</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 'bold' }}>{item.nome}</div>
            <div style={{ fontSize: '0.8rem', color: '#aaa' }}>{item.endereco}</div>
          </div>
          <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.endereco)}`, '_blank')}
            style={{ backgroundColor: '#22c55e', border: 'none', padding: '8px', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>GPS</button>
        </div>
      ))}
    </div>
  );
}
