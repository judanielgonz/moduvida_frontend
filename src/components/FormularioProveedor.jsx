import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus, faTimes, faSearch, faSort, faClipboardList } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../css/FormularioProveedor.css';

const baseUrl = 'http://localhost:5000/api';

const FormularioProveedor = () => {
  const [proveedores, setProveedores] = useState([]);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    telefono: '',
    email: '',
    comentario: '',
    tiempoEntregaEstimado: '',
    contactos: [{ nombreContacto: '', telefonoContacto: '', emailContacto: '', cargoContacto: '' }],
    catalogo: [],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('nombre');
  const [sortOrder, setSortOrder] = useState('asc');

  // Catálogo predeterminado para materiales de muebles
  const defaultCatalogo = [
    { nombre: 'Madera de pino', precio: 50, cantidadDisponible: 100, unidadMedida: 'metro cuadrado' },
    { nombre: 'Tela de tapicería', precio: 20, cantidadDisponible: 200, unidadMedida: 'metro' },
    { nombre: 'Espuma de poliuretano', precio: 30, cantidadDisponible: 50, unidadMedida: 'metro cúbico' },
    { nombre: 'Clavos de carpintería', precio: 5, cantidadDisponible: 1000, unidadMedida: 'unidad' },
    { nombre: 'Tornillos para madera', precio: 8, cantidadDisponible: 500, unidadMedida: 'unidad' },
  ];

  // Obtener proveedores al cargar el componente
  useEffect(() => {
    fetchProveedores();
  }, []);

  const fetchProveedores = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`${baseUrl}/proveedores`);
      setProveedores(response.data.data || []);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(`Error al cargar proveedores: ${errorMessage}`);
      toast.error(`Error al cargar proveedores: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Manejar cambios en los campos del formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Manejar cambios en los contactos
  const handleContactoChange = (index, e) => {
    const { name, value } = e.target;
    const contactos = [...formData.contactos];
    contactos[index] = { ...contactos[index], [name]: value };
    setFormData({ ...formData, contactos });
  };

  // Agregar nuevo contacto
  const addContacto = () => {
    setFormData({
      ...formData,
      contactos: [
        ...formData.contactos,
        { nombreContacto: '', telefonoContacto: '', emailContacto: '', cargoContacto: '' },
      ],
    });
  };

  // Eliminar contacto
  const removeContacto = (index) => {
    const contactos = formData.contactos.filter((_, i) => i !== index);
    setFormData({ ...formData, contactos });
  };

  // Abrir formulario para crear/editar
  const handleOpen = (proveedor = null) => {
    if (proveedor) {
      setEditId(proveedor._id);
      setFormData({
        nombre: proveedor.nombre,
        direccion: proveedor.direccion,
        telefono: proveedor.telefono,
        email: proveedor.email,
        comentario: proveedor.comentario || '',
        tiempoEntregaEstimado: proveedor.tiempoEntregaEstimado || '',
        contactos: proveedor.contactos.length
          ? proveedor.contactos
          : [{ nombreContacto: '', telefonoContacto: '', emailContacto: '', cargoContacto: '' }],
        catalogo: proveedor.catalogo.length ? proveedor.catalogo : defaultCatalogo,
      });
    } else {
      setEditId(null);
      setFormData({
        nombre: '',
        direccion: '',
        telefono: '',
        email: '',
        comentario: '',
        tiempoEntregaEstimado: '',
        contactos: [{ nombreContacto: '', telefonoContacto: '', emailContacto: '', cargoContacto: '' }],
        catalogo: defaultCatalogo,
      });
    }
  };

  // Cerrar formulario
  const handleClose = () => {
    setEditId(null);
    setFormData({
      nombre: '',
      direccion: '',
      telefono: '',
      email: '',
      comentario: '',
      tiempoEntregaEstimado: '',
      contactos: [{ nombreContacto: '', telefonoContacto: '', emailContacto: '', cargoContacto: '' }],
      catalogo: defaultCatalogo,
    });
  };

  // Guardar proveedor (crear o actualizar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.nombre ||
      !formData.direccion ||
      !formData.telefono ||
      !formData.email ||
      formData.contactos.some(
        (c) => !c.nombreContacto || !c.telefonoContacto || !c.emailContacto || !c.cargoContacto
      )
    ) {
      toast.error('Por favor, complete todos los campos requeridos.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const payload = {
        ...formData,
        catalogo: formData.catalogo.map(item => ({
          nombre: item.nombre,
          precio: Number(item.precio),
          cantidadDisponible: Number(item.cantidadDisponible),
          unidadMedida: item.unidadMedida || 'unidad',
        })),
      };
      if (editId) {
        await axios.put(`${baseUrl}/proveedores/${editId}`, payload);
        toast.success('Proveedor actualizado correctamente');
      } else {
        await axios.post(`${baseUrl}/proveedores`, payload);
        toast.success('Proveedor creado correctamente');
      }
      await fetchProveedores();
      handleClose();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(`Error al guardar proveedor: ${errorMessage}`);
      toast.error(`Error al guardar proveedor: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Eliminar proveedor
  const handleDelete = async (id) => {
    try {
      setLoading(true);
      setError('');
      await axios.delete(`${baseUrl}/proveedores/${id}`);
      setProveedores(proveedores.filter((proveedor) => proveedor._id !== id));
      toast.success('Proveedor eliminado correctamente');
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message;
      setError(`Error al eliminar proveedor: ${errorMessage}`);
      toast.error(`Error al eliminar proveedor: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  // Manejar búsqueda
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Manejar ordenamiento
  const handleSortByChange = (e) => {
    setSortBy(e.target.value);
  };

  const handleSortOrderChange = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  // Filtrar y ordenar proveedores
  const filteredAndSortedProveedores = proveedores
    .filter((proveedor) =>
      proveedor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proveedor.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'nombre') {
        comparison = a.nombre.localeCompare(b.nombre);
      } else if (sortBy === 'telefono') {
        comparison = a.telefono.localeCompare(b.telefono);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  return (
    <div className="proveedores-container">
      <ToastContainer position="top-right" autoClose={3000} />
      <header className="proveedores-header">
        <h2>
          <FontAwesomeIcon icon={faClipboardList} /> Gestión de Proveedores
        </h2>
      </header>

      {loading && <div className="loading-message">Cargando...</div>}
      {error && <div className="error-message">{error}</div>}

      <section className="form-section">
        <div className="form-card">
          <h3>
            <FontAwesomeIcon icon={faPlus} /> {editId ? 'Editar Proveedor' : 'Crear Proveedor'}
          </h3>
          <form onSubmit={handleSubmit} className="proveedores-form">
            <div className="form-group">
              <label htmlFor="nombre">Nombre</label>
              <input
                id="nombre"
                type="text"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="direccion">Dirección</label>
              <input
                id="direccion"
                type="text"
                name="direccion"
                value={formData.direccion}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="telefono">Teléfono</label>
              <input
                id="telefono"
                type="text"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="comentario">Comentario</label>
              <input
                id="comentario"
                type="text"
                name="comentario"
                value={formData.comentario}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="tiempoEntregaEstimado">Tiempo de Entrega (días)</label>
              <input
                id="tiempoEntregaEstimado"
                type="number"
                name="tiempoEntregaEstimado"
                value={formData.tiempoEntregaEstimado}
                onChange={handleInputChange}
              />
            </div>
            <div className="contactos-section">
              <h4>Contactos</h4>
              {formData.contactos.map((contacto, index) => (
                <div className="contacto-row" key={index}>
                  <div className="form-group">
                    <label htmlFor={`nombreContacto-${index}`}>Nombre Contacto</label>
                    <input
                      id={`nombreContacto-${index}`}
                      type="text"
                      name="nombreContacto"
                      value={contacto.nombreContacto}
                      onChange={(e) => handleContactoChange(index, e)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor={`telefonoContacto-${index}`}>Teléfono Contacto</label>
                    <input
                      id={`telefonoContacto-${index}`}
                      type="text"
                      name="telefonoContacto"
                      value={contacto.telefonoContacto}
                      onChange={(e) => handleContactoChange(index, e)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor={`emailContacto-${index}`}>Email Contacto</label>
                    <input
                      id={`emailContacto-${index}`}
                      type="email"
                      name="emailContacto"
                      value={contacto.emailContacto}
                      onChange={(e) => handleContactoChange(index, e)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor={`cargoContacto-${index}`}>Cargo Contacto</label>
                    <input
                      id={`cargoContacto-${index}`}
                      type="text"
                      name="cargoContacto"
                      value={contacto.cargoContacto}
                      onChange={(e) => handleContactoChange(index, e)}
                      required
                    />
                  </div>
                  <button
                    type="button"
                    className="btn-delete-contacto"
                    onClick={() => removeContacto(index)}
                    disabled={formData.contactos.length === 1}
                    title="Eliminar contacto"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn-add-contacto"
                onClick={addContacto}
              >
                <FontAwesomeIcon icon={faPlus} /> Agregar Contacto
              </button>
            </div>
            <div className="form-buttons">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Guardando...' : (editId ? 'Actualizar' : 'Crear')}
              </button>
              <button type="button" className="btn-secondary" onClick={handleClose} disabled={loading}>
                <FontAwesomeIcon icon={faTimes} /> Cancelar
              </button>
            </div>
          </form>
        </div>
      </section>

      <section className="proveedores-lista">
        <div className="proveedores-lista-header">
          <h3>Lista de Proveedores</h3>
        </div>
        <div className="filters-card">
          <div className="proveedores-form">
            <div className="form-group">
              <label htmlFor="search">Buscar Proveedor</label>
              <div className="search-wrapper">
                <input
                  id="search"
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  placeholder="Buscar por nombre o email..."
                />
                <FontAwesomeIcon icon={faSearch} className="search-icon" />
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="sortBy">Ordenar por</label>
              <div className="sort-wrapper">
                <select id="sortBy" value={sortBy} onChange={handleSortByChange}>
                  <option value="nombre">Nombre</option>
                  <option value="telefono">Teléfono</option>
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
                  <th className="col-nombre">Nombre</th>
                  <th className="col-email">Email</th>
                  <th className="col-telefono">Teléfono</th>
                  <th className="col-catalogo">Catálogo</th>
                  <th className="col-acciones">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedProveedores.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="empty-message">
                      {searchTerm ? 'No hay proveedores que coincidan con la búsqueda.' : 'No hay proveedores registrados.'}
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedProveedores.map((proveedor, index) => (
                    <tr key={proveedor._id} className={index % 2 === 0 ? 'row-even' : 'row-odd'}>
                      <td data-label="Nombre" className="col-nombre">{proveedor.nombre}</td>
                      <td data-label="Email" className="col-email">{proveedor.email}</td>
                      <td data-label="Teléfono" className="col-telefono">{proveedor.telefono}</td>
                      <td data-label="Catálogo" className="col-catalogo">
                        {proveedor.catalogo.length > 0
                          ? proveedor.catalogo.map((item, idx) => (
                              <div key={idx}>
                                {item.nombre} - ${item.precio.toLocaleString('es-VE')} ({item.cantidadDisponible} {item.unidadMedida})
                              </div>
                            ))
                          : 'Sin materiales'}
                      </td>
                      <td data-label="Acciones" className="actions-cell col-acciones">
                        <button
                          className="action-button edit-button"
                          onClick={() => handleOpen(proveedor)}
                          title="Editar"
                        >
                          <FontAwesomeIcon icon={faEdit} />
                        </button>
                        <button
                          className="action-button delete-button"
                          onClick={() => handleDelete(proveedor._id)}
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

export default FormularioProveedor;