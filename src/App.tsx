import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Menu from './components/Menu';

import Login from './pages/Login';
import Inicio from './pages/Inicio';
import NovoPedido from './pages/NovoPedido';
import Clientes from './pages/Clientes';
import Pedidos from './pages/Pedidos';
import Romaneio from './pages/Romaneio';
import Relatorios from './pages/Relatorios';
import ContasReceber from './pages/ContasReceber';
import Fornecedores from './pages/Fornecedores';
import Rotas from './pages/Rotas';
import Produtos from './pages/Produtos';
import Usuarios from './pages/Usuarios';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#050505', color: '#fff' }}>
      <Menu />
      {children}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          <Route path="/" element={<PrivateRoute><Layout><Inicio /></Layout></PrivateRoute>} />
          <Route path="/novo-pedido" element={<PrivateRoute><Layout><NovoPedido /></Layout></PrivateRoute>} />
          <Route path="/pedido/:id/editar" element={<PrivateRoute><Layout><NovoPedido /></Layout></PrivateRoute>} />
          <Route path="/clientes" element={<PrivateRoute><Layout><Clientes /></Layout></PrivateRoute>} />
          <Route path="/pedidos" element={<PrivateRoute><Layout><Pedidos /></Layout></PrivateRoute>} />
          <Route path="/romaneio" element={<PrivateRoute><Layout><Romaneio /></Layout></PrivateRoute>} />
          <Route path="/rotas" element={<PrivateRoute><Layout><Rotas /></Layout></PrivateRoute>} />

          <Route path="/produtos" element={<PrivateRoute somenteAdmin><Layout><Produtos /></Layout></PrivateRoute>} />
          <Route path="/usuarios" element={<PrivateRoute somenteAdmin><Layout><Usuarios /></Layout></PrivateRoute>} />
          <Route path="/relatorios" element={<PrivateRoute><Layout><Relatorios /></Layout></PrivateRoute>} />
          <Route path="/contas-a-receber" element={<PrivateRoute><Layout><ContasReceber /></Layout></PrivateRoute>} />
          <Route path="/fornecedores" element={<PrivateRoute somenteAdmin><Layout><Fornecedores /></Layout></PrivateRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}