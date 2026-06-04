import { useEffect, useState } from "react";
import {
  FaCalendarAlt,
  FaFilter,
  FaFolderOpen,
  FaSearch,
  FaSortAmountDown,
  FaSortAmountUp,
  FaTimes,
  FaUsers
} from "react-icons/fa";
import { MdDescription } from "react-icons/md";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiClient } from "../../api";
import Sidebar from "../sidebar";
import "./search.css";
import "./styles.css";

function Search() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSearchTerm = searchParams.get('q') || '';
  
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [filtroAbierto, setFiltroAbierto] = useState(false);
  const [orden, setOrden] = useState("reciente");
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  
  const [usuarios, setUsuarios] = useState({});

  const cargarUsuarios = async () => {
    try {
      const response = await apiClient.get('/users');
      let usuariosArray = [];
      if (Array.isArray(response)) {
        usuariosArray = response;
      } else if (response && typeof response === 'object') {
        usuariosArray = Object.values(response);
      }
      
      const mapaUsuarios = {};
      usuariosArray.forEach(u => {
        mapaUsuarios[u.ID] = {
          display_name: u.display_name,
          username: u.username
        };
      });
      
      setUsuarios(mapaUsuarios);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
    }
  };

  const getNombreResponsable = (userId) => {
    if (!userId) return 'No asignado';
    const user = usuarios[userId];
    return user ? (user.display_name || user.username) : `Usuario ${userId}`;
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  useEffect(() => {
    const realizarBusqueda = async () => {
      setCargando(true);
      setError(null);
      
      try {
        const proyectosData = await apiClient.get('/projects');
        let proyectosArray = [];
        if (Array.isArray(proyectosData)) {
          proyectosArray = proyectosData;
        } else if (proyectosData && typeof proyectosData === 'object') {
          proyectosArray = Object.values(proyectosData);
        }

        const proyectosConInfo = await Promise.all(
          proyectosArray.map(async (proyecto) => {
            try {
              const actividadesData = await apiClient.get(`/projects/${proyecto.id}/activities`);
              let actividadesArray = [];
              if (Array.isArray(actividadesData)) {
                actividadesArray = actividadesData;
              } else if (actividadesData && typeof actividadesData === 'object') {
                actividadesArray = Object.values(actividadesData);
              }

              const actividadesCompletadas = actividadesArray.filter(a => a.status === 'completed').length;
              const totalActividades = actividadesArray.length;
              const progreso = totalActividades > 0 
                ? Math.round((actividadesCompletadas / totalActividades) * 100) 
                : 0;

              const users = await apiClient.get(`/projects/${proyecto.id}/users`);
              let usersArray = [];
              if (Array.isArray(users)) {
                usersArray = users;
              } else if (users && typeof users === 'object') {
                usersArray = Object.values(users);
              }
              
              return {
                id: proyecto.id,
                nombre: proyecto.name,
                descripcion: proyecto.description,
                fechaCreacion: proyecto.created_at?.split(' ')[0] || '',
                progreso: progreso,
                totalActividades: totalActividades,
                actividadesCompletadas: actividadesCompletadas,
                responsables: usersArray.map(u => u.display_name || u.user_login)
              };
            } catch (err) {
              console.log(`Error cargando datos para proyecto ${proyecto.id}:`, err);
              return {
                id: proyecto.id,
                nombre: proyecto.name,
                descripcion: proyecto.description,
                fechaCreacion: proyecto.created_at?.split(' ')[0] || '',
                progreso: 0,
                totalActividades: 0,
                actividadesCompletadas: 0,
                responsables: []
              };
            }
          })
        );

        let filtrados = proyectosConInfo.filter(proyecto => {
          const termino = searchTerm.toLowerCase().trim();
          
          if (termino === "") return true;
          
          return (
            proyecto.nombre.toLowerCase().includes(termino) ||
            proyecto.descripcion.toLowerCase().includes(termino) ||
            proyecto.responsables.some(r => r.toLowerCase().includes(termino))
          );
        });

        filtrados.sort((a, b) => {
          const fechaA = new Date(a.fechaCreacion);
          const fechaB = new Date(b.fechaCreacion);
          
          if (orden === "reciente") {
            return fechaB - fechaA;
          } else {
            return fechaA - fechaB;
          }
        });

        setResultados(filtrados);
      } catch (err) {
        console.error('Error en la búsqueda:', err);
        setError('Error al realizar la búsqueda. Intenta de nuevo.');
      } finally {
        setCargando(false);
      }
    };

    realizarBusqueda();
  }, [searchTerm, orden]);

  const handleSearchChange = (e) => {
    const newTerm = e.target.value;
    setSearchTerm(newTerm);
    
    if (newTerm.trim()) {
      setSearchParams({ q: newTerm.trim() });
    } else {
      setSearchParams({});
    }
  };

  const toggleFiltro = () => {
    setFiltroAbierto(!filtroAbierto);
  };

  const cambiarOrden = (nuevoOrden) => {
    setOrden(nuevoOrden);
  };

  const limpiarBusqueda = () => {
    setSearchTerm("");
    setSearchParams({});
  };

  const handleVerProyecto = (proyectoId) => {
    navigate(`/proyecto/${proyectoId}`);
  };

  const formatFecha = (fecha) => {
    if (!fecha) return 'Fecha no disponible';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(fecha).toLocaleDateString('es-MX', options);
  };

  return (
    <div className="panorama-container">
      <Sidebar />
      
      <main className="contenido-principal">
        <h1 className="titulo-panorama">Búsqueda de Proyectos</h1>
        
        <div className="search-section">
          <div className="search-bar-container">
            <div className="search-input-wrapper">
              <FaSearch className="search-input-icon" />
              <input
                type="text"
                className="search-input-field"
                placeholder="Buscar proyectos por nombre, descripción o responsable..."
                value={searchTerm}
                onChange={handleSearchChange}
                autoFocus
              />
              {searchTerm && (
                <button className="search-clear-btn" onClick={limpiarBusqueda}>
                  <FaTimes />
                </button>
              )}
            </div>
            
            <button 
              className={`filter-toggle-btn ${filtroAbierto ? 'active' : ''}`}
              onClick={toggleFiltro}
            >
              <FaFilter className="filter-icon" />
              <span>Filtros</span>
            </button>
          </div>

          {filtroAbierto && (
            <div className="filter-panel">
              <h3 className="filter-title">
                <FaSortAmountDown className="filter-title-icon" />
                Ordenar por fecha de creación
              </h3>
              
              <div className="filter-options">
                <button
                  className={`filter-option ${orden === 'reciente' ? 'active' : ''}`}
                  onClick={() => cambiarOrden('reciente')}
                >
                  <FaSortAmountDown className="option-icon" />
                  <span>Más recientes primero</span>
                </button>
                
                <button
                  className={`filter-option ${orden === 'antiguo' ? 'active' : ''}`}
                  onClick={() => cambiarOrden('antiguo')}
                >
                  <FaSortAmountUp className="option-icon" />
                  <span>Más antiguos primero</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="error-message-banner">
            {error}
            <button onClick={() => setError(null)} className="close-error">
              <FaTimes />
            </button>
          </div>
        )}

        <div className="search-results-section">
          <div className="results-header">
            <h2 className="results-title">
              <FaFolderOpen className="results-icon" />
              Resultados {searchTerm && `para "${searchTerm}"`}
            </h2>
            <span className="results-count">
              {resultados.length} proyecto{resultados.length !== 1 ? 's' : ''} encontrado{resultados.length !== 1 ? 's' : ''}
            </span>
          </div>

          {cargando ? (
            <div className="search-loading">
              <div className="loading-spinner"></div>
              <p>Buscando proyectos...</p>
            </div>
          ) : (
            <>
              {resultados.length > 0 ? (
                <div className="results-grid">
                  {resultados.map(proyecto => (
                    <div 
                      key={proyecto.id} 
                      className="proyecto-search-card clickable"
                      onClick={() => handleVerProyecto(proyecto.id)}
                    >
                      <div className="card-header">
                        <h3 className="card-titulo">{proyecto.nombre}</h3>
                        <div 
                          className={`card-progreso ${
                            proyecto.progreso >= 100 ? 'completado' : 
                            proyecto.progreso > 0 ? 'en-progreso' : 'pendiente'
                          }`}
                          title={`${proyecto.actividadesCompletadas} de ${proyecto.totalActividades} actividades completadas`}
                        >
                          {proyecto.progreso}%
                        </div>
                      </div>
                      
                      <p className="card-descripcion">
                        <MdDescription className="card-icon" />
                        {proyecto.descripcion}
                      </p>
                      
                      <div className="card-responsables">
                        <FaUsers className="card-icon" />
                        <div className="responsables-lista">
                          {proyecto.responsables.length > 0 ? (
                            proyecto.responsables.map((responsable, idx) => (
                              <span key={idx} className="responsable-tag">
                                {responsable}
                              </span>
                            ))
                          ) : (
                            <span className="responsable-tag">Sin responsables</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="card-footer">
                        <div className="card-fecha">
                          <FaCalendarAlt className="card-icon" />
                          <span>Creado: {formatFecha(proyecto.fechaCreacion)}</span>
                        </div>
                        <div className="card-actividades">
                          <span className="actividades-count">
                            {proyecto.actividadesCompletadas}/{proyecto.totalActividades} actividades
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="no-results-search">
                  <FaSearch className="no-results-icon" />
                  <h3>No se encontraron proyectos</h3>
                  <p>Intenta con otros términos de búsqueda o ajusta los filtros</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

export default Search;