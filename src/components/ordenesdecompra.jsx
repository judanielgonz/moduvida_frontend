// src/components/OrdenesCompra.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEdit, 
  faTrash, 
  faClipboardList, 
  faPlus, 
  faTimes, 
  faSearch, 
  faSort 
} from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../css/OrdenesCompra.css';

import baseUrl from '../config'; // Importa la URL base

const OrdenesCompra = () => {
  const [ordenes, setOrdenes] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [materialesFiltrados, setMaterialesFiltrados] = useState([]);
  const [formulario, setFormulario] = useState({
    proveedor: '',
    fecha: '',
    estado: 'Pendiente',
    detalles: [],
    _id: null,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [sortBy, setSortBy] = useState('fecha');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [ordenesRes, proveedoresRes] = await Promise.all([
          axios.get(`${baseUrl}/ordenes`),
          axios.get(`${baseUrl}/proveedores`),
        ]);
        setOrdenes(ordenesRes.data.data || []);
        setProveedores(proveedoresRes.data.data || []);
      } catch (error) {
        console.error('Error al cargar datos:', error);
        toast.error('Error al cargar datos: ' + (error.response?.data?.message || error.message));
      }
    };
    cargarDatos();
  }, []);

  const filtrarMaterialesPorProveedor = (proveedorId) => {
    if (!proveedorId) {
      setMaterialesFiltrados([]);
      return;
    }
    const proveedor = proveedores.find(p => p._id === proveedorId);
    setMaterialesFiltrados(proveedor?.catalogo || []);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormulario({ ...formulario, [name]: value });
    if (name === 'proveedor') {
      filtrarMaterialesPorProveedor(value);
      setFormulario(prev => ({ ...prev, detalles: [] }));
    }
  };

  const handleDetalleChange = (index, e) => {
    const { name, value } = e.target;
    const detalles = [...formulario.detalles];
    if (name === 'nombre') {
      const materialSeleccionado = materialesFiltrados.find(m => m.nombre === value);
      detalles[index] = {
        ...detalles[index],
        nombre: value,
        precioUnitario: materialSeleccionado?.precio || 0,
        unidadMedida: materialSeleccionado?.unidadMedida || 'unidad',
      };
    } else {
      detalles[index] = {
        ...detalles[index],
        [name]: name === 'cantidad' ? Number(value) || 0 : value,
      };
    }
    setFormulario({ ...formulario, detalles });
  };

  const agregarDetalle = () => {
    setFormulario({
      ...formulario,
      detalles: [...formulario.detalles, { nombre: '', cantidad: 1, precioUnitario: 0, unidadMedida: 'unidad' }],
    });
  };

  const eliminarDetalle = (index) => {
    const detalles = [...formulario.detalles];
    detalles.splice(index, 1);
    setFormulario({ ...formulario, detalles });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formulario.detalles.length === 0 || formulario.detalles.some(d => !d.nombre || d.cantidad <= 0)) {
      toast.error('Por favor, agregue al menos un material válido con cantidad mayor a 0.');
      return;
    }
    try {
      const payload = {
        proveedor: formulario.proveedor,
        fecha: formulario.fecha,
        estado: formulario.estado,
        detalles: formulario.detalles.map(detalle => ({
          nombre: detalle.nombre,
          cantidad: detalle.cantidad,
          precioUnitario: detalle.precioUnitario,
          unidadMedida: detalle.unidadMedida,
        })),
      };
      if (formulario._id) {
        await axios.put(`${baseUrl}/ordenes/${formulario._id}`, payload);
        toast.success('Orden actualizada correctamente');
      } else {
        await axios.post(`${baseUrl}/ordenes`, payload);
        toast.success('Orden creada correctamente');
      }
      const respuesta = await axios.get(`${baseUrl}/ordenes`);
      setOrdenes(respuesta.data.data || []);
      handleReset();
    } catch (error) {
      console.error('Error al guardar la orden:', error);
      toast.error('Error al guardar la orden: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEliminar = async (ordenId) => {
    try {
      await axios.delete(`${baseUrl}/ordenes/${ordenId}`);
      setOrdenes(ordenes.filter((orden) => orden._id !== ordenId));
      toast.success('Orden eliminada correctamente');
    } catch (error) {
      console.error('Error al eliminar la orden:', error);
      toast.error('Error al eliminar la orden: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleModificar = (orden) => {
    setFormulario({
      proveedor: orden.proveedor?._id || orden.proveedor || '',
      fecha: new Date(orden.fecha).toISOString().split('T')[0],
      estado: orden.estado,
      detalles: orden.detalles.map((detalle) => ({
        nombre: detalle.nombre,
        cantidad: detalle.cantidad,
        precioUnitario: detalle.precioUnitario,
        unidadMedida: detalle.unidadMedida,
      })),
      _id: orden._id,
    });
    filtrarMaterialesPorProveedor(orden.proveedor?._id || orden.proveedor);
  };

  const handleReset = () => {
    setFormulario({
      proveedor: '',
      fecha: '',
      estado: 'Pendiente',
      detalles: [],
      _id: null,
    });
    setMaterialesFiltrados([]);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFiltroEstadoChange = (e) => {
    setFiltroEstado(e.target.value);
  };

  const handleSortByChange = (e) => {
    setSortBy(e.target.value);
  };

  const handleSortOrderChange = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const filteredAndSortedOrdenes = ordenes
    .filter((orden) =>
      (orden.proveedor?.nombre || 'Desconocido').toLowerCase().includes(searchTerm.toLowerCase()) ||
      orden.estado.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .filter((orden) => !filtroEstado || orden.estado === filtroEstado)
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'proveedor') {
        const nombreA = a.proveedor?.nombre || 'Desconocido';
        const nombreB = b.proveedor?.nombre || 'Desconocido';
        comparison = nombreA.localeCompare(nombreB);
      } else if (sortBy === 'fecha') {
        comparison = new Date(a.fecha) - new Date(b.fecha);
      } else if (sortBy === 'precioTotal') {
        comparison = (a.detalles.reduce((sum, d) => sum + (d.cantidad * d.precioUnitario), 0) || 0) -
                     (b.detalles.reduce((sum, d) => sum + (d.cantidad * d.precioUnitario), 0) || 0);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  return (
    <div className="ordenes-container">
      <ToastContainer position="top-right" autoClose={3000} />
      <header className="ordenes-header">
        <h2>
          <FontAwesomeIcon icon={faClipboardList} /> Gestión de Órdenes de Compra
        </h2>
      </header>

      <section className="form-section">
        <div className="form-card">
          <h3>
            <FontAwesomeIcon icon={faPlus} /> {formulario._id ? 'Editar Orden de Compra' : 'Crear Orden de Compra'}
          </h3>
          <form onSubmit={handleSubmit} className="ordenes-form">
            <div className="form-group">
              <label htmlFor="proveedor">Proveedor</label>
              <select
                id="proveedor"
                name="proveedor"
                value={formulario.proveedor}
                onChange={handleChange}
                required
              >
                <option value="">Seleccione un proveedor</option>
                {proveedores.map((proveedor) => (
                  <option key={proveedor._id} value={proveedor._id}>
                    {proveedor.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="fecha">Fecha</label>
              <input
                id="fecha"
                type="date"
                name="fecha"
                value={formulario.fecha}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="estado">Estado</label>
              <select
                id="estado"
                name="estado"
                value={formulario.estado}
                onChange={handleChange}
                required
              >
                <option value="Pendiente">Pendiente</option>
                <option value="En proceso">En proceso</option>
                <option value="Recibida">Recibida</option>
              </select>
            </div>
            <div className="detalles-section">
              <h4>Detalles de la Orden</h4>
              {formulario.detalles.map((detalle, index) => (
                <div className="detalle-row" key={index}>
                  <div className="form-group">
                    <label htmlFor={`nombre-${index}`}>Material</label>
                    <select
                      id={`nombre-${index}`}
                      name="nombre"
                      value={detalle.nombre}
                      onChange={(e) => handleDetalleChange(index, e)}
                      required
                      disabled={!formulario.proveedor}
                    >
                      <option value="">Seleccione un material</option>
                      {materialesFiltrados.map((material) => (
                        <option key={material.nombre} value={material.nombre}>
                          {material.nombre} (${material.precio.toLocaleString('es-VE')})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor={`cantidad-${index}`}>Cantidad</label>
                    <input
                      id={`cantidad-${index}`}
                      type="number"
                      name="cantidad"
                      value={detalle.cantidad}
                      onChange={(e) => handleDetalleChange(index, e)}
                      required
                      min="1"
                    />
                  </div>
                  <button
                    type="button"
                    className="btn-delete-detalle"
                    onClick={() => eliminarDetalle(index)}
                    title="Eliminar detalle"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn-add-detalle"
                onClick={agregarDetalle}
                disabled={!formulario.proveedor}
              >
                <FontAwesomeIcon icon={faPlus} /> Agregar Material
              </button>
            </div>
            <div className="form-buttons">
              <button type="submit" className="btn-primary">
                {formulario._id ? 'Actualizar' : 'Crear'}
              </button>
              <button type="button" className="btn-secondary" onClick={handleReset}>
                <FontAwesomeIcon icon={faTimes} /> Cancelar
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="ordenes-lista">
        <div className="ordenes-lista-header">
          <h3>Lista de Órdenes</h3>
        </div>
        <div className="filters-card">
          <div className="ordenes-form">
            <div className="form-group">
              <label htmlFor="search">Buscar Orden</label>
              <div className="search-wrapper">
                <input
                  id="search"
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Buscar por proveedor o estado..."
                />
                <FontAwesomeIcon icon={faSearch} className="search-icon" />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="filtroEstado">Filtrar por Estado</label>
              <select id="filtroEstado" value={filtroEstado} onChange={handleFiltroEstadoChange}>
                <option value="">Todos los estados</option>
                <option value="Pendiente">Pendiente</option>
                <option value="En proceso">En proceso</option>
                <option value="Recibida">Recibida</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="sortBy">Ordenar por</label>
              <div className="sort-wrapper">
                <select id="sortBy" value={sortBy} onChange={handleSortByChange}>
                  <option value="proveedor">Proveedor</option>
                  <option value="fecha">Fecha</option>
                  <option value="precioTotal">Precio Total</option>
                </select>
                <button
                  className="btn-sort"
                  onClick={handleSortOrderChange}
                  title={sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
                >
                  <FontAwesomeIcon icon={faSort} />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="table-card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th className="col-proveedor">Proveedor</th>
                  <th className="col-fecha">Fecha</th>
                  <th className="col-estado">Estado</th>
                  <th className="col-materiales">Materiales (Cantidad)</th>
                  <th className="col-precio-total">Precio Total</th>
                  <th className="col-acciones">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedOrdenes.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-message">
                      {searchTerm || filtroEstado ? 'No hay órdenes que coincidan con los filtros.' : 'No hay órdenes registradas.'}
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedOrdenes.map((orden, index) => (
                    <tr key={orden._id} className={index % 2 === 0 ? 'row-even' : 'row-odd'}>
                      <td data-label="Proveedor" className="col-proveedor">{orden.proveedor?.nombre || 'Desconocido'}</td>
                      <td data-label="Fecha" className="col-fecha">{new Date(orden.fecha).toLocaleDateString('es-VE')}</td>
                      <td data-label="Estado" className="col-estado">{orden.estado}</td>
                      <td data-label="Materiales (Cantidad)" className="col-materiales">
                        {orden.detalles.map((detalle, idx) => (
                          <div key={idx}>
                            {detalle.nombre} ({detalle.cantidad} {detalle.unidadMedida})
                          </div>
                        ))}
                      </td>
                      <td data-label="Precio Total" className="col-precio-total">
                        ${orden.detalles.reduce((sum, d) => sum + (d.cantidad * d.precioUnitario), 0).toLocaleString('es-VE')}
                      </td>
                      <td data-label="Acciones" className="actions-cell col-acciones">
                        <button
                          className="action-button edit-button"
                          onClick={() => handleModificar(orden)}
                          title="Editar"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          className="action-button delete-button"
                          onClick={() => handleEliminar(orden._id)}
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
      </section>
    </div>
  );
};

export default OrdenesCompra;