import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faEdit, faUserTie, faSearch, faSort } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../css/FormularioTrabajador.css';

import baseUrl from '../config'; // Importa la URL base

const FormularioTrabajador = () => {
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [cedula, setCedula] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [cargo, setCargo] = useState('');
  const [fechaIngreso, setFechaIngreso] = useState('');
  const [salario, setSalario] = useState('');
  const [trabajadorActual, setTrabajadorActual] = useState(null);
  const [listaTrabajadores, setListaTrabajadores] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCargo, setFiltroCargo] = useState('');
  const [sortBy, setSortBy] = useState('nombre');
  const [sortOrder, setSortOrder] = useState('asc');

  const cargarTrabajadores = async () => {
    try {
      const respuesta = await axios.get(`${baseUrl}/trabajadores`);
      setListaTrabajadores(respuesta.data.data || []);
    } catch (error) {
      console.error('Error al obtener los trabajadores:', error);
      toast.error('Error al cargar los trabajadores.');
    }
  };

  useEffect(() => {
    cargarTrabajadores();
  }, []);

  const handleEditarTrabajador = (trabajadorId) => {
    const trabajadorParaEditar = listaTrabajadores.find(trabajador => trabajador._id === trabajadorId);
    if (trabajadorParaEditar) {
      setTrabajadorActual(trabajadorParaEditar);
      setNombre(trabajadorParaEditar.nombre);
      setApellido(trabajadorParaEditar.apellido || '');
      setCedula(trabajadorParaEditar.cedula || '');
      setEmail(trabajadorParaEditar.email);
      setTelefono(trabajadorParaEditar.telefono);
      setCargo(trabajadorParaEditar.cargo || '');
      setFechaIngreso(new Date(trabajadorParaEditar.fechaIngreso).toISOString().split('T')[0]);
      setSalario(trabajadorParaEditar.salario || '');
    }
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    const datosTrabajador = {
      nombre,
      apellido,
      cedula,
      email,
      telefono,
      cargo,
      fechaIngreso,
      salario: Number(salario),
    };

    try {
      let response;
      if (trabajadorActual) {
        response = await axios.put(`${baseUrl}/trabajadores/${trabajadorActual._id}`, datosTrabajador);
        setListaTrabajadores(listaTrabajadores.map(trabajador =>
          trabajador._id === trabajadorActual._id ? response.data.data : trabajador
        ));
        toast.success('Trabajador actualizado correctamente');
      } else {
        response = await axios.post(`${baseUrl}/trabajadores`, datosTrabajador);
        setListaTrabajadores([...listaTrabajadores, response.data.data]);
        toast.success('Trabajador registrado correctamente');
      }
      handleReset();
    } catch (error) {
      console.error('Error al procesar la solicitud:', error.response?.data || error.message);
      toast.error('Error al guardar el trabajador: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEliminarTrabajador = async (trabajadorId) => {
    try {
      await axios.delete(`${baseUrl}/trabajadores/${trabajadorId}`);
      setListaTrabajadores(listaTrabajadores.filter(trabajador => trabajador._id !== trabajadorId));
      toast.success('Trabajador eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar el trabajador:', error);
      toast.error('Error al eliminar el trabajador: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleReset = () => {
    setNombre('');
    setApellido('');
    setCedula('');
    setEmail('');
    setTelefono('');
    setCargo('');
    setFechaIngreso('');
    setSalario('');
    setTrabajadorActual(null);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFiltroCargoChange = (e) => {
    setFiltroCargo(e.target.value);
  };

  const handleSortByChange = (e) => {
    setSortBy(e.target.value);
  };

  const handleSortOrderChange = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  // Obtener cargos únicos para el filtro
  const cargosUnicos = [...new Set(listaTrabajadores.map(trabajador => trabajador.cargo).filter(Boolean))];

  // Filtrar y ordenar trabajadores
  const filteredAndSortedTrabajadores = listaTrabajadores
    .filter((trabajador) =>
      (trabajador.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (trabajador.apellido || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        trabajador.cargo.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!filtroCargo || trabajador.cargo === filtroCargo)
    )
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'nombre') {
        comparison = a.nombre.localeCompare(b.nombre);
      } else if (sortBy === 'salario') {
        comparison = (a.salario || 0) - (b.salario || 0);
      } else if (sortBy === 'fechaIngreso') {
        comparison = new Date(a.fechaIngreso) - new Date(b.fechaIngreso);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  return (
    <div className="trabajadores-container">
      <ToastContainer position="top-right" autoClose={3000} />
      <h2><FontAwesomeIcon icon={faUserTie} /> Gestión de Trabajadores</h2>
      
      <div className="form-card">
        <h3>{trabajadorActual ? 'Editar Trabajador' : 'Registrar Trabajador'}</h3>
        <form onSubmit={handleFormSubmit} className="trabajadores-form">
          <div className="form-group">
            <label>Nombre</label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ingrese el nombre"
              required
            />
          </div>
          <div className="form-group">
            <label>Apellido</label>
            <input
              type="text"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              placeholder="Ingrese el apellido"
              required
            />
          </div>
          <div className="form-group">
            <label>Cédula</label>
            <input
              type="text"
              value={cedula}
              onChange={(e) => setCedula(e.target.value)}
              placeholder="Ingrese la cédula"
              required
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
            />
          </div>
          <div className="form-group">
            <label>Cargo</label>
            <input
              type="text"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              placeholder="Ingrese el cargo"
              required
            />
          </div>
          <div className="form-group">
            <label>Fecha de Ingreso</label>
            <input
              type="date"
              value={fechaIngreso}
              onChange={(e) => setFechaIngreso(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Salario</label>
            <input
              type="number"
              value={salario}
              onChange={(e) => setSalario(e.target.value)}
              placeholder="Ingrese el salario"
              required
            />
          </div>
          <div className="form-buttons">
            <button type="submit" className="btn-primary">
              {trabajadorActual ? 'Actualizar' : 'Registrar'}
            </button>
            <button type="button" className="btn-secondary" onClick={handleReset}>
              Cancelar
            </button>
          </div>
        </form>
      </div>

      <div className="trabajadores-lista">
        <h3>Lista de Trabajadores</h3>
        <div className="form-card">
          <div className="trabajadores-form">
            <div className="form-group">
              <label>Buscar Trabajador</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Buscar por nombre o cargo..."
                  style={{ paddingLeft: '30px' }}
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
              <label>Filtrar por Cargo</label>
              <select value={filtroCargo} onChange={handleFiltroCargoChange}>
                <option value="">Todos los cargos</option>
                {cargosUnicos.map((cargo) => (
                  <option key={cargo} value={cargo}>
                    {cargo}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Ordenar por</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select value={sortBy} onChange={handleSortByChange}>
                  <option value="nombre">Nombre</option>
                  <option value="salario">Salario</option>
                  <option value="fechaIngreso">Fecha de Ingreso</option>
                </select>
                <button
                  className="btn-primary"
                  onClick={handleSortOrderChange}
                  title={sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
                  style={{ padding: '12px', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <FontAwesomeIcon icon={faSort} />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Apellido</th>
                <th>Cédula</th>
                <th>Email</th>
                <th>Teléfono</th>
                <th>Cargo</th>
                <th>Fecha de Ingreso</th>
                <th>Salario</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedTrabajadores.length === 0 ? (
                <tr>
                  <td colSpan="9">No hay trabajadores que coincidan con los filtros.</td>
                </tr>
              ) : (
                filteredAndSortedTrabajadores.map((trabajador) => (
                  <tr key={trabajador._id}>
                    <td data-label="Nombre">{trabajador.nombre}</td>
                    <td data-label="Apellido">{trabajador.apellido || '-'}</td>
                    <td data-label="Cédula">{trabajador.cedula || '-'}</td>
                    <td data-label="Email">{trabajador.email}</td>
                    <td data-label="Teléfono">{trabajador.telefono}</td>
                    <td data-label="Cargo">{trabajador.cargo || '-'}</td>
                    <td data-label="Fecha de Ingreso">{new Date(trabajador.fechaIngreso).toLocaleDateString()}</td>
                    <td data-label="Salario">{trabajador.salario || '-'}</td>
                    <td data-label="Acciones">
                      <button
                        className="action-button modify-button"
                        onClick={() => handleEditarTrabajador(trabajador._id)}
                        title="Editar"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        className="action-button delete-button"
                        onClick={() => handleEliminarTrabajador(trabajador._id)}
                        title="Eliminar"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FormularioTrabajador;