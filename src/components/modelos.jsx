import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash, faEdit, faCube, faSearch, faSort, faPlus, faTimes, faFilter } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../css/FormularioModelo.css';

import baseUrl from '../config'; // Importa la URL base

const FormularioModelo = () => {
  const [formulario, setFormulario] = useState({
    nombre: '',
    descripcion: '',
    categoria: '',
    material: '',
    alto: '',
    ancho: '',
    precio: '',
    imagenUrl: '',
    materiales: [], // List of { nombre: string, cantidad: number }
    costoProduccion: 0,
    precioVenta: '',
    _id: null,
  });
  const [listaModelos, setListaModelos] = useState([]);
  const [materialesDisponibles, setMaterialesDisponibles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [sortBy, setSortBy] = useState('nombre');
  const [sortOrder, setSortOrder] = useState('asc');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setLoading(true);
        const [modelosRes, stockRes] = await Promise.all([
          axios.get(`${baseUrl}/modelos`),
          axios.get(`${baseUrl}/stock`),
        ]);
        const modelosData = modelosRes.data.data || [];
        setListaModelos(modelosData.map(modelo => ({
          ...modelo,
          alto: modelo.alto ? Number(modelo.alto).toFixed(2) : '',
          ancho: modelo.ancho ? Number(modelo.ancho).toFixed(2) : '',
          costoProduccion: modelo.costoProduccion || 0,
          precioVenta: modelo.precioVenta || 0,
        })));
        const materiales = [...new Set(
          stockRes.data.data
            .filter(item => item.material?.nombre)
            .map(item => item.material.nombre)
        )].map(nombre => ({
          nombre,
          precio: 0, // Price is calculated in backend
        }));
        setMaterialesDisponibles(materiales);
        if (modelosData.length === 0) {
          toast.warn('No hay modelos registrados. Crea uno para comenzar.');
        }
      } catch (error) {
        console.error('Error al obtener los datos:', error);
        toast.error('Error al cargar los datos: ' + (error.response?.data?.message || error.message));
      } finally {
        setLoading(false);
      }
    };
    cargarDatos();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormulario({ ...formulario, [name]: value });
  };

  const handleMaterialChange = (index, field, value) => {
    const updatedMateriales = [...formulario.materiales];
    updatedMateriales[index] = { 
      ...updatedMateriales[index], 
      [field]: field === 'cantidad' ? parseInt(value) || 1 : value 
    };
    const costoProduccion = calcularCostoProduccion(updatedMateriales);
    setFormulario({ ...formulario, materiales: updatedMateriales, costoProduccion });
  };

  const agregarMaterial = () => {
    setFormulario({
      ...formulario,
      materiales: [...formulario.materiales, { nombre: '', cantidad: 1 }],
      costoProduccion: calcularCostoProduccion([...formulario.materiales, { nombre: '', cantidad: 1 }]),
    });
  };

  const eliminarMaterial = (index) => {
    const updatedMateriales = formulario.materiales.filter((_, i) => i !== index);
    const costoProduccion = calcularCostoProduccion(updatedMateriales);
    setFormulario({ ...formulario, materiales: updatedMateriales, costoProduccion });
  };

  const calcularCostoProduccion = (materialesList) => {
    return 0; // Cost is calculated in the backend; frontend shows 0
  };

  const handleFormSubmit = async (event) => {
    event.preventDefault();
    if (formulario.materiales.length === 0 || formulario.materiales.some(item => !item.nombre || item.cantidad < 1)) {
      toast.error('Por favor, agrega al menos un material con cantidad válida.');
      return;
    }

    const datosModelo = {
      nombre: formulario.nombre,
      descripcion: formulario.descripcion,
      categoria: formulario.categoria,
      precio: Number(formulario.precio),
      ...(formulario.material && { material: formulario.material }),
      ...(formulario.alto && { alto: Number(formulario.alto) }),
      ...(formulario.ancho && { ancho: Number(formulario.ancho) }),
      ...(formulario.imagenUrl && { imagenUrl: formulario.imagenUrl }),
      materiales: formulario.materiales.map(m => ({ nombre: m.nombre, cantidad: m.cantidad })),
      costoProduccion: formulario.costoProduccion,
      precioVenta: Number(formulario.precioVenta),
    };

    try {
      setLoading(true);
      let response;
      if (formulario._id) {
        response = await axios.put(`${baseUrl}/modelos/${formulario._id}`, datosModelo);
        setListaModelos(listaModelos.map(modelo =>
          modelo._id === formulario._id ? response.data.data : modelo
        ));
        toast.success('Modelo actualizado correctamente');
      } else {
        response = await axios.post(`${baseUrl}/modelos`, datosModelo);
        setListaModelos([...listaModelos, response.data.data]);
        toast.success('Modelo registrado correctamente');
      }
      handleReset();
    } catch (error) {
      console.error('Error al procesar la solicitud:', error);
      toast.error(`Error al procesar el modelo: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleEditarModelo = (modeloId) => {
    const modeloParaEditar = listaModelos.find(modelo => modelo._id === modeloId);
    if (modeloParaEditar) {
      const materiales = modeloParaEditar.materiales.map(item => ({
        nombre: item.nombre,
        cantidad: item.cantidad,
      }));
      const costoProduccion = calcularCostoProduccion(materiales);
      setFormulario({
        nombre: modeloParaEditar.nombre,
        descripcion: modeloParaEditar.descripcion,
        categoria: modeloParaEditar.categoria,
        material: modeloParaEditar.material || '',
        alto: modeloParaEditar.alto || '',
        ancho: modeloParaEditar.ancho || '',
        precio: modeloParaEditar.precio || '',
        imagenUrl: modeloParaEditar.imagenUrl || '',
        materiales: materiales,
        costoProduccion: costoProduccion,
        precioVenta: modeloParaEditar.precioVenta || '',
        _id: modeloParaEditar._id,
      });
    } else {
      toast.error('Modelo no encontrado para editar.');
    }
  };

  const handleEliminarModelo = async (modeloId) => {
    try {
      setLoading(true);
      await axios.delete(`${baseUrl}/modelos/${modeloId}`);
      setListaModelos(listaModelos.filter(modelo => modelo._id !== modeloId));
      toast.success('Modelo eliminado correctamente');
    } catch (error) {
      console.error('Error al eliminar el modelo:', error);
      toast.error('Error al eliminar el modelo: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormulario({
      nombre: '',
      descripcion: '',
      categoria: '',
      material: '',
      alto: '',
      ancho: '',
      precio: '',
      imagenUrl: '',
      materiales: [],
      costoProduccion: 0,
      precioVenta: '',
      _id: null,
    });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFiltroCategoriaChange = (e) => {
    setFiltroCategoria(e.target.value);
  };

  const handleSortByChange = (e) => {
    setSortBy(e.target.value);
  };

  const handleSortOrderChange = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const categoriasUnicas = [...new Set(listaModelos.map(modelo => modelo.categoria).filter(Boolean))];

  const filteredAndSortedModelos = listaModelos
    .filter((modelo) =>
      (modelo.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        modelo.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        modelo.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (modelo.material && modelo.material.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (modelo.alto || '').toString().includes(searchTerm) ||
        (modelo.ancho || '').toString().includes(searchTerm) ||
        (modelo.costoProduccion || '').toString().includes(searchTerm) ||
        (modelo.precioVenta || '').toString().includes(searchTerm))
      && (!filtroCategoria || modelo.categoria === filtroCategoria)
    )
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'nombre') {
        comparison = a.nombre.localeCompare(b.nombre);
      } else if (sortBy === 'costoProduccion') {
        comparison = (a.costoProduccion || 0) - (b.costoProduccion || 0);
      } else if (sortBy === 'precioVenta') {
        comparison = (a.precioVenta || 0) - (b.precioVenta || 0);
      } else if (sortBy === 'categoria') {
        comparison = a.categoria.localeCompare(b.categoria);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  return (
    <div className="modelos-container">
      <ToastContainer position="top-right" autoClose={3000} />
      <h2>
        <FontAwesomeIcon icon={faCube} /> Gestión de Modelos
      </h2>

      <div className="form-card">
        <h3>{formulario._id ? 'Editar Modelo' : 'Registrar Modelo'}</h3>
        <form onSubmit={handleFormSubmit} className="modelos-form">
          <div className="form-group">
            <label>Nombre</label>
            <input
              type="text"
              name="nombre"
              value={formulario.nombre}
              onChange={handleChange}
              placeholder="Ingrese el nombre del modelo"
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Descripción</label>
            <input
              type="text"
              name="descripcion"
              value={formulario.descripcion}
              onChange={handleChange}
              placeholder="Ingrese la descripción"
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Categoría</label>
            <input
              type="text"
              name="categoria"
              value={formulario.categoria}
              onChange={handleChange}
              placeholder="Ingrese la categoría"
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Material (opcional)</label>
            <input
              type="text"
              name="material"
              value={formulario.material}
              onChange={handleChange}
              placeholder="Ingrese el material"
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Alto (cm, opcional)</label>
            <input
              type="number"
              name="alto"
              value={formulario.alto}
              onChange={handleChange}
              placeholder="Ingrese el alto"
              min="0"
              step="0.01"
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>Ancho (cm, opcional)</label>
            <input
              type="number"
              name="ancho"
              value={formulario.ancho}
              onChange={handleChange}
              placeholder="Ingrese el ancho"
              min="0"
              step="0.01"
              disabled={loading}
            />
          </div>
          <div className="form-group materiales-section">
            <label>Materiales</label>
            {formulario.materiales.map((item, index) => (
              <div key={index} className="material-row">
                <select
                  value={item.nombre}
                  onChange={(e) => handleMaterialChange(index, 'nombre', e.target.value)}
                  required
                  disabled={loading}
                >
                  <option value="">Seleccione un material</option>
                  {materialesDisponibles.map((material) => (
                    <option key={material.nombre} value={material.nombre}>
                      {material.nombre}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={item.cantidad}
                  onChange={(e) => handleMaterialChange(index, 'cantidad', e.target.value)}
                  min="1"
                  required
                  placeholder="Cantidad"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="btn-delete-material"
                  onClick={() => eliminarMaterial(index)}
                  title="Eliminar material"
                  disabled={loading}
                >
                  <FontAwesomeIcon icon={faTimes} />
                </button>
              </div>
            ))}
            <button
              type="button"
              className="btn-add-material"
              onClick={agregarMaterial}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faPlus} /> Agregar Material
            </button>
          </div>
          <div className="form-group">
            <label>Costo de Producción</label>
            <input
              type="text"
              value={`$${formulario.costoProduccion.toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
              disabled
            />
          </div>
          <div className="form-group">
            <label>Precio de Venta</label>
            <input
              type="number"
              name="precioVenta"
              value={formulario.precioVenta}
              onChange={handleChange}
              placeholder="Ingrese el precio de venta"
              required
              min="0"
              step="0.01"
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label>URL de Imagen (opcional)</label>
            <input
              type="text"
              name="imagenUrl"
              value={formulario.imagenUrl}
              onChange={handleChange}
              placeholder="Ingrese la URL de la imagen"
              disabled={loading}
            />
          </div>
          <div className="form-buttons">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : (formulario._id ? 'Actualizar' : 'Registrar')}
            </button>
            <button type="button" className="btn-secondary" onClick={handleReset} disabled={loading}>
              <FontAwesomeIcon icon={faTimes} /> Cancelar
            </button>
          </div>
        </form>
      </div>

      <div className="modelos-lista">
        <h3>Lista de Modelos</h3>
        <div className="form-card">
          <div className="modelos-form flex flex-wrap gap-4 items-end">
            <div className="form-group flex-1 min-w-[250px]">
              <label className="block mb-1 font-medium text-gray-700">Buscar Modelo</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Buscar por nombre, categoría, costo..."
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                />
                <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div className="form-group flex-1 min-w-[200px]">
              <label className="block mb-1 font-medium text-gray-700">Filtrar por Categoría</label>
              <div className="relative">
                <select
                  value={filtroCategoria}
                  onChange={handleFiltroCategoriaChange}
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 appearance-none"
                >
                  <option value="">Todas las categorías</option>
                  {categoriasUnicas.map((categoria) => (
                    <option key={categoria} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </select>
                <FontAwesomeIcon icon={faFilter} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            <div className="form-group flex-1 min-w-[200px]">
              <label className="block mb-1 font-medium text-gray-700">Ordenar por</label>
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={handleSortByChange}
                  disabled={loading}
                  className="flex-1 pl-4 pr-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200 appearance-none"
                >
                  <option value="nombre">Nombre</option>
                  <option value="costoProduccion">Costo de Producción</option>
                  <option value="precioVenta">Precio de Venta</option>
                  <option value="categoria">Categoría</option>
                </select>
                <button
                  className="p-2 border rounded-lg shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-200"
                  onClick={handleSortOrderChange}
                  title={sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
                  disabled={loading}
                >
                  <FontAwesomeIcon icon={faSort} className="text-gray-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="table-card">
          <div className="table-container">
            {loading ? (
              <div className="empty-message">Cargando...</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th className="col-nombre">Nombre</th>
                    <th className="col-descripcion">Descripción</th>
                    <th className="col-categoria">Categoría</th>
                    <th className="col-material">Material</th>
                    <th className="col-alto">Alto</th>
                    <th className="col-ancho">Ancho</th>
                    <th className="col-materiales">Materiales (Cantidad)</th>
                    <th className="col-costo">Costo de Producción</th>
                    <th className="col-precio">Precio de Venta</th>
                    <th className="col-imagen">Imagen</th>
                    <th className="col-acciones">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedModelos.length === 0 ? (
                    <tr>
                      <td colSpan="11" className="empty-message">
                        {searchTerm || filtroCategoria ? 'No hay modelos que coincidan con los filtros.' : 'No hay modelos registrados.'}
                      </td>
                    </tr>
                  ) : (
                    filteredAndSortedModelos.map((modelo, index) => (
                      <tr key={modelo._id} className={index % 2 === 0 ? 'row-even' : 'row-odd'}>
                        <td data-label="Nombre" className="col-nombre">{modelo.nombre}</td>
                        <td data-label="Descripción" className="col-descripcion">{modelo.descripcion}</td>
                        <td data-label="Categoría" className="col-categoria">{modelo.categoria}</td>
                        <td data-label="Material" className="col-material">{modelo.material || '-'}</td>
                        <td data-label="Alto" className="col-alto">{modelo.alto || '-'}</td>
                        <td data-label="Ancho" className="col-ancho">{modelo.ancho || '-'}</td>
                        <td data-label="Materiales (Cantidad)" className="col-materiales">
                          {modelo.materiales && modelo.materiales.length > 0
                            ? modelo.materiales.map(item => `${item.nombre} (${item.cantidad})`).join(', ')
                            : '-'}
                        </td>
                        <td data-label="Costo de Producción" className="col-costo">
                          ${Number(modelo.costoProduccion).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td data-label="Precio de Venta" className="col-precio">
                          ${Number(modelo.precioVenta).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td data-label="Imagen" className="col-imagen">
                          {modelo.imagenUrl ? (
                            <a href={modelo.imagenUrl} target="_blank" rel="noopener noreferrer">Ver</a>
                          ) : '-'}
                        </td>
                        <td data-label="Acciones" className="col-acciones">
                          <button
                            className="action-button edit-button"
                            onClick={() => handleEditarModelo(modelo._id)}
                            title="Editar"
                            disabled={loading}
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            className="action-button delete-button"
                            onClick={() => handleEliminarModelo(modelo._id)}
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
    </div>
  );
};

export default FormularioModelo;