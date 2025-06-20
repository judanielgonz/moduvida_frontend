// src/components/GestionClientes.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faCog, faUserPlus, faSearch, faSort, faTimes } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../css/FormularioCliente.css';

import baseUrl from '../config'; // Importa la URL base

const GestionClientes = () => {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [cedula, setCedula] = useState('');
  const [clienteActual, setClienteActual] = useState(null);
  const [listaClientes, setListaClientes] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCedula, setFiltroCedula] = useState('');
  const [sortBy, setSortBy] = useState('nombre');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(false);

  const cargarClientes = async () => {
    try {
      setLoading(true);
      const respuesta = await axios.get(`${baseUrl}/clientes`);
      setListaClientes(respuesta.data.data || []);
    } catch (error) {
      console.error('Error al obtener los clientes:', error);
      toast.error('Error al cargar los clientes: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarClientes();
  }, []);

  const handleEditarCliente = (clienteId) => {
    const clienteParaEditar = listaClientes.find(cliente => cliente._id === clienteId);
    if (clienteParaEditar) {
      setClienteActual(clienteParaEditar);
      setNombre(clienteParaEditar.nombre);
      setApellido(clienteParaEditar.apellido || '');
      setEmail(clienteParaEditar.email);
      setTelefono(clienteParaEditar.telefono);
      setCedula(clienteParaEditar.cedula || '');
    }
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    const datosCliente = {
      nombre,
      email,
      telefono,
      ...(apellido && { apellido }),
      ...(cedula && { cedula }),
    };

    try {
      setLoading(true);
      let response;
      if (clienteActual) {
        response = await axios.put(`${baseUrl}/clientes/${clienteActual._id}`, datosCliente);
        setListaClientes(listaClientes.map(cliente =>
          cliente._id === clienteActual._id ? response.data.data : cliente
        ));
        toast.success('Cliente actualizado correctamente');
      } else {
        response = await axios.post(`${baseUrl}/clientes`, datosCliente);
        setListaClientes([...listaClientes, response.data.data]);
        toast.success('Cliente registrado correctamente');
      }
      handleReset();
    } catch (error) {
      console.error('Error al procesar la solicitud:', error);
      toast.error('Error al guardar el cliente: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarCliente = async (clienteId) => {
    try {
      setLoading(true);
      await axios.delete(`${baseUrl}/clientes/${clienteId}`);
      setListaClientes(listaClientes.filter(cliente => cliente._id !== clienteId));
      toast.success('Cliente eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar el cliente:', error);
      toast.error('Error al eliminar el cliente: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setNombre('');
    setApellido('');
    setEmail('');
    setTelefono('');
    setCedula('');
    setClienteActual(null);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFiltroCedulaChange = (e) => {
    setFiltroCedula(e.target.value);
  };

  const handleSortByChange = (e) => {
    setSortBy(e.target.value);
  };

  const handleSortOrderChange = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const filteredAndSortedClientes = listaClientes
    .filter((cliente) =>
      (cliente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (cliente.apellido || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        cliente.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!filtroCedula || (filtroCedula === 'conCedula' ? cliente.cedula : !cliente.cedula))
    )
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'nombre') {
        comparison = a.nombre.localeCompare(b.nombre);
      } else if (sortBy === 'email') {
        comparison = a.email.localeCompare(b.email);
      } else if (sortBy === 'telefono') {
        comparison = a.telefono.localeCompare(b.telefono);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  return (
    <div className="clientes-container">
      <ToastContainer position="top-right" autoClose={3000} />
      <h2><FontAwesomeIcon icon={faUserPlus} /> Gestión de Clientes</h2>
      
      <div className="form-card">
        <h3>{clienteActual ? 'Editar Cliente' : 'Registrar Cliente'}</h3>
        <form onSubmit={handleFormSubmit} className="clientes-form">
          <div className="form-group">
            <label>Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ingrese el nombre"
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Apellido</label>
            <input
              type="text"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              placeholder="Ingrese el apellido"
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ingrese el email"
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Teléfono</label>
            <input
              type="text"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="Ingrese el teléfono"
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Cédula</label>
            <input
              type="text"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              placeholder="Ingrese la cédula"
              disabled={loading}
            />
          </div>
          <div className="form-buttons">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : (clienteActual ? 'Actualizar' : 'Registrar')}
            </button>
            <button type="button" className="btn-secondary" onClick={handleReset} disabled={loading}>
              <FontAwesomeIcon icon={faTimes} /> Cancelar
            </button>
          </div>
        </form>
      </div>

      <div className="clientes-lista">
        <h3>Lista de Clientes</h3>
        <div className="form-card">
          <div className="clientes-form">
            <div className="form-group">
              <label>Buscar Cliente</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Buscar por nombre, apellido o email..."
                  style={{ paddingLeft: '30px' }}
                  disabled={loading}
                />
                <FontAwesomeIcon
                  icon={faSearch}
                  style={{
                    position: 'absolute',
                    left: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#374151',
                  }}
                />
              </div>
            </div>
            <div className="form-group">
              <label>Filtrar por Cédula</label>
              <select value={filtroCedula} onChange={handleFiltroCedulaChange} disabled={loading}>
                <option value="">Todos</option>
                <option value="conCedula">Con Cédula</option>
                <option value="sinCedula">Sin Cédula</option>
              </select>
            </div>
            <div className="form-group">
              <label>Ordenar por</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select value={sortBy} onChange={handleSortByChange} disabled={loading}>
                  <option value="nombre">Nombre</option>
                  <option value="email">Email</option>
                  <option value="telefono">Teléfono</option>
                </select>
                <button
                  className="btn-primary"
                  onClick={handleSortOrderChange}
                  title={sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
                  style={{ padding: '12px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  disabled={loading}
                >
                  <FontAwesomeIcon icon={faSort} />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="table-container">
          {loading ? (
            <div className="empty-message">Cargando...</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th>Cédula</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedClientes.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-message">
                      {searchTerm || filtroCedula ? 'No hay clientes que coincidan con los filtros.' : 'No hay clientes registrados.'}
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedClientes.map((cliente) => (
                    <tr key={cliente._id}>
                      <td data-label="Nombre">{cliente.nombre}</td>
                      <td data-label="Apellido">{cliente.apellido || '-'}</td>
                      <td data-label="Email">{cliente.email}</td>
                      <td data-label="Teléfono">{cliente.telefono}</td>
                      <td data-label="Cédula">{cliente.cedula || '-'}</td>
                      <td data-label="Acciones">
                        <button
                          className="action-button modify-button"
                          onClick={() => handleEditarCliente(cliente._id)}
                          title="Editar"
                          disabled={loading}
                        >
                          <FontAwesomeIcon icon={faCog} />
                        </button>
                        <button
                          className="action-button delete-button"
                          onClick={() => handleEliminarCliente(cliente._id)}
                          title="Eliminar"
                          disabled={loading}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default GestionClientes;