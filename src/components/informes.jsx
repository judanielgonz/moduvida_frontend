import React, { useState } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartPie, faRobot } from '@fortawesome/free-solid-svg-icons';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../css/Informes.css';

import baseUrl from '../config'; // Importa la URL base
const GEMINI_API_KEY = 'AIzaSyCE8L7oAQ0hkzdbaFI_5rceaNwSuhZN_gI'; // Debería estar en .env para producción
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';

const Informes = () => {
  const [tipoInforme, setTipoInforme] = useState('ventas');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [informe, setInforme] = useState(null);
  const [aiInsights, setAiInsights] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [userQuery, setUserQuery] = useState('');

  const handleGenerarInforme = async () => {
    if (!fechaInicio || !fechaFin) {
      toast.error('Por favor, selecciona un rango de fechas.');
      return;
    }
    try {
      const response = await axios.get(`${baseUrl}/informes/${tipoInforme}`, {
        params: { fechaInicio, fechaFin },
      });
      setInforme(response.data.data);
      setAiInsights(null); // Reset AI insights
      toast.success('Informe generado correctamente');
    } catch (error) {
      console.error('Error al generar el informe:', error);
      toast.error(`Error al generar el informe: ${error.response?.data?.message || error.message}`);
      setInforme(null);
      setAiInsights(null);
    }
  };

  const handleGenerateAiInsights = async () => {
    if (!informe) {
      toast.error('Por favor, genera un informe primero.');
      return;
    }

    setAiLoading(true);
    try {
      let prompt = tipoInforme === 'ventas'
        ? `Analiza el siguiente informe de ventas y genera un análisis claro y profesional en un tono natural, como un informe objetivo sin saludos ni referencias personales como nombres de clientes. Proporciona un resumen breve de los datos clave y ofrece sugerencias prácticas integradas de forma fluida en el texto, sin usar encabezados como "Recomendaciones:" ni numerarlas. Si el usuario proporciona una consulta adicional, intégrala en el análisis y responde específicamente a ella. Evita usar símbolos como ** o negritas, y asegúrate de que el texto sea fácil de leer y conversacional, pero manteniendo un tono profesional.\n\n` +
          `Período: ${new Date(fechaInicio).toLocaleDateString('es-VE')} - ${new Date(fechaFin).toLocaleDateString('es-VE')}\n` +
          `Total de Ingresos: $${(informe.totalIngresos || 0).toLocaleString('es-VE')}\n` +
          `Número de Ventas: ${informe.numeroVentas || 0}\n` +
          `Productos Vendidos:\n${informe.productosVendidos?.map(p => `- ${p.modelo}: ${p.cantidad} unidades, Subtotal: $${p.subtotal.toLocaleString('es-VE')}`).join('\n') || 'Ninguno'}\n` +
          `Detalles de Pagos:\n${informe.pedidos?.map(p => `- Cliente: ${p.cliente?.nombre || 'Desconocido'} ${p.cliente?.apellido || ''}, Método de Pago: ${p.metodoPago}, Con Factura: ${p.conFactura ? 'Sí' : 'No'}, Precio Total: $${p.precioTotal.toLocaleString('es-VE')}`).join('\n') || 'Ninguno'}\n`
        : `Analiza el siguiente informe de inventario y genera un análisis claro y profesional en un tono natural, como un informe objetivo sin saludos ni referencias personales como nombres de clientes. Proporciona un resumen breve de los datos clave y ofrece sugerencias prácticas integradas de forma fluida en el texto, sin usar encabezados como "Recomendaciones:" ni numerarlas. Si el usuario proporciona una consulta adicional, intégrala en el análisis y responde específicamente a ella. Evita usar símbolos como ** o negritas, y asegúrate de que el texto sea fácil de leer y conversacional, pero manteniendo un tono profesional.\n\n` +
          `Fecha de Generación: ${new Date().toLocaleString('es-VE')}\n` +
          `Valor Total del Inventario: $${(informe.valorTotalInventario || 0).toLocaleString('es-VE')}\n` +
          `Número de Productos: ${informe.numeroProductos || 0}\n` +
          `Detalles del Inventario:\n${informe.inventario?.map(i => `- ${i.modelo}: Disponible: ${i.cantidadDisponible}, Reservado: ${i.cantidadReservada}, Valor: $${i.valor.toLocaleString('es-VE')}`).join('\n') || 'Ninguno'}\n`;

      if (userQuery.trim()) {
        prompt += `\nConsulta del usuario: ${userQuery}\nPor favor, incluye una respuesta clara y específica a esta consulta como parte de tu análisis.`;
      }

      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                { text: prompt }
              ]
            }
          ]
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      let aiResponse = response.data.candidates[0].content.parts[0].text;
      aiResponse = aiResponse.replace(/\*\*/g, ''); // Asegurar que no haya formato no deseado
      setAiInsights(aiResponse);
      toast.success('Análisis generado correctamente');
    } catch (error) {
      console.error('Error al generar análisis de IA:', error);
      toast.error(`Error al generar análisis de IA: ${error.response?.data?.error?.message || error.message}`);
      setAiInsights(null);
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="informes-container">
      <ToastContainer position="top-right" autoClose={3000} />
      <h2>
        <FontAwesomeIcon icon={faChartPie} /> Generación de Informes
      </h2>

      <div className="form-card">
        <h3>Configurar Informe</h3>
        <form className="informes-form">
          <div className="form-group">
            <label>Tipo de Informe</label>
            <select value={tipoInforme} onChange={(e) => setTipoInforme(e.target.value)} required>
              <option value="ventas">Ventas</option>
              <option value="inventario">Inventario</option>
            </select>
          </div>
          <div className="form-group">
            <label>Fecha Inicio</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              max={fechaFin || new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          <div className="form-group">
            <label>Fecha Fin</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              min={fechaInicio}
              max={new Date().toISOString().split('T')[0]}
              required
            />
          </div>
          <div className="form-buttons">
            <button type="button" className="btn-primary" onClick={handleGenerarInforme}>
              Generar Informe
            </button>
            {informe && (
              <button
                type="button"
                className="btn-primary"
                onClick={handleGenerateAiInsights}
                disabled={aiLoading}
              >
                <FontAwesomeIcon icon={faRobot} /> {aiLoading ? 'Analizando...' : 'Analizar Informe'}
              </button>
            )}
          </div>
        </form>
      </div>

      {informe && (
        <div className="informe-resultado">
          <h3>{tipoInforme === 'ventas' ? 'Informe de Ventas' : 'Informe de Inventario'}</h3>
          {tipoInforme === 'ventas' ? (
            <>
              <p>
                <strong>Período:</strong> {new Date(fechaInicio).toLocaleDateString('es-VE')} -{' '}
                {new Date(fechaFin).toLocaleDateString('es-VE')}
              </p>
              <p><strong>Total de Ingresos:</strong> ${(informe.totalIngresos || 0).toLocaleString('es-VE')}</p>
              <p><strong>Número de Ventas:</strong> {informe.numeroVentas || 0}</p>
              <h4>Productos Vendidos</h4>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Modelo</th>
                      <th>Cantidad</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {informe.productosVendidos && informe.productosVendidos.length > 0 ? (
                      informe.productosVendidos.map((producto, index) => (
                        <tr key={index}>
                          <td data-label="Modelo">{producto.modelo || 'Desconocido'}</td>
                          <td data-label="Cantidad">{producto.cantidad || 0}</td>
                          <td data-label="Subtotal">${(producto.subtotal || 0).toLocaleString('es-VE')}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3">No hay productos vendidos.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <h4>Detalles de Ventas</h4>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Fecha de Entrega</th>
                      <th>Modelos</th>
                      <th>Cantidades</th>
                      <th>Método de Pago</th>
                      <th>Con Factura</th>
                      <th>Precio Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {informe.pedidos && informe.pedidos.length > 0 ? (
                      informe.pedidos.map((pedido) => (
                        <tr key={pedido._id}>
                          <td data-label="Cliente">
                            {pedido.cliente?.nombre || 'Desconocido'} {pedido.cliente?.apellido || ''}
                          </td>
                          <td data-label="Fecha de Entrega">
                            {new Date(pedido.fechaEntrega).toLocaleDateString('es-VE')}
                          </td>
                          <td data-label="Modelos">
                            {pedido.modelos.map((item, index) => (
                              <div key={index}>{item.modelo?.nombre || 'Desconocido'}</div>
                            ))}
                          </td>
                          <td data-label="Cantidades">
                            {pedido.modelos.map((item, index) => (
                              <div key={index}>{item.cantidad}</div>
                            ))}
                          </td>
                          <td data-label="Método de Pago">{pedido.metodoPago || 'Desconocido'}</td>
                          <td data-label="Con Factura">{pedido.conFactura ? 'Sí' : 'No'}</td>
                          <td data-label="Precio Total">${(pedido.precioTotal || 0).toLocaleString('es-VE')}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7">No hay pedidos registrados.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <>
              <p>
                <strong>Fecha de Generación:</strong> {new Date().toLocaleString('es-VE', {
                  hour: '2-digit',
                  minute: '2-digit',
                  hour12: true,
                })}
              </p>
              <p><strong>Valor Total del Inventario:</strong> ${(informe.valorTotalInventario || 0).toLocaleString('es-VE')}</p>
              <p><strong>Número de Productos:</strong> {informe.numeroProductos || 0}</p>
              <h4>Detalles del Inventario</h4>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Modelo</th>
                      <th>Cantidad Disponible</th>
                      <th>Cantidad Reservada</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {informe.inventario && informe.inventario.length > 0 ? (
                      informe.inventario.map((item, index) => (
                        <tr key={index}>
                          <td data-label="Modelo">{item.modelo || 'Desconocido'}</td>
                          <td data-label="Cantidad Disponible">{item.cantidadDisponible || 0}</td>
                          <td data-label="Cantidad Reservada">{item.cantidadReservada || 0}</td>
                          <td data-label="Valor">${(item.valor || 0).toLocaleString('es-VE')}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4">No hay inventario registrado.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}

      {informe && (
        <div className="form-card">
          <h3>Consulta Personalizada</h3>
          <div className="form-group">
            <label>Escribe tu consulta sobre el informe</label>
            <textarea
              value={userQuery}
              onChange={(e) => setUserQuery(e.target.value)}
              placeholder="Ejemplo: ¿Qué productos tienen bajo inventario? ¿Cuáles son las ventas más altas?"
              rows="4"
              style={{ resize: 'vertical', width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #d1d5db' }}
            />
          </div>
          <div className="form-buttons">
            <button
              type="button"
              className="btn-primary"
              onClick={handleGenerateAiInsights}
              disabled={aiLoading}
            >
              <FontAwesomeIcon icon={faRobot} /> {aiLoading ? 'Analizando...' : 'Analizar Informe'}
            </button>
          </div>
        </div>
      )}

      {aiInsights && (
        <div className="ai-insights">
          <h3>
            <FontAwesomeIcon icon={faRobot} /> Análisis de Informe
          </h3>
          <div className="ai-content">
            {aiInsights.split('\n').map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Informes;