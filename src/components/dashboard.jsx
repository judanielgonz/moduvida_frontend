import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import '../css/dashboard.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const baseUrl = 'http://localhost:5000/api';

const Dashboard = () => {
  const [ordenesPendientes, setOrdenesPendientes] = useState(0);
  const [stockBajo, setStockBajo] = useState(0);
  const [ingresosMes, setIngresosMes] = useState(0);
  const [ventasPorModelo, setVentasPorModelo] = useState([]);
  const [actividadReciente, setActividadReciente] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [ordenesRes, stockRes, ingresosRes, ventasRes, actividadRes] = await Promise.all([
          axios.get(`${baseUrl}/estadisticas/ordenes-pendientes`),
          axios.get(`${baseUrl}/estadisticas/stock-bajo`),
          axios.get(`${baseUrl}/estadisticas/ingresos-mes`),
          axios.get(`${baseUrl}/estadisticas/ventas-por-modelo`),
          axios.get(`${baseUrl}/estadisticas/actividad-reciente`),
        ]);

        console.log('Ventas por modelo:', ventasRes.data.data); // Depuración
        console.log('Actividad reciente:', actividadRes.data.data); // Depuración

        setOrdenesPendientes(ordenesRes.data.data);
        setStockBajo(stockRes.data.data);
        setIngresosMes(ingresosRes.data.data);
        setVentasPorModelo(ventasRes.data.data);
        setActividadReciente(actividadRes.data.data);
        setError(null);
      } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
        setError(`Error al cargar los datos: ${error.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const chartData = {
    labels: ventasPorModelo.map(item => item.modelo),
    datasets: [
      {
        label: 'Ventas del Mes (Junio 2025)',
        data: ventasPorModelo.map(item => item.cantidad),
        backgroundColor: ['#007bff', '#28a745', '#dc3545', '#ffc107', '#17a2b8'],
        borderColor: ['#0056b3', '#218838', '#c82333', '#e0a800', '#138496'],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="dashboard-container">
      <h2>Resumen del Sistema</h2>
      {error && <div className="error-message">{error}</div>}
      {loading && <div className="loading-message">Cargando datos...</div>}

      <div className="dashboard-cards">
        <div className="dashboard-card">
          <h3>Órdenes Pendientes</h3>
          <p>{loading ? '...' : ordenesPendientes}</p>
        </div>
        <div className="dashboard-card">
          <h3>Stock Bajo</h3>
          <p>{loading ? '...' : `${stockBajo} Artículos`}</p>
        </div>
        <div className="dashboard-card">
          <h3>Ingresos del Mes</h3>
          <p>{loading ? '...' : `Bs ${ingresosMes.toLocaleString('es-BO', { style: 'currency', currency: 'BOB' })}`}</p>
        </div>
      </div>

      <div className="dashboard-grafico">
        <h3>Ventas por Modelo (Junio 2025)</h3>
        {loading ? (
          <p>Cargando gráfico...</p>
        ) : ventasPorModelo.length > 0 ? (
          <div className="chart-wrapper">
            <Bar
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'top' },
                  title: { display: true, text: 'Ventas por Modelo (Junio 2025)' },
                  tooltip: { enabled: true },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: { display: true, text: 'Cantidad Vendida' },
                  },
                  x: {
                    title: { display: true, text: 'Modelos' },
                    ticks: { autoSkip: false, maxRotation: 45, minRotation: 45 },
                  },
                },
              }}
              height={400}
            />
          </div>
        ) : (
          <p>No hay datos de ventas disponibles para este mes.</p>
        )}
      </div>

      <div className="dashboard-actividad">
        <h3>Actividad Reciente</h3>
        {loading ? (
          <p>Cargando actividad...</p>
        ) : actividadReciente.length > 0 ? (
          <ul className="actividad-lista">
            {actividadReciente.map((item, index) => (
              <li key={index} className="actividad-item">
                <span className="actividad-tipo">{item.tipo}</span>: {item.descripcion} -{' '}
                {new Date(item.fecha).toLocaleString('es-BO', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </li>
            ))}
          </ul>
        ) : (
          <p>No hay actividad reciente disponible.</p>
        )}
      </div>
    </div>
  );
};

export default Dashboard;