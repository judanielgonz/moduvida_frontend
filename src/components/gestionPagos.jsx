import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faEdit, faShoppingCart, faSearch, faSort } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../css/GestionPedidosYPagos.css';

const baseUrl = 'http://localhost:5000/api';

const GestionPedidosYPagos = () => {
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [formulario, setFormulario] = useState({
    cliente: '',
    fechaEntrega: '',
    estadoPago: 'Pendiente',
    estadoEntrega: 'Pendiente',
    modelos: [],
    metodoPago: 'Efectivo',
    conFactura: false,
  });
  const [editarPedido, setEditarPedido] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroEstadoPago, setFiltroEstadoPago] = useState('');
  const [sortBy, setSortBy] = useState('cliente');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const [pedidosResponse, clientesResponse, modelosResponse] = await Promise.all([
          axios.get(`${baseUrl}/pedidos`),
          axios.get(`${baseUrl}/clientes`),
          axios.get(`${baseUrl}/modelos`),
        ]);
        const pedidosData = pedidosResponse.data.data || [];
        setPedidos(pedidosData);
        setClientes(clientesResponse.data.data || []);
        setModelos(modelosResponse.data.data || []);

        if (pedidosData.length === 0) {
          toast.warn('No hay pedidos registrados. Crea uno para comenzar.');
        }
        if (clientesResponse.data.data.length === 0) {
          toast.error('No hay clientes registrados. Registra un cliente primero.');
        }
        if (modelosResponse.data.data.length === 0) {
          toast.error('No hay modelos registrados. Registra un modelo primero.');
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
        toast.error('Error al cargar pedidos, clientes o modelos. Verifica el servidor.');
      }
    };
    cargarDatos();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormulario({
      ...formulario,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleModeloChange = (index, e) => {
    const { name, value } = e.target;
    const modelosFormulario = [...formulario.modelos];
    modelosFormulario[index][name] = name === 'cantidad' ? parseInt(value) || 0 : value;

    // Asignar precioUnitario cuando se selecciona un modelo
    if (name === 'modelo') {
      const modeloDesdeLista = modelos.find(m => m._id === value);
      if (modeloDesdeLista) {
        modelosFormulario[index].precioUnitario = modeloDesdeLista.precioVenta || 0;
      } else {
        modelosFormulario[index].precioUnitario = 0;
      }
    }

    setFormulario({ ...formulario, modelos: modelosFormulario });
  };

  const agregarModelo = () => {
    setFormulario({
      ...formulario,
      modelos: [...formulario.modelos, { modelo: '', cantidad: 1, precioUnitario: 0 }],
    });
  };

  const eliminarModelo = (index) => {
    const modelos = [...formulario.modelos];
    modelos.splice(index, 1);
    setFormulario({ ...formulario, modelos });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formulario.modelos.length === 0 || formulario.modelos.some(m => !m.modelo || m.cantidad <= 0)) {
      toast.error('Por favor, agrega al menos un modelo válido con cantidad mayor a 0.');
      return;
    }
    try {
      if (editarPedido) {
        await axios.put(`${baseUrl}/pedidos/${editarPedido._id}`, formulario);
        toast.success('Pedido actualizado correctamente');
      } else {
        await axios.post(`${baseUrl}/pedidos`, formulario);
        toast.success('Pedido creado correctamente');
      }
      const pedidosResponse = await axios.get(`${baseUrl}/pedidos`);
      const pedidosData = pedidosResponse.data.data || [];
      setPedidos(pedidosData);
      if (pedidosData.length === 0) {
        toast.warn('No hay pedidos registrados.');
      }
      handleReset();
      setEditarPedido(null);
    } catch (error) {
      console.error('Error al procesar el pedido:', error);
      toast.error(`Error al procesar el pedido: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleEliminar = async (id) => {
    try {
      await axios.delete(`${baseUrl}/pedidos/${id}`);
      const pedidosResponse = await axios.get(`${baseUrl}/pedidos`);
      const pedidosData = pedidosResponse.data.data || [];
      setPedidos(pedidosData);
      if (pedidosData.length === 0) {
        toast.warn('No hay pedidos registrados.');
      } else {
        toast.success('Pedido eliminado correctamente');
      }
    } catch (error) {
      console.error('Error al eliminar el pedido:', error);
      toast.error('Error al eliminar el pedido.');
    }
  };

  const handleModificar = (pedido) => {
    setEditarPedido(pedido);
    setFormulario({
      cliente: pedido.cliente?._id || '',
      fechaEntrega: new Date(pedido.fechaEntrega).toISOString().split('T')[0],
      estadoPago: pedido.estadoPago,
      estadoEntrega: pedido.estadoEntrega,
      modelos: pedido.modelos.map(m => ({
        modelo: m.modelo?._id || '',
        cantidad: m.cantidad,
        precioUnitario: m.modelo?.precioVenta || 0,
      })),
      metodoPago: pedido.metodoPago || 'Efectivo',
      conFactura: pedido.conFactura || false,
    });
  };

  const handleUpdateEstado = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${baseUrl}/pedidos/${editarPedido._id}/estado`, {
        estadoPago: formulario.estadoPago,
        estadoEntrega: formulario.estadoEntrega,
      });
      const pedidosResponse = await axios.get(`${baseUrl}/pedidos`);
      const pedidosData = pedidosResponse.data.data || [];
      setPedidos(pedidosData);
      if (pedidosData.length === 0) {
        toast.warn('No hay pedidos registrados.');
      } else {
        toast.success('Estado del pedido actualizado correctamente');
      }
      handleReset();
      setEditarPedido(null);
    } catch (error) {
      console.error('Error al actualizar el estado:', error);
      toast.error(`Error al actualizar el estado: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleReset = () => {
    setFormulario({
      cliente: '',
      fechaEntrega: '',
      estadoPago: 'Pendiente',
      estadoEntrega: 'Pendiente',
      modelos: [],
      metodoPago: 'Efectivo',
      conFactura: false,
    });
    setEditarPedido(null);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFiltroEstadoPagoChange = (e) => {
    setFiltroEstadoPago(e.target.value);
  };

  const handleSortByChange = (e) => {
    setSortBy(e.target.value);
  };

  const handleSortOrderChange = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const filteredAndSortedPedidos = pedidos
    .filter((pedido) =>
      ((pedido.cliente?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (pedido.cliente?.apellido || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        new Date(pedido.fechaEntrega).toLocaleDateString('es-VE').includes(searchTerm.toLowerCase()) ||
        pedido.modelos.some(m => (m.modelo?.nombre || '').toLowerCase().includes(searchTerm.toLowerCase())) ||
        (pedido.precioTotal || 0).toString().includes(searchTerm)) &&
      (!filtroEstadoPago || pedido.estadoPago === filtroEstadoPago)
    )
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'cliente') {
        const nombreA = `${a.cliente?.nombre || ''} ${a.cliente?.apellido || ''}`;
        const nombreB = `${b.cliente?.nombre || ''} ${b.cliente?.apellido || ''}`;
        comparison = nombreA.localeCompare(nombreB);
      } else if (sortBy === 'fechaEntrega') {
        comparison = new Date(a.fechaEntrega) - new Date(b.fechaEntrega);
      } else if (sortBy === 'precioTotal') {
        comparison = (a.precioTotal || 0) - (b.precioTotal || 0);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  return (
    <div className="pedidos-container">
      <ToastContainer position="top-right" autoClose={3000} />
      <h2>
        <FontAwesomeIcon icon={faShoppingCart} /> Gestión de Pedidos y Pagos
      </h2>

      <div className="form-card">
        <h3>{editarPedido ? 'Editar Pedido' : 'Crear Pedido'}</h3>
        <form onSubmit={editarPedido ? handleUpdateEstado : handleSubmit} className="pedidos-form">
          <div className="form-group">
            <label>Cliente</label>
            <select
              name="cliente"
              value={formulario.cliente}
              onChange={handleChange}
              required
              disabled={editarPedido}
            >
              <option value="">Seleccione un cliente</option>
              {clientes.map((cliente) => (
                <option key={cliente._id} value={cliente._id}>
                  {cliente.nombre} {cliente.apellido}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Fecha de Entrega</label>
            <input
              type="date"
              name="fechaEntrega"
              value={formulario.fechaEntrega}
              onChange={handleChange}
              required
              disabled={editarPedido}
            />
          </div>
          <div className="form-group">
            <label>Estado de Pago</label>
            <select
              name="estadoPago"
              value={formulario.estadoPago}
              onChange={handleChange}
              required
            >
              <option value="Pendiente">Pendiente</option>
              <option value="Completado">Completado</option>
            </select>
          </div>
          <div className="form-group">
            <label>Estado de Entrega</label>
            <select
              name="estadoEntrega"
              value={formulario.estadoEntrega}
              onChange={handleChange}
              required
            >
              <option value="Pendiente">Pendiente</option>
              <option value="Entregado">Entregado</option>
            </select>
          </div>
          <div className="form-group">
            <label>Método de Pago</label>
            <select
              name="metodoPago"
              value={formulario.metodoPago}
              onChange={handleChange}
              required
            >
              <option value="Efectivo">Efectivo</option>
              <option value="Tarjeta">Tarjeta</option>
            </select>
          </div>
          <div className="form-group">
            <label>
              <input
                type="checkbox"
                name="conFactura"
                checked={formulario.conFactura}
                onChange={handleChange}
              /> Con Factura
            </label>
          </div>

          {!editarPedido && (
            <div className="detalles-section">
              <h4>Modelos del Pedido</h4>
              {formulario.modelos.map((modelo, index) => (
                <div className="detalle-row" key={index}>
                  <div className="form-group">
                    <label>Modelo</label>
                    <select
                      name="modelo"
                      value={modelo.modelo}
                      onChange={(e) => handleModeloChange(index, e)}
                      required
                    >
                      <option value="">Seleccione un modelo</option>
                      {modelos.map((modeloItem) => (
                        <option key={modeloItem._id} value={modeloItem._id}>
                          {modeloItem.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Cantidad</label>
                    <input
                      type="number"
                      name="cantidad"
                      value={modelo.cantidad}
                      onChange={(e) => handleModeloChange(index, e)}
                      required
                      min="1"
                    />
                  </div>
                  <div className="form-group">
                    <label>Precio Unitario</label>
                    <input
                      type="number"
                      name="precioUnitario"
                      value={modelo.precioUnitario || 0}
                      readOnly
                      disabled
                      style={{ backgroundColor: '#f3f4f6' }}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn-delete-detalle"
                    onClick={() => eliminarModelo(index)}
                    title="Eliminar modelo"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn-add-detalle"
                onClick={agregarModelo}
              >
                Agregar Modelo
              </button>
            </div>
          )}

          <div className="form-buttons">
            <button type="submit" className="btn-primary">
              {editarPedido ? 'Actualizar Estado' : 'Crear Pedido'}
            </button>
            <button type="button" className="btn-secondary" onClick={handleReset}>
              Cancelar
            </button>
          </div>
        </form>
      </div>

      <div className="pedidos-lista">
        <h3>Lista de Pedidos</h3>
        <div className="form-card">
          <div className="pedidos-form">
            <div className="form-group">
              <label>Buscar Pedido</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Buscar por cliente, fecha, modelo..."
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
              <label>Filtrar por Estado de Pago</label>
              <select value={filtroEstadoPago} onChange={handleFiltroEstadoPagoChange}>
                <option value="">Todos los estados</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Completado">Completado</option>
              </select>
            </div>
            <div className="form-group">
              <label>Ordenar por</label>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <select value={sortBy} onChange={handleSortByChange}>
                  <option value="cliente">Cliente</option>
                  <option value="fechaEntrega">Fecha de Entrega</option>
                  <option value="precioTotal">Precio Total</option>
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
                <th>Cliente</th>
                <th>Fecha de Entrega</th>
                <th>Modelos</th>
                <th>Cantidades</th>
                <th>Precio Unitario</th>
                <th>Precio Total (Pedido)</th>
                <th>Estado de Pago</th>
                <th>Estado de Entrega</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedPedidos.length === 0 ? (
                <tr>
                  <td colSpan="9">No hay pedidos que coincidan con los filtros.</td>
                </tr>
              ) : (
                filteredAndSortedPedidos.map((pedido) => (
                  <tr key={pedido._id}>
                    <td data-label="Cliente">
                      {pedido.cliente?.nombre || 'Desconocido'} {pedido.cliente?.apellido || ''}
                    </td>
                    <td data-label="Fecha de Entrega">
                      {new Date(pedido.fechaEntrega).toLocaleDateString('es-VE')}
                    </td>
                    <td data-label="Modelos">
                      {pedido.modelos.length > 0 ? (
                        pedido.modelos.map((item, index) => (
                          <div key={index}>{item.modelo?.nombre || 'Desconocido'}</div>
                        ))
                      ) : (
                        <span>No hay modelos</span>
                      )}
                    </td>
                    <td data-label="Cantidades">
                      {pedido.modelos.length > 0 ? (
                        pedido.modelos.map((item, index) => (
                          <div key={index}>{item.cantidad}</div>
                        ))
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                    <td data-label="Precio Unitario">
                      {pedido.modelos.length > 0 ? (
                        pedido.modelos.map((item, index) => (
                          <div key={index}>${(item.modelo?.precioVenta || 0).toLocaleString('es-VE')}</div>
                        ))
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                    <td data-label="Precio Total (Pedido)">
                      ${(pedido.precioTotal || 0).toLocaleString('es-VE')}
                    </td>
                    <td data-label="Estado de Pago">{pedido.estadoPago}</td>
                    <td data-label="Estado de Entrega">{pedido.estadoEntrega}</td>
                    <td data-label="Acciones">
                      <button
                        className="action-button edit-button"
                        onClick={() => handleModificar(pedido)}
                        title="Editar"
                      >
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button
                        className="action-button delete-button"
                        onClick={() => handleEliminar(pedido._id)}
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

export default GestionPedidosYPagos;