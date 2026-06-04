import { useEffect, useState } from "react";
import {
  FaCalendarAlt,
  FaCheckCircle,
  FaChevronLeft,
  FaChevronRight,
  FaClock,
  FaExclamationCircle,
  FaFile,
  FaFlag,
  FaUser
} from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../api";
import Sidebar from "../sidebar";
import "./calendar.css";
import "./styles.css";

function Calendar() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [actividades, setActividades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userData, setUserData] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showDayModal, setShowDayModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const decoded = JSON.parse(jsonPayload);
        const userId = decoded.id || decoded.user_id;
        
        setUserData({
          id: userId,
          username: decoded.username || decoded.user_nicename || 'Usuario'
        });
      } catch (error) {
        console.error('Error al decodificar token:', error);
      }
    }
  }, []);

  useEffect(() => {
    if (userData?.id) {
      cargarActividades();
    }
  }, [userData]);

  const cargarActividades = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/users/${userData.id}/activities`);
      
      let actividadesArray = [];
      if (Array.isArray(response)) {
        actividadesArray = response;
      } else if (response && typeof response === 'object') {
        actividadesArray = Object.values(response);
      }
      
      setActividades(actividadesArray);
      setError(null);
    } catch (err) {
      console.error('Error al cargar actividades:', err);
      setError('No se pudieron cargar las actividades');
    } finally {
      setLoading(false);
    }
  };

  const mesAnterior = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const mesSiguiente = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const irAlMesActual = () => {
    setCurrentDate(new Date());
  };

 const obtenerDiasDelMes = () => {
  const año = currentDate.getFullYear();
  const mes = currentDate.getMonth();
  
  const primerDia = new Date(año, mes, 1);
  const ultimoDia = new Date(año, mes + 1, 0);
  
  const diasEnMes = ultimoDia.getDate();
  const diaSemanaInicio = primerDia.getDay();
  
  const inicioAjustado = diaSemanaInicio === 0 ? 6 : diaSemanaInicio - 1;
  
  const dias = [];
  
  // Días del mes anterior
  for (let i = 0; i < inicioAjustado; i++) {
    const fecha = new Date(año, mes, -i);
    dias.unshift({
      date: fecha,
      day: fecha.getDate(),
      month: 'prev',
      actividades: []
    });
  }
  
  // Días del mes actual
  for (let i = 1; i <= diasEnMes; i++) {
    const fecha = new Date(año, mes, i);
    
    // 🔥 CORREGIDO: Comparar fechas correctamente
    const actividadesDelDia = actividades.filter(act => {
      if (!act.end_date) return false;
      
      // Crear fecha de la actividad a las 12:00 hora local para evitar problemas de zona horaria
      const [year, month, day] = act.end_date.split('-').map(Number);
      const fechaActividad = new Date(year, month - 1, day, 12, 0, 0);
      
      return (
        fechaActividad.getFullYear() === fecha.getFullYear() &&
        fechaActividad.getMonth() === fecha.getMonth() &&
        fechaActividad.getDate() === fecha.getDate()
      );
    });
    
    dias.push({
      date: fecha,
      day: i,
      month: 'current',
      actividades: actividadesDelDia
    });
  }
  
  const diasRestantes = 42 - dias.length;
  for (let i = 1; i <= diasRestantes; i++) {
    const fecha = new Date(año, mes + 1, i);
    dias.push({
      date: fecha,
      day: fecha.getDate(),
      month: 'next',
      actividades: []
    });
  }
  
  return dias;
};

  const handleDayClick = (day) => {
    if (day.actividades.length > 0) {
      setSelectedDay(day);
      setShowDayModal(true);
      document.body.style.overflow = 'hidden';
    }
  };

  const handleCloseModal = () => {
    setShowDayModal(false);
    setSelectedDay(null);
    document.body.style.overflow = 'auto';
  };

  const handleVerActividad = (actividadId) => {
    const actividad = actividades.find(a => a.id === actividadId);
    if (actividad) {
      navigate(`/proyecto/${actividad.project_id}`);
    }
    handleCloseModal();
  };


const traducirPrioridad = (prioridad) => {
  const traducciones = {
    'high': 'Alta',
    'alta': 'Alta',
    'medium': 'Media',
    'media': 'Media',
    'low': 'Baja',
    'baja': 'Baja'
  };
  return traducciones[prioridad] || prioridad;
};

  const getEstadoIcon = (estado) => {
    switch(estado) {
      case 'completed':
        return <FaCheckCircle className="estado-icon completado" />;
      case 'in_progress':
        return <FaClock className="estado-icon progreso" />;
      default:
        return <FaExclamationCircle className="estado-icon pendiente" />;
    }
  };

  const getEstadoTexto = (estado) => {
    switch(estado) {
      case 'completed':
        return 'Completado';
      case 'in_progress':
        return 'En progreso';
      default:
        return 'Pendiente';
    }
  };

  const getPrioridadColor = (prioridad) => {
    switch(prioridad) {
      case 'high':
      case 'alta':
        return '#F44336';
      case 'medium':
      case 'media':
        return '#FFC107';
      case 'low':
      case 'baja':
        return '#4CAF50';
      default:
        return '#FFC107';
    }
  };

  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dias = obtenerDiasDelMes();

  return (
    <div className="panorama-container">
      <Sidebar />
      
      <main className="contenido-principal">
        <h1 className="titulo-panorama">Mi Calendario</h1>
        
        {userData && (
          <div className="calendar-user-info">
            <FaUser className="user-icon" />
            <span>Actividades asignadas a: <strong>{userData.username}</strong></span>
          </div>
        )}

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
        ) : error ? (
          <div className="error-message-banner">
            {error}
            <button onClick={() => window.location.reload()} className="btn-reintentar">
              Reintentar
            </button>
            
          </div>
        ) : (
          <>
            <div className="calendar-controls">
              <button className="calendar-nav-btn" onClick={mesAnterior}>
                <FaChevronLeft />
              </button>
              
              <div className="calendar-month-display">
                <span className="month-name">{meses[currentDate.getMonth()]}</span>
                <span className="year-name">{currentDate.getFullYear()}</span>
              </div>
              
              <button className="calendar-nav-btn" onClick={mesSiguiente}>
                <FaChevronRight />
              </button>
              
              <button className="calendar-today-btn" onClick={irAlMesActual}>
                Hoy
              </button>
            </div>

            <div className="calendar-grid">
              {diasSemana.map(dia => (
                <div key={dia} className="calendar-weekday">
                  {dia}
                </div>
              ))}

              {dias.map((dia, index) => (
                <div
                  key={index}
                  className={`calendar-day ${dia.month !== 'current' ? 'other-month' : ''} 
                    ${dia.actividades.length > 0 ? 'has-activities' : ''}
                    ${dia.date.toDateString() === new Date().toDateString() ? 'today' : ''}`}
                  onClick={() => handleDayClick(dia)}
                >
                  <span className="day-number">{dia.day}</span>
                  
                  {dia.actividades.length > 0 && (
                    <div className="day-activities-indicator">
                      <span className="activity-count">{dia.actividades.length}</span>
                      <div className="activity-preview">
                        {dia.actividades.slice(0, 3).map((act, idx) => (
                          <div key={idx} className="preview-dot" 
                               style={{ backgroundColor: getPrioridadColor(act.priority) }}
                               title={act.name} />
                        ))}
                        {dia.actividades.length > 3 && (
                          <span className="more-indicator">+{dia.actividades.length - 3}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="calendar-legend">
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: '#F44336' }}></span>
                <span>Prioridad alta</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: '#FFC107' }}></span>
                <span>Prioridad media</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ backgroundColor: '#4CAF50' }}></span>
                <span>Prioridad baja</span>
              </div>
            </div>
          </>
        )}
      </main>

      {showDayModal && selectedDay && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div 
            className="modal-contenido modal-calendar" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>
                <FaCalendarAlt className="modal-icon" />
                Actividades para {formatFecha(selectedDay.date)}
              </h2>
              <button className="modal-close" onClick={handleCloseModal}>
                <FaChevronLeft />
              </button>
            </div>

            <div className="modal-body">
              {selectedDay.actividades.length === 0 ? (
                <p className="no-activities">No hay actividades para este día</p>
              ) : (
                <div className="day-activities-list">
                  {selectedDay.actividades.map(actividad => (
                    <div 
                      key={actividad.id} 
                      className="activity-item"
                      onClick={() => handleVerActividad(actividad.id)}
                    >
                      <div className="activity-header">
                        <h4 className="activity-name">{actividad.name}</h4>
                        <div 
                          className="priority-badge"
                          style={{ backgroundColor: getPrioridadColor(actividad.priority) }}
                        >
                          <FaFlag size={10} />
              <span>{traducirPrioridad(actividad.priority)}</span>              </div>
                      </div>
                      
                      <div className="activity-status">
                        {getEstadoIcon(actividad.status)}
                        <span className="status-text">{getEstadoTexto(actividad.status)}</span>
                      </div>
                      
                      <div className="activity-footer">
                        {actividad.documentRequired === "1" && (
                          <span className="document-required">
                            <FaFile /> Requiere documento
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="modal-btn-cancelar" onClick={handleCloseModal}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Calendar;