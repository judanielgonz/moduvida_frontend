import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faBox, faSearch, faSort, faTimes, faPlus, faUndo } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../css/Stock.css';

import baseUrl from '../config'; // Importa la URL base

const Stock = () => {
  const [stock, setStock] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [transaccion, setTransaccion] = useState({
    itemId: '',
    tipoTransaccion: 'Entrada',
    cantidad: '',
    nota: '',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [sortBy, setSortBy] = useState('nombre');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [stockResponse, modelosResponse] = await Promise.all([
          axios.get(`${baseUrl}/stock`),
          axios.get(`${baseUrl}/modelos`),
        ]);
        const stockData = stockResponse.data.data || [];
        const modelosData = modelosResponse.data.data || [];

        setStock(stockData);
        setModelos(modelosData);

        if (modelosData.length === 0) {
          toast.error('No hay modelos registrados. Crea uno primero.');
        } else if (stockData.length === 0) {
          toast.warn('No hay stock registrado. Agrega producción o confirma una orden de compra.');
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
        toast.error('Error al cargar stock o modelos. Verifica el servidor.');
      }
    };
    cargarDatos();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTransaccion({ ...transaccion, [name]: value });
  };

  const handleTransaccionSubmit = async (e) => {
    e.preventDefault();
    const { itemId, tipoTransaccion, cantidad, nota } = transaccion;

    if (!itemId) {
      toast.error('Por favor selecciona un modelo.');
      return;
    }
    if (!cantidad || Number(cantidad) < 1) {
      toast.error('La cantidad debe ser mayor a 0.');
      return;
    }

    if (tipoTransaccion === 'Salida') {
      const stockItem = stock.find(item => item.modelo?._id === itemId);
      if (!stockItem || stockItem.cantidadDisponible < Number(cantidad)) {
        toast.error('No hay suficiente stock disponible para esta salida.');
        return;
      }
    }

    const datosTransaccion = {
      modelo: itemId,
      tipoTransaccion,
      cantidad: Number(cantidad),
      nota: nota || '',
    };

    try {
      await axios.post(`${baseUrl}/stock/transacciones`, datosTransaccion);
      const stockResponse = await axios.get(`${baseUrl}/stock`);
      setStock(stockResponse.data.data || []);
      toast.success('Transacción realizada correctamente');
      setTransaccion({ itemId: '', tipoTransaccion: 'Entrada', cantidad: '', nota: '' });
    } catch (error) {
      console.error('Error al crear la transacción:', error);
      toast.error(`Error al crear la transacción: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleEliminarStock = async (id) => {
    try {
      await axios.delete(`${baseUrl}/stock/${id}`);
      const stockResponse = await axios.get(`${baseUrl}/stock`);
      setStock(stockResponse.data.data || []);
      toast.success('Stock eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar el stock:', error);
      toast.error('Error al eliminar el stock: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleReset = () => {
    setTransaccion({
      itemId: '',
      tipoTransaccion: 'Entrada',
      cantidad: '',
      nota: '',
    });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFiltroTipoChange = (e) => {
    setFiltroTipo(e.target.value);
  };

  const handleSortByChange = (e) => {
    setSortBy(e.target.value);
  };

  const handleSortOrderChange = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFiltroTipo('');
    setSortBy('nombre');
    setSortOrder('asc');
  };

  const filteredAndSortedStock = stock
    .filter((item) =>
      ((item.modelo?.nombre || item.material?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.modelo?.descripcion || '').toLowerCase().includes(searchTerm.toLowerCase())) &&
      (!filtroTipo || (item.modelo ? 'Modelo' : item.material?.nombre ? 'Material' : '-') === filtroTipo)
    )
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'nombre') {
        const nombreA = a.modelo?.nombre || a.material?.nombre || '';
        const nombreB = b.modelo?.nombre || b.material?.nombre || '';
        comparison = nombreA.localeCompare(nombreB);
      } else if (sortBy === 'precioVenta') {
        const precioA = a.modelo?.precioVenta || 0;
        const precioB = b.modelo?.precioVenta || 0;
        comparison = precioA - precioB;
      } else if (sortBy === 'cantidadDisponible') {
        comparison = (a.cantidadDisponible || 0) - (b.cantidadDisponible || 0);
      } else if (sortBy === 'costoProduccion') {
        comparison = (a.modelo?.costoProduccion || 0) - (b.modelo?.costoProduccion || 0);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  return (
    <div className="stock-container">
      <ToastContainer position="top-right" autoClose={3000} />
      <header className="stock-header">
        <h2>
          <FontAwesomeIcon icon={faBox} /> Gestión de Stock
        </h2>
      </header>

      <section className="transaction-section">
        <div className="form-card">
          <h3>
            <FontAwesomeIcon icon={faPlus} /> Nueva Transacción
          </h3>
          <form onSubmit={handleTransaccionSubmit} className="transaccion-form">
            <div className="form-group">
              <label htmlFor="itemId">Modelo</label>
              <select
                id="itemId"
                name="itemId"
                value={transaccion.itemId}
                onChange={handleInputChange}
                required
              >
                <option value="">Seleccione un modelo</option>
                {modelos.map((modelo) => (
                  <option key={modelo._id} value={modelo._id}>
                    {modelo.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="tipoTransaccion">Tipo de Transacción</label>
              <select
                id="tipoTransaccion"
                name="tipoTransaccion"
                value={transaccion.tipoTransaccion}
                onChange={handleInputChange}
                required
              >
                <option value="Entrada">Entrada (Producción)</option>
                <option value="Salida">Salida (Venta)</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="cantidad">Cantidad</label>
              <input
                id="cantidad"
                type="number"
                name="cantidad"
                value={transaccion.cantidad}
                onChange={handleInputChange}
                placeholder="Ingrese la cantidad"
                required
                min="1"
              />
            </div>
            <div className="form-group">
              <label htmlFor="nota">Nota (opcional)</label>
              <input
                id="nota"
                type="text"
                name="nota"
                value={transaccion.nota}
                onChange={handleInputChange}
                placeholder="Ingrese una nota (opcional)"
              />
            </div>
            <div className="form-buttons">
              <button type="submit" className="btn-primary">
                <FontAwesomeIcon icon={faPlus} /> Realizar Transacción
              </button>
              <button type="button" className="btn-secondary" onClick={handleReset}>
                <FontAwesomeIcon icon={faUndo} /> Cancelar
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="stock-lista">
        <div className="stock-lista-header">
          <h3>Lista de Stock</h3>
        </div>
        <div className="filters-card">
          <div className="stock-form">
            <div className="form-group">
              <label htmlFor="search">Buscar Stock</label>
              <div className="search-wrapper">
                <input
                  id="search"
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Buscar por nombre o descripción..."
                />
                <FontAwesomeIcon icon={faSearch} className="search-icon" />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="filtroTipo">Filtrar por Tipo</label>
              <select id="filtroTipo" value={filtroTipo} onChange={handleFiltroTipoChange}>
                <option value="">Todos los tipos</option>
                <option value="Modelo">Modelo</option>
                <option value="Material">Material</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="sortBy">Ordenar por</label>
              <div className="sort-wrapper">
                <select id="sortBy" value={sortBy} onChange={handleSortByChange}>
                  <option value="nombre">Nombre</option>
                  <option value="precioVenta">Precio de Venta</option>
                  <option value="cantidadDisponible">Cantidad Disponible</option>
                  <option value="costoProduccion">Costo de Producción</option>
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
            <button className="btn-clear-filters" onClick={handleClearFilters}>
              <FontAwesomeIcon icon={faTimes} /> Limpiar Filtros
            </button>
          </div>
        </div>
        <div className="table-card">
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th className="col-nombre">Nombre</th>
                  <th className="col-descripcion">Descripción</th>
                  <th className="col-tipo">Tipo</th>
                  <th className="col-costoProduccion">Costo de Producción</th>
                  <th className="col-precioVenta">Precio de Venta</th>
                  <th className="col-cantidad-disponible">Cantidad Disponible</th>
                  <th className="col-cantidad-reservada">Cantidad Reservada</th>
                  <th className="col-acciones">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedStock.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="empty-message">
                      No hay stock que coincida con los filtros.
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedStock.map((item, index) => {
                    const isModelo = !!item.modelo;
                    const nombre = isModelo ? (item.modelo?.nombre || 'Sin nombre') : (item.material?.nombre || 'Sin nombre');
                    const descripcion = isModelo ? (item.modelo?.descripcion || '-') : '-';
                    const costoProduccion = isModelo ? (item.modelo?.costoProduccion || 0) : 0;
                    const precioVenta = isModelo ? (item.modelo?.precioVenta || 0) : 0;

                    return (
                      <tr key={item._id} className={index % 2 === 0 ? 'row-even' : 'row-odd'}>
                        <td data-label="Nombre" className="col-nombre">{nombre}</td>
                        <td data-label="Descripción" className="col-descripcion">{descripcion}</td>
                        <td data-label="Tipo" className="col-tipo">{isModelo ? 'Modelo' : 'Material'}</td>
                        <td data-label="Costo de Producción" className="col-costoProduccion">
                          ${(costoProduccion).toLocaleString('es-VE')}
                        </td>
                        <td data-label="Precio de Venta" className="col-precioVenta">
                          ${(precioVenta).toLocaleString('es-VE')}
                        </td>
                        <td data-label="Cantidad Disponible" className="col-cantidad-disponible">{item.cantidadDisponible ?? '-'}</td>
                        <td data-label="Cantidad Reservada" className="col-cantidad-reservada">{item.cantidadReservada ?? '-'}</td>
                        <td data-label="Acciones" className="actions-cell col-acciones">
                          <button
                            className="action-button delete-button"
                            onClick={() => handleEliminarStock(item._id)}
                            title="Eliminar"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Stock;