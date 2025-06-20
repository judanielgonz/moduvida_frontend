import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTruck, 
  faEdit, 
  faTrash, 
  faPlus, 
  faTimes, 
  faSearch, 
  faSort,
  faCheckCircle 
} from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../css/Recibimientos.css';

import baseUrl from '../config'; // Importa la URL base

const Recibimientos = () => {
  const [recibimientos, setRecibimientos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [ordenes, setOrdenes] = useState([]);
  const [materialesOrden, setMaterialesOrden] = useState([]);
  const [formulario, setFormulario] = useState({
    ordenCompra: '',
    proveedor: '',
    fechaRecibimiento: '',
    detalles: [],
    _id: null,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('fecha');
  const [sortOrder, setSortOrder] = useState('desc');
  const [error, setError] = useState(null);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [recibimientosRes, proveedoresRes, ordenesRes] = await Promise.all([
          axios.get(`${baseUrl}/recibimientos?_=${Date.now()}`),
          axios.get(`${baseUrl}/proveedores?_=${Date.now()}`),
          axios.get(`${baseUrl}/ordenes?_=${Date.now()}`),
        ]);
        console.log('Recibimientos recibidos:', recibimientosRes.data.data); // Depuración
        console.log('Proveedores recibidos:', proveedoresRes.data.data); // Depuración
        console.log('Órdenes recibidas:', ordenesRes.data.data); // Depuración
        setRecibimientos(recibimientosRes.data.data || []);
        setProveedores(proveedoresRes.data.data || []);
        const loadedOrdenes = ordenesRes.data.data?.filter(orden => orden.estado !== 'Recibida') || [];
        setOrdenes(loadedOrdenes);
        console.log('Órdenes cargadas:', loadedOrdenes); // Depuración
      } catch (error) {
        console.error('Error al cargar datos:', error);
        setError('No se pudieron cargar los datos. Por favor, verifica el backend.');
        toast.error('Error al cargar datos: ' + (error.response?.data?.message || error.message));
      }
    };
    cargarDatos();
  }, []);

  const cargarMaterialesDeOrden = (ordenId) => {
    if (!ordenId) {
      setMaterialesOrden([]);
      setFormulario(prev => ({ ...prev, detalles: [], proveedor: '' }));
      return;
    }
    const ordenSeleccionada = ordenes.find(o => o._id === ordenId);
    if (ordenSeleccionada) {
      console.log('Orden seleccionada:', ordenSeleccionada); // Depuración
      const detalles = ordenSeleccionada.detalles || [];
      setMaterialesOrden(detalles);
      setFormulario(prev => ({
        ...prev,
        proveedor: ordenSeleccionada.proveedor?._id || ordenSeleccionada.proveedor || '',
        detalles: detalles.length > 0 ? detalles.map(d => ({
          material: d.nombre || '',
          cantidad: d.cantidad || 0,
          precioUnitario: d.precioUnitario || 0,
          unidadMedida: d.unidadMedida || 'unidad',
        })) : [{ material: '', cantidad: 1, precioUnitario: 0, unidadMedida: 'unidad' }],
      }));
    } else {
      console.log('Orden no encontrada:', ordenId); // Depuración
      setMaterialesOrden([]);
      setFormulario(prev => ({
        ...prev,
        detalles: [{ material: '', cantidad: 1, precioUnitario: 0, unidadMedida: 'unidad' }],
        proveedor: ''
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormulario({ ...formulario, [name]: value });
    if (name === 'ordenCompra') {
      cargarMaterialesDeOrden(value);
    }
  };

  const handleDetalleChange = (index, e) => {
    const { name, value } = e.target;
    const detalles = [...formulario.detalles];
    detalles[index] = { 
      ...detalles[index], 
      [name]: name === 'cantidad' ? Number(value) : value 
    };
    setFormulario({ ...formulario, detalles });
  };

  const agregarDetalle = () => {
    setFormulario({
      ...formulario,
      detalles: [...formulario.detalles, { material: '', cantidad: 1, precioUnitario: 0, unidadMedida: 'unidad' }],
    });
  };

  const eliminarDetalle = (index) => {
    const detalles = [...formulario.detalles];
    detalles.splice(index, 1);
    setFormulario({ ...formulario, detalles });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formulario.ordenCompra) {
      toast.error('Por favor, seleccione una orden de compra.');
      return;
    }
    if (formulario.detalles.length === 0 || formulario.detalles.some(d => !d.material || d.cantidad <= 0)) {
      toast.error('Por favor, agregue al menos un material válido con cantidad mayor a 0.');
      return;
    }
    try {
      const payload = {
        ordenCompra: formulario.ordenCompra,
        materialesRecibidos: formulario.detalles.map(detalle => ({
          nombre: detalle.material,
          cantidad: Number(detalle.cantidad),
          precioUnitario: Number(detalle.precioUnitario),
          unidadMedida: detalle.unidadMedida,
        })),
        fechaRecibimiento: formulario.fechaRecibimiento,
      };
      if (formulario._id) {
        await axios.put(`${baseUrl}/recibimientos/${formulario._id}`, payload);
        toast.success('Recibimiento actualizado correctamente');
      } else {
        await axios.post(`${baseUrl}/recibimientos`, payload);
        toast.success('Recibimiento creado correctamente');
      }
      const [recibimientosRes, ordenesRes] = await Promise.all([
        axios.get(`${baseUrl}/recibimientos?_=${Date.now()}`),
        axios.get(`${baseUrl}/ordenes?_=${Date.now()}`),
      ]);
      console.log('Recibimientos después de guardar:', recibimientosRes.data.data); // Depuración
      console.log('Órdenes después de guardar:', ordenesRes.data.data); // Depuración
      setRecibimientos(recibimientosRes.data.data || []);
      setOrdenes(ordenesRes.data.data?.filter(orden => orden.estado !== 'Recibida') || []);
      handleReset();
    } catch (error) {
      console.error('Error al guardar el recibimiento:', error);
      setError('Error al guardar el recibimiento: ' + (error.response?.data?.message || error.message));
      toast.error('Error al guardar el recibimiento: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleConfirmar = async (recibimientoId, ordenCompraId) => {
    try {
      await axios.post(`${baseUrl}/recibimientos/${recibimientoId}/confirmar`);
      const [recibimientosRes, ordenesRes] = await Promise.all([
        axios.get(`${baseUrl}/recibimientos?_=${Date.now()}`),
        axios.get(`${baseUrl}/ordenes?_=${Date.now()}`),
      ]);
      console.log('Recibimientos después de confirmar:', recibimientosRes.data.data); // Depuración
      console.log('Órdenes después de confirmar:', ordenesRes.data.data); // Depuración
      setRecibimientos(recibimientosRes.data.data || []);
      setOrdenes(ordenesRes.data.data?.filter(orden => orden.estado !== 'Recibida') || []);
      toast.success('Recibimiento confirmado y orden de compra marcada como recibida');
    } catch (error) {
      console.error('Error al confirmar el recibimiento:', error);
      setError('Error al confirmar el recibimiento: ' + (error.response?.data?.message || error.message));
      toast.error('Error al confirmar el recibimiento: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEliminar = async (recibimientoId) => {
    try {
      await axios.delete(`${baseUrl}/recibimientos/${recibimientoId}`);
      setRecibimientos(recibimientos.filter(r => r._id !== recibimientoId));
      toast.success('Recibimiento eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar el recibimiento:', error);
      setError('Error al eliminar el recibimiento: ' + (error.response?.data?.message || error.message));
      toast.error('Error al eliminar el recibimiento: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleModificar = (recibimiento) => {
    setFormulario({
      ordenCompra: recibimiento.ordenCompra?._id || recibimiento.ordenCompra || '',
      proveedor: recibimiento.ordenCompra?.proveedor?._id || recibimiento.ordenCompra?.proveedor || '',
      fechaRecibimiento: new Date(recibimiento.fechaRecibimiento).toISOString().split('T')[0],
      detalles: (recibimiento.materialesRecibidos || []).map(d => ({
        material: d.nombre || '',
        cantidad: d.cantidad || 0,
        precioUnitario: d.precioUnitario || 0,
        unidadMedida: d.unidadMedida || 'unidad',
      })),
      _id: recibimiento._id,
    });
    cargarMaterialesDeOrden(recibimiento.ordenCompra?._id || recibimiento.ordenCompra);
  };

  const handleReset = () => {
    setFormulario({
      ordenCompra: '',
      proveedor: '',
      fechaRecibimiento: '',
      detalles: [],
      _id: null,
    });
    setMaterialesOrden([]);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSortByChange = (e) => {
    setSortBy(e.target.value);
  };

  const handleSortOrderChange = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const filteredAndSortedRecibimientos = recibimientos
    .filter((recibimiento) =>
      (recibimiento?.ordenCompra?.proveedor?.nombre || 'Desconocido').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'proveedor') {
        const nombreA = a?.ordenCompra?.proveedor?.nombre || 'Desconocido';
        const nombreB = b?.ordenCompra?.proveedor?.nombre || 'Desconocido';
        comparison = nombreA.localeCompare(nombreB);
      } else if (sortBy === 'fecha') {
        comparison = new Date(a?.fechaRecibimiento || 0) - new Date(b?.fechaRecibimiento || 0);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  if (error) {
    return (
      <div className="recibimientos-container">
        <header className="recibimientos-header">
          <h2>
            <FontAwesomeIcon icon={faTruck} /> Gestión de Recibimientos
          </h2>
        </header>
        <div style={{ color: 'red', textAlign: 'center' }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="recibimientos-container">
      <ToastContainer position="top-right" autoClose={3000} />
      <header className="recibimientos-header">
        <h2>
          <FontAwesomeIcon icon={faTruck} /> Gestión de Recibimientos
        </h2>
      </header>

      <section className="form-section">
        <div className="form-card">
          <h3>
            <FontAwesomeIcon icon={faPlus} /> {formulario._id ? 'Editar Recibimiento' : 'Crear Recibimiento'}
          </h3>
          <form onSubmit={handleSubmit} className="recibimientos-form">
            <div className="form-group">
              <label htmlFor="ordenCompra">Orden de Compra</label>
              <select
                id="ordenCompra"
                name="ordenCompra"
                value={formulario.ordenCompra}
                onChange={handleChange}
                required
              >
                <option value="">Seleccione una orden de compra</option>
                {ordenes.map((orden) => (
                  <option key={orden?._id || ''} value={orden?._id || ''}>
                    {orden?._id ? `Orden #${orden._id.slice(-4)} - ${orden?.proveedor?.nombre || 'Desconocido'} (${new Date(orden?.fecha).toLocaleDateString('es-VE')})` : 'Orden Desconocida'}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="proveedor">Proveedor</label>
              <select
                id="proveedor"
                name="proveedor"
                value={formulario.proveedor}
                onChange={handleChange}
                disabled
              >
                <option value="">Seleccione un proveedor</option>
                {proveedores.map((proveedor) => (
                  <option key={proveedor?._id || ''} value={proveedor?._id || ''}>
                    {proveedor?.nombre || 'Desconocido'}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="fechaRecibimiento">Fecha de Recibimiento</label>
              <input
                id="fechaRecibimiento"
                type="date"
                name="fechaRecibimiento"
                value={formulario.fechaRecibimiento}
                onChange={handleChange}
                required
              />
            </div>
            <div className="materiales-section">
              <h4>Detalles del Recibimiento</h4>
              {formulario.detalles.length === 0 ? (
                <p>No hay materiales para mostrar. Agrega uno nuevo.</p>
              ) : (
                formulario.detalles.map((detalle, index) => (
                  <div className="material-row" key={index}>
                    <div className="form-group">
                      <label htmlFor={`material-${index}`}>Material</label>
                      <select
                        id={`material-${index}`}
                        name="material"
                        value={detalle.material}
                        onChange={(e) => handleDetalleChange(index, e)}
                        required
                      >
                        <option value="">Seleccione un material</option>
                        {materialesOrden.map((material, idx) => (
                          <option key={idx} value={material?.nombre || ''}>
                            {material?.nombre || 'Material Desconocido'}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label htmlFor={`cantidad-${index}`}>Cantidad Recibida</label>
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
                    <div className="form-group">
                      <label htmlFor={`precioUnitario-${index}`}>Precio Unitario</label>
                      <input
                        id={`precioUnitario-${index}`}
                        type="number"
                        name="precioUnitario"
                        value={detalle.precioUnitario}
                        onChange={(e) => handleDetalleChange(index, e)}
                        required
                        step="0.01"
                        disabled
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor={`unidadMedida-${index}`}>Unidad de Medida</label>
                      <input
                        id={`unidadMedida-${index}`}
                        type="text"
                        name="unidadMedida"
                        value={detalle.unidadMedida}
                        onChange={(e) => handleDetalleChange(index, e)}
                        required
                        disabled
                      />
                    </div>
                    <button
                      type="button"
                      className="btn-delete-material"
                      onClick={() => eliminarDetalle(index)}
                      title="Eliminar detalle"
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                ))
              )}
              <button
                type="button"
                className="btn-add-material"
                onClick={agregarDetalle}
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

      <section className="recibimientos-lista">
        <div className="recibimientos-lista-header">
          <h3>Lista de Recibimientos</h3>
        </div>
        <div className="filters-card">
          <div className="recibimientos-form">
            <div className="form-group">
              <label htmlFor="search">Buscar Recibimiento</label>
              <div className="search-wrapper">
                <input
                  id="search"
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Buscar por proveedor..."
                />
                <FontAwesomeIcon icon={faSearch} className="search-icon" />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="sortBy">Ordenar por</label>
              <div className="sort-wrapper">
                <select id="sortBy" value={sortBy} onChange={handleSortByChange}>
                  <option value="proveedor">Proveedor</option>
                  <option value="fecha">Fecha</option>
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
                  <th className="col-orden">Orden de Compra</th>
                  <th className="col-materiales">Materiales (Cantidad)</th>
                  <th className="col-acciones">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedRecibimientos.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-message">
                      {searchTerm ? 'No hay recibimientos que coincidan con la búsqueda.' : 'No hay recibimientos registrados.'}
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedRecibimientos.map((recibimiento, index) => (
                    <tr key={recibimiento?._id || index} className={index % 2 === 0 ? 'row-even' : 'row-odd'}>
                      <td data-label="Proveedor" className="col-proveedor">
                        {recibimiento?.ordenCompra?.proveedor?.nombre || 
                         (recibimiento?.ordenCompra?.proveedor ? `Proveedor no encontrado (ID: ${recibimiento.ordenCompra.proveedor})` : 'Desconocido')}
                      </td>
                      <td data-label="Fecha" className="col-fecha">{recibimiento?.fechaRecibimiento ? new Date(recibimiento.fechaRecibimiento).toLocaleDateString('es-VE') : 'N/A'}</td>
                      <td data-label="Orden de Compra" className="col-orden">{recibimiento?.ordenCompra?._id?.slice(-4) || 'N/A'}</td>
                      <td data-label="Materiales (Cantidad)" className="col-materiales">
                        {(recibimiento?.materialesRecibidos || []).map((detalle, idx) => (
                          <div key={idx}>
                            {detalle?.nombre || 'N/A'} ({detalle?.cantidad || 0} {detalle?.unidadMedida || 'unidad'})
                          </div>
                        ))}
                      </td>
                      <td data-label="Acciones" className="actions-cell col-acciones">
                        <button
                          className="action-button edit-button"
                          onClick={() => handleModificar(recibimiento)}
                          title="Editar"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          className="action-button delete-button"
                          onClick={() => handleEliminar(recibimiento?._id)}
                          title="Eliminar"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                        <button
                          className="action-button confirm-button"
                          onClick={() => handleConfirmar(recibimiento._id, recibimiento.ordenCompra?._id)}
                          title="Confirmar Recibimiento"
                          disabled={recibimiento.estado === 'Recibido' || recibimiento.ordenCompra?.estado === 'Recibida'}
                        >
                          <FontAwesomeIcon icon={faCheckCircle} />
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

export default Recibimientos;