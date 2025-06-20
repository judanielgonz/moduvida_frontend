import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faEdit, faBox, faSearch, faSort, faSpinner } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../css/FormularioArticulos.css';

import baseUrl from '../config'; // Importa la URL base

const Articulos = () => {
  const [formulario, setFormulario] = useState({
    nombre: '',
    precio: '',
    tipo: '',
    proveedor: '',
    contacto: '',
    _id: null,
  });
  const [articulos, setArticulos] = useState([]);
  const [proveedores, setProveedores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState('');
  const [sortBy, setSortBy] = useState('nombre');
  const [sortOrder, setSortOrder] = useState('asc');

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const [resProveedores, resArticulos] = await Promise.all([
          axios.get(`${baseUrl}/proveedores`),
          axios.get(`${baseUrl}/articulos`),
        ]);
        setProveedores(resProveedores.data.data || []);
        setArticulos(resArticulos.data.data || []);
        if (resArticulos.data.data.length === 0) {
          toast.info('No hay artículos registrados. Crea uno para comenzar.');
        }
      } catch (error) {
        console.error('Error cargando datos:', error);
        toast.error('Error al cargar artículos o proveedores. Verifica el servidor.');
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormulario((prev) => {
      const newFormulario = { ...prev, [name]: value };

      if (name === 'contacto' && value && prev.proveedor) {
        const proveedorSeleccionado = proveedores.find((p) => p._id === prev.proveedor);
        if (proveedorSeleccionado) {
          const contactoSeleccionado = proveedorSeleccionado.contactos.find((c) => c._id.toString() === value);
          if (contactoSeleccionado) {
            const precioBase = Number(prev.precio) || 100;
            const factor = 1 + (contactoSeleccionado._id.toString().length % 3) * 0.1;
            newFormulario.precio = (precioBase * factor).toFixed(2);
          }
        }
      } else if (name === 'proveedor' && value) {
        newFormulario.contacto = '';
        newFormulario.precio = prev.precio || '100';
      }

      return newFormulario;
    });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleTipoFiltroChange = (e) => {
    setTipoFiltro(e.target.value);
  };

  const handleSortByChange = (e) => {
    setSortBy(e.target.value);
  };

  const handleSortOrderChange = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        nombre: formulario.nombre,
        precio: Number(formulario.precio),
        tipo: formulario.tipo,
        proveedor: formulario.proveedor || null,
        contacto: formulario.contacto || null,
      };

      if (formulario._id) {
        const response = await axios.put(`${baseUrl}/articulos/${formulario._id}`, payload);
        setArticulos(articulos.map((articulo) => (articulo._id === formulario._id ? response.data.data : articulo)));
        toast.success('Artículo actualizado correctamente');
      } else {
        const response = await axios.post(`${baseUrl}/articulos`, payload);
        setArticulos([...articulos, response.data.data]);
        toast.success('Artículo registrado correctamente');
      }
      handleReset();
    } catch (error) {
      console.error('Error al guardar el artículo:', error);
      toast.error('Error al guardar el artículo: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleEliminar = async (articuloId) => {
    try {
      await axios.delete(`${baseUrl}/articulos/${articuloId}`);
      setArticulos(articulos.filter((articulo) => articulo._id !== articuloId));
      toast.success('Artículo eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar el artículo:', error);
      toast.error('Error al eliminar el artículo: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleModificar = (articuloId) => {
    const articuloSeleccionado = articulos.find((articulo) => articulo._id === articuloId);
    if (articuloSeleccionado) {
      setFormulario({
        nombre: articuloSeleccionado.nombre,
        precio: articuloSeleccionado.precio,
        tipo: articuloSeleccionado.tipo,
        proveedor: articuloSeleccionado.proveedor?._id || articuloSeleccionado.proveedor || '',
        contacto: articuloSeleccionado.contacto || '',
        _id: articuloSeleccionado._id,
      });
    }
  };

  const handleReset = () => {
    setFormulario({
      nombre: '',
      precio: '',
      tipo: '',
      proveedor: '',
      contacto: '',
      _id: null,
    });
  };

  const obtenerNombreProveedor = (proveedor, contactoId) => {
    if (!proveedor) return 'Sin proveedor';
    let proveedorNombre = 'Proveedor no encontrado';
    if (typeof proveedor === 'string') {
      const proveedorEncontrado = proveedores.find((p) => p._id === proveedor);
      proveedorNombre = proveedorEncontrado ? proveedorEncontrado.nombre : 'Proveedor no encontrado';
    } else {
      proveedorNombre = proveedor.nombre || 'Proveedor no encontrado';
    }
    if (!contactoId) return `${proveedorNombre} (Sin contacto)`;
    const proveedorEncontrado = proveedores.find((p) => p._id === (typeof proveedor === 'string' ? proveedor : proveedor._id));
    if (proveedorEncontrado) {
      const contacto = proveedorEncontrado.contactos.find((c) => c._id.toString() === contactoId);
      return contacto ? `${proveedorNombre} (${contacto.nombreContacto})` : `${proveedorNombre} (Contacto no encontrado)`;
    }
    return `${proveedorNombre} (Contacto no encontrado)`;
  };

  const tiposUnicos = [...new Set(articulos.map((articulo) => articulo.tipo).filter(Boolean))];

  const filteredAndSortedArticulos = articulos
    .filter((articulo) => {
      return (
        articulo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        articulo.tipo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        articulo.precio.toString().includes(searchTerm.toLowerCase()) ||
        obtenerNombreProveedor(articulo.proveedor, articulo.contacto).toLowerCase().includes(searchTerm.toLowerCase())
      ) && (!tipoFiltro || articulo.tipo === tipoFiltro);
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'nombre') {
        comparison = a.nombre.localeCompare(b.nombre);
      } else if (sortBy === 'precio') {
        comparison = a.precio - b.precio;
      } else if (sortBy === 'fecha_creacion') {
        comparison = new Date(a.fecha_creacion) - new Date(b.fecha_creacion);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  return (
    <div className="articulos-container">
      <ToastContainer position="top-right" autoClose={3000} theme="colored" />
      <header className="articulos-header">
        <h2>
          <FontAwesomeIcon icon={faBox} /> Gestión de Artículos
        </h2>
      </header>

      <div className="form-card">
        <h3>{formulario._id ? 'Editar Artículo' : 'Registrar Artículo'}</h3>
        <form onSubmit={handleSubmit} className="articulos-form">
          <div className="form-group">
            <label htmlFor="nombre">Nombre</label>
            <input
              id="nombre"
              name="nombre"
              value={formulario.nombre}
              onChange={handleChange}
              placeholder="Nombre del artículo"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="precio">Precio</label>
            <input
              id="precio"
              type="number"
              name="precio"
              value={formulario.precio}
              onChange={handleChange}
              placeholder="Precio del artículo"
              required
              min="0"
              step="0.01"
            />
          </div>
          <div className="form-group">
            <label htmlFor="tipo">Tipo</label>
            <input
              id="tipo"
              name="tipo"
              value={formulario.tipo}
              onChange={handleChange}
              placeholder="Tipo de artículo"
              required
            />
          </div>
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
            <label htmlFor="contacto">Contacto</label>
            <select
              id="contacto"
              name="contacto"
              value={formulario.contacto}
              onChange={handleChange}
              disabled={!formulario.proveedor}
            >
              <option value="">Seleccione un contacto (opcional)</option>
              {formulario.proveedor &&
                proveedores
                  .find((p) => p._id === formulario.proveedor)
                  ?.contactos.map((contacto) => (
                    <option key={contacto._id} value={contacto._id}>
                      {contacto.nombreContacto} ({contacto.cargoContacto})
                    </option>
                  ))}
            </select>
          </div>
          <div className="form-buttons">
            <button type="submit" className="btn-primary">
              {formulario._id ? 'Actualizar' : 'Registrar'}
            </button>
            <button type="button" className="btn-secondary" onClick={handleReset}>
              Cancelar
            </button>
          </div>
        </form>
      </div>

      <div className="articulos-lista">
        <h3>Lista de Artículos</h3>
        <div className="filters-card">
          <div className="filter-group">
            <label htmlFor="search">Buscar</label>
            <div className="search-wrapper">
              <FontAwesomeIcon icon={faSearch} className="search-icon" />
              <input
                id="search"
                type="text"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Buscar por nombre, tipo, proveedor..."
              />
            </div>
          </div>
          <div className="filter-group">
            <label htmlFor="tipoFiltro">Filtrar por Tipo</label>
            <select id="tipoFiltro" value={tipoFiltro} onChange={handleTipoFiltroChange}>
              <option value="">Todos los tipos</option>
              {tiposUnicos.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label htmlFor="sortBy">Ordenar por</label>
            <div className="sort-wrapper">
              <select id="sortBy" value={sortBy} onChange={handleSortByChange}>
                <option value="nombre">Nombre</option>
                <option value="precio">Precio</option>
                <option value="fecha_creacion">Fecha de Creación</option>
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

        {loading ? (
          <div className="loading-container">
            <FontAwesomeIcon icon={faSpinner} spin size="2x" />
            <p>Cargando artículos...</p>
          </div>
        ) : (
          <div className="table-card">
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Precio</th>
                    <th>Tipo</th>
                    <th>Proveedor (Contacto)</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedArticulos.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="no-data">
                        No hay artículos que coincidan con los filtros.
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedArticulos.map((articulo) => (
                      <tr key={articulo._id}>
                        <td data-label="Nombre">{articulo.nombre}</td>
                        <td data-label="Precio">${articulo.precio.toLocaleString('es-VE')}</td>
                        <td data-label="Tipo">{articulo.tipo}</td>
                        <td data-label="Proveedor">{obtenerNombreProveedor(articulo.proveedor, articulo.contacto)}</td>
                        <td data-label="Acciones" className="actions-cell">
                          <button
                            className="action-button edit-button"
                            onClick={() => handleModificar(articulo._id)}
                            title="Editar artículo"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            className="action-button delete-button"
                            onClick={() => handleEliminar(articulo._id)}
                            title="Eliminar artículo"
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
        )}
      </div>
    </div>
  );
};

export default Articulos;