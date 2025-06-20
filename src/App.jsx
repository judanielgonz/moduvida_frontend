// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NavBar from './components/navbar'; // Ajustado según tu indicación
import Header from './components/Header';
import Proveedores from './components/FormularioProveedor';
import Inicio from './components/Inicio';
import Articulos from './components/Articulos';
import OrdenesCompra from './components/ordenesdecompra'; // Ajustado al nombre probable
import FormularioTrabajador from './components/trabajadores';
import GestionClientes from './components/clientes';
import GestionStock from './components/stock';
import FormularioModelo from './components/modelos';
import GestionPedidosYPagos from './components/gestionPagos';
import Informes from './components/informes';
import Recibimientos from './components/Recibimientos';
import './css/App.css';

const App = () => {
  return (
    <Router>
      <div className="app-container">
        <Header />
        <NavBar className="sidebar" />
        <div className="main-content">
          <Routes>
            <Route path="/" element={<Inicio />} />
            <Route path="/Proveedores" element={<Proveedores />} />
            <Route path="/articulos" element={<Articulos />} />
            <Route path="/ordenes-de-compra" element={<OrdenesCompra />} />
            <Route path="/trabajadores" element={<FormularioTrabajador />} />
            <Route path="/Clientes" element={<GestionClientes />} />
            <Route path="/Stock" element={<GestionStock />} />
            <Route path="/Modelos" element={<FormularioModelo />} />
            <Route path="/Pedidos" element={<GestionPedidosYPagos />} />
            <Route path="/Informes" element={<Informes />} />
            <Route path="/Recibimientos" element={<Recibimientos />} />
            <Route path="*" element={<h2>404 - Página no encontrada</h2>} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;