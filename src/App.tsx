import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import Home from './pages/Home';
import List from './pages/List';
import Detail from './pages/Detail';
import Check from './pages/Check';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import Products from './pages/admin/Products';
import ProductEdit from './pages/admin/ProductEdit';
import ProductSold from './pages/admin/ProductSold';
import Settings from './pages/admin/Settings';
import { useStore } from './store/useStore';

function AdminRoute({ children }: { children: React.ReactNode }) {
  const isAdmin = useStore((state) => state.isAdminLoggedIn);
  const isAuthReady = useStore((state) => state.isAuthReady);
  
  if (!isAuthReady) {
    return <div className="min-h-screen flex items-center justify-center p-4">加载中...</div>;
  }
  
  return isAdmin ? children : <Navigate to="/admin/login" replace />;
}

export default function App() {
  const initDB = useStore(state => state.initDB);

  useEffect(() => {
    initDB();
  }, [initDB]);

  return (
    <HashRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/list/:type" element={<List />} />
          <Route path="/detail/:id" element={<Detail />} />
          <Route path="/check" element={<Check />} />
        </Route>
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="products" element={<Products />} />
          <Route path="product/edit/:id" element={<ProductEdit />} />
          <Route path="product/new" element={<ProductEdit />} />
          <Route path="product/sold/:id" element={<ProductSold />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
