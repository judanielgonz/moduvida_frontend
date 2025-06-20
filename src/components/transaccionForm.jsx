import React, { useState } from 'react';
import axios from 'axios';

import baseUrl from '../config'; // Importa la URL base

const TransaccionForm = ({ modelos, onTransaccionRealizada }) => {
  const [modeloId, setModeloId] = useState('');
  const [tipoTransaccion, setTipoTransaccion] = useState('entrada');
  const [cantidad, setCantidad] = useState(0);
  const [nota, setNota] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const transaccionData = {
      modelo: modeloId,
      tipoTransaccion,
      cantidad,
      nota,
    };

    try {
      await axios.post(`${baseUrl}/transacciones`, transaccionData);
      setModeloId('');
      setTipoTransaccion('entrada');
      setCantidad(0);
      setNota('');
      onTransaccionRealizada();
    } catch (error) {
      console.error('Error al realizar la transacción:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h4>Transacción</h4>
      <div>
        <label>Modelo:</label>
        <select
          value={modeloId}
          onChange={(e) => setModeloId(e.target.value)}
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
      <div>
        <label>Tipo de Transacción:</label>
        <select
          value={tipoTransaccion}
          onChange={(e) => setTipoTransaccion(e.target.value)}
          required
        >
          <option value="entrada">Compra (Entrada)</option>
          <option value="salida">Venta (Salida)</option>
        </select>
      </div>
      <div>
        <label>Cantidad:</label>
        <input
          type="number"
          value={cantidad}
          onChange={(e) => setCantidad(Number(e.target.value))}
          required
        />
      </div>
      <div>
        <label>Nota:</label>
        <input
          type="text"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
        />
      </div>
      <button type="submit">Realizar Transacción</button>
    </form>
  );
};

export default TransaccionForm;