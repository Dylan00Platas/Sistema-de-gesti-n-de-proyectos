import { useEffect, useState } from "react";
import { FaCalendarAlt, FaCheckCircle, FaChevronDown, FaExclamationCircle, FaSave, FaTimes, FaUser } from "react-icons/fa";
import { MdAssignment, MdDescription } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../api";
import Sidebar from "../sidebar";
import "./newProject.css";
import "./styles.css";

function NewProject() {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    nombre: "",
    responsables: [],
    descripcion: "",
    fechaCreacion: new Date().toISOString().split('T')[0],
  });

  const [actividades, setActividades] = useState([
    { id: 1, nombre: "Ficha de solicitud de desarrollo de sistema", fechaLimite: "" },
    { id: 2, nombre: "Toma de requerimientos de software", fechaLimite: "" },
    { id: 3, nombre: "Plan de proyecto", fechaLimite: "" },
    { id: 4, nombre: "Validación y pruebas", fechaLimite: "" },
    { id: 5, nombre: "Manual técnico de usuario", fechaLimite: "" },
    { id: 6, nombre: "Plan de despliegue", fechaLimite: "" },
    { id: 7, nombre: "Acta de Entrega de sistema", fechaLimite: "" },
    { id: 8, nombre: "Documento de auditoría", fechaLimite: "" },

  ]);

  const [errors, setErrors] = useState({});
  const [responsablesDisponibles, setResponsablesDisponibles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  
  const [modal, setModal] = useState({
    show: false,
    type: '',
    message: ''
  });

  useEffect(() => {
    const cargarUsuarios = async () => {
      try {
        setLoading(true);
        const response = await apiClient.get('/users');
        
        let usuariosArray = [];
        
        if (Array.isArray(response)) {
          usuariosArray = response;
        } else if (response && typeof response === 'object') {
          usuariosArray = Object.values(response);
        }
        
        const usuariosFormateados = usuariosArray.map(usuario => ({
          id: usuario.ID,
          nombre: usuario.display_name || usuario.username,
          email: usuario.email,
          username: usuario.username
        }));
        
        setResponsablesDisponibles(usuariosFormateados);
        setError(null);
      } catch (err) {
        console.error('Error al cargar usuarios:', err);
        setError('No se pudieron cargar los usuarios. Intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };

    cargarUsuarios();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: null
      });
    }
  };

  const handleFechaActividadChange = (id, fecha) => {
    setActividades(actividades.map(act => 
      act.id === id ? { ...act, fechaLimite: fecha } : act
    ));
  };

  const handleResponsableToggle = (responsable) => {
    const isSelected = formData.responsables.some(r => r.id === responsable.id);
    
    let nuevosResponsables;
    if (isSelected) {
      nuevosResponsables = formData.responsables.filter(r => r.id !== responsable.id);
    } else {
      nuevosResponsables = [...formData.responsables, responsable];
    }
    
    setFormData({
      ...formData,
      responsables: nuevosResponsables
    });
    
    if (errors.responsables) {
      setErrors({
        ...errors,
        responsables: null
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const nuevosErrors = {};
    if (!formData.nombre.trim()) {
      nuevosErrors.nombre = "El nombre del proyecto es requerido";
    }
    if (formData.responsables.length === 0) {
      nuevosErrors.responsables = "Debes seleccionar al menos un responsable";
    }
    if (!formData.descripcion.trim()) {
      nuevosErrors.descripcion = "La descripción del proyecto es requerida";
    }
    if (!formData.fechaCreacion) {
      nuevosErrors.fechaCreacion = "La fecha de creación es requerida";
    }

    const actividadesSinFecha = actividades.filter(act => !act.fechaLimite);
    if (actividadesSinFecha.length > 0) {
      nuevosErrors.actividades = "Todas las actividades deben tener una fecha límite";
    }
    
    if (Object.keys(nuevosErrors).length > 0) {
      setErrors(nuevosErrors);
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      const projectData = {
        name: formData.nombre,
        description: formData.descripcion,
        created_at: formData.fechaCreacion,
      };
      
      const projectResponse = await apiClient.post('/projects', projectData);
      const projectId = projectResponse.id;
      
      if (formData.responsables.length > 0) {
        await apiClient.post(`/projects/${projectId}/users/bulk`, 
          formData.responsables.map(r => ({
            user_id: r.id,
            role: 'responsable'
          }))
        );
      }
      
      const actividadesPromises = actividades.map(act => 
        apiClient.post('/activities', {
          project_id: projectId,
          name: act.nombre,
          description: `Actividad: ${act.nombre}`,
          priority: 'media',
          status: 'pending',
          end_date: act.fechaLimite,
          start_date: formData.fechaCreacion,
          documentRequired: 1
        })
      );
      
      await Promise.all(actividadesPromises);
      
      setModal({
        show: true,
        type: 'success',
        message: '¡Proyecto creado exitosamente!'
      });
      
      setTimeout(() => {
        navigate('/panorama');
      }, 2000);
      
    } catch (err) {
      console.error('Error al crear proyecto:', err);
      
      setModal({
        show: true,
        type: 'error',
        message: 'Error al crear el proyecto. Intenta de nuevo.'
      });
      
      setError('Error al crear el proyecto. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/panorama');
  };

  const closeModal = () => {
    setModal({ ...modal, show: false });
  };

  return (
    <div className="panorama-container">
      <Sidebar tipoAcceso={1} />
      
      <main className="contenido-principal">
        <div className="project-header">
          <h1 className="titulo-proyecto">Crear Nuevo Proyecto</h1>
          <div className="header-buttons">
            <button 
              type="button"
              className="btn-cancelar"
              onClick={handleCancel}
              disabled={saving}
            >
              <FaTimes className="btn-icon" />
              Cancelar
            </button>
            <button 
              type="submit"
              form="new-project-form"
              className="btn-guardar"
              disabled={loading || saving}
            >
              <FaSave className="btn-icon" />
              {saving ? 'Creando...' : (loading ? 'Cargando...' : 'Guardar Proyecto')}
            </button>
          </div>
        </div>

        {error && !modal.show && (
          <div className="error-message-banner">
            {error}
            <button onClick={() => setError(null)} className="close-error">
              <FaTimes />
            </button>
          </div>
        )}

        {modal.show && (
          <div className="modal-overlay" onClick={closeModal}>
            <div 
              className={`modal-notificacion ${modal.type}`}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-icon">
                {modal.type === 'success' ? (
                  <FaCheckCircle className="success-icon" />
                ) : (
                  <FaExclamationCircle className="error-icon" />
                )}
              </div>
              <div className="modal-content">
                <h3>{modal.type === 'success' ? 'Éxito' : 'Error'}</h3>
                <p>{modal.message}</p>
              </div>
              {modal.type === 'error' && (
                <button className="modal-close-btn" onClick={closeModal}>
                  <FaTimes />
                </button>
              )}
            </div>
          </div>
        )}

        <form id="new-project-form" onSubmit={handleSubmit} className="new-project-form">
          <div className="form-grid">
            <div className="form-group full-width">
              <label htmlFor="nombre">
                <MdAssignment className="label-icon" />
                Nombre del Proyecto
              </label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Sistema de Gestión de Proyectos CFE"
                className={errors.nombre ? "error" : ""}
                disabled={loading || saving}
              />
              {errors.nombre && <span className="error-message">{errors.nombre}</span>}
            </div>

            <div className="form-group full-width">
              <label htmlFor="responsables">
                <FaUser className="label-icon" />
                Responsables del Proyecto
              </label>
              
              {loading ? (
                <div className="loading-users">Cargando usuarios...</div>
              ) : (
                <div className="custom-select-container">
                  <div 
                    className={`custom-select ${errors.responsables ? "error" : ""}`}
                    onClick={() => !saving && setShowDropdown(!showDropdown)}
                  >
                    <div className="select-selected">
                      {formData.responsables.length === 0 ? (
                        <span className="placeholder">Selecciona los responsables...</span>
                      ) : (
                        <div className="selected-items">
                          {formData.responsables.map(r => (
                            <span key={r.id} className="selected-tag">
                              {r.nombre.split(' ').slice(0, 2).join(' ')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <FaChevronDown className={`select-arrow ${showDropdown ? "open" : ""}`} />
                  </div>
                  
                  {showDropdown && (
                    <div className="select-dropdown">
                      {responsablesDisponibles.length === 0 ? (
                        <div className="no-results">No hay usuarios disponibles</div>
                      ) : (
                        responsablesDisponibles.map(responsable => {
                          const isSelected = formData.responsables.some(r => r.id === responsable.id);
                          return (
                            <div
                              key={responsable.id}
                              className={`select-option ${isSelected ? "selected" : ""}`}
                              onClick={() => handleResponsableToggle(responsable)}
                            >
                              <div className="option-info">
                                <span className="option-nombre">{responsable.nombre}</span>
                                <span className="option-rol">{responsable.email || 'Sin email'}</span>
                              </div>
                              {isSelected && <span className="check-mark">✓</span>}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              )}
              {errors.responsables && <span className="error-message">{errors.responsables}</span>}
            </div>

            <div className="form-group full-width">
              <label htmlFor="descripcion">
                <MdDescription className="label-icon" />
                Descripción del Proyecto
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Describe el propósito, alcance y objetivos del proyecto..."
                rows="5"
                className={errors.descripcion ? "error" : ""}
                disabled={loading || saving}
              />
              {errors.descripcion && <span className="error-message">{errors.descripcion}</span>}
            </div>

            <div className="form-group half-width">
              <label htmlFor="fechaCreacion">
                <FaCalendarAlt className="label-icon" />
                Fecha de Creación
              </label>
              <input
                type="date"
                id="fechaCreacion"
                name="fechaCreacion"
                value={formData.fechaCreacion}
                onChange={handleChange}
                className={errors.fechaCreacion ? "error" : ""}
                disabled={loading || saving}
              />
              {errors.fechaCreacion && <span className="error-message">{errors.fechaCreacion}</span>}
            </div>
          </div>

          <div className="actividades-section">
            <h2 className="actividades-titulo">Actividades Obligatorias del Proyecto</h2>
            <p className="actividades-descripcion">
              Estas actividades se crearán automáticamente con el proyecto, 
              Asigna una fecha límite a cada una. Posteriormente se podrán añadir actividades adicionales.
            </p>
            
            <div className="actividades-grid">
              {actividades.map((actividad) => (
                <div key={actividad.id} className="actividad-item">
                  <div className="actividad-info">
                    <span className="actividad-nombre">{actividad.nombre}</span>
                  </div>
                  <div className="actividad-fecha">
                    <FaCalendarAlt className="fecha-icon" />
                    <input
                      type="date"
                      value={actividad.fechaLimite}
                      onChange={(e) => handleFechaActividadChange(actividad.id, e.target.value)}
                      min={formData.fechaCreacion}
                      className="fecha-input"
                      required
                      disabled={saving}
                    />
                  </div>
                </div>
              ))}
            </div>
            {errors.actividades && (
              <span className="error-message actividades-error">{errors.actividades}</span>
            )}
          </div>
        </form>
      </main>
    </div>
  );
}

export default NewProject;