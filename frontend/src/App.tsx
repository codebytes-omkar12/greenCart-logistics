import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Login from './Login';
import Register from './Register';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Drivers from './pages/Drivers';
import RoutesPage from './pages/Routes';
import Orders from './pages/Orders';
import Simulations from './pages/Simulations';
import './index.css';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated && location.pathname !== '/login' && location.pathname !== '/register') {
      navigate('/login');
    }
  }, [isAuthenticated, navigate, location.pathname]);

  const handleLogin = (token: string) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
    navigate('/');
  };

  return (
    <Routes>
      <Route path="/login" element={<Login onLogin={handleLogin} onSwitchToRegister={() => navigate('/register')} />} />
      <Route path="/register" element={<Register onSwitchToLogin={() => navigate('/login')} />} />
      
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/drivers" element={<Drivers />} />
        <Route path="/routes" element={<RoutesPage />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/simulations" element={<Simulations />} />
      </Route>
    </Routes>
  );
};

export default App;