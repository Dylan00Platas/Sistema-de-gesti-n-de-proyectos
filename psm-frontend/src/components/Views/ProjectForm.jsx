import { memo, useCallback, useState } from 'react';
import { FaFile, FaPaperclip, FaSave, FaTrash } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import RichTextEditor from '../RichTextEditor';
import './ProjectForm.css';
import './styles.css';

// Componente memoizado para el campo de texto enriquecido
const RichTextField = memo(({ field, label, placeholder, value, onChange, error, minChars }) => {
  const stripHtml = (html) => {
    if (!html) return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  const plainText = stripHtml(value);
  const currentLength = plainText.length;
  const isValid = currentLength >= minChars;

  return (
    <div className={`form-field ${error ? 'has-error' : ''}`}>
      <label className="form-label">
        {label} <span className="required-star">*</span>
        <span className={`char-count ${isValid && currentLength > 0 ? 'valid' : 'pending'}`}>
          ({currentLength}/{minChars} caracteres)
        </span>
      </label>
      <RichTextEditor
        value={value}
        onChange={onChange}
        placeholder={`${placeholder} (mínimo ${minChars} caracteres)`}
      />
      {error && (
        <div className="field-error">{error}</div>
      )}
    </div>
  );
});

function ProjectForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [files, setFiles] = useState([]);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});

  const [formData, setFormData] = useState({
    StrategicObjective: '',
    GeneralObjective: '',
    ProjectDescription: '',
    ActivitiesToAutomate: '',
    ScopeLevel: '',
    UsersNeeded: '',
    TargetUser: '',
    CurrentProcessDescription: '',
    CurrentProcessTime: '',
    Frequency: '',
  });

  const BACKEND_URL = 'http://gestiondeproyectos.local';
  const MIN_CHARS = 80;

  // Función para limpiar HTML y obtener texto plano
  const stripHtml = (html) => {
    if (!html) return '';
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  // Validar el formulario completo antes de enviar
  const validateForm = () => {
    const errors = {};
    
    const richTextFields = [
      { field: 'StrategicObjective', name: 'Objetivo Estratégico' },
      { field: 'GeneralObjective', name: 'Objetivo General' },
      { field: 'ProjectDescription', name: 'Descripción General' },
      { field: 'ActivitiesToAutomate', name: 'Actividades a sistematizar' },
      { field: 'UsersNeeded', name: 'Perfiles de usuario' },
      { field: 'TargetUser', name: 'Personal dirigido' },
      { field: 'CurrentProcessDescription', name: 'Descripción del proceso actual' }
    ];

    for (const item of richTextFields) {
      const plainText = stripHtml(formData[item.field]);
      if (plainText.length < MIN_CHARS) {
        errors[item.field] = `${item.name}: Por favor, sé más específico al responder (mínimo ${MIN_CHARS} caracteres, tienes ${plainText.length})`;
      }
    }

    if (!formData.ScopeLevel || formData.ScopeLevel.trim() === '') {
      errors.ScopeLevel = 'Nivel de Alcance es obligatorio';
    }

    if (!formData.CurrentProcessTime || formData.CurrentProcessTime.trim() === '') {
      errors.CurrentProcessTime = 'Tiempo invertido es obligatorio';
    }

    if (!formData.Frequency || formData.Frequency.trim() === '') {
      errors.Frequency = 'Frecuencia es obligatoria';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Manejadores con useCallback para evitar recreación de funciones
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: null }));
    }
  }, [validationErrors]);

  const handleRichTextChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: null }));
    }
  }, [validationErrors]);

  const handleFileUpload = (e) => {
    const newFiles = Array.from(e.target.files);
    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFile = async (file) => {
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    
    try {
      const response = await fetch(`${BACKEND_URL}/wp-json/psm/public/projects/${id}/form/upload`, {
        method: 'POST',
        body: formDataUpload,
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Error al subir archivo');
      }
      
      return result;
    } catch (error) {
      console.error('Error al subir archivo:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      const firstErrorField = document.querySelector('.field-error');
      if (firstErrorField) {
        firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    setLoading(true);
    setError(null);
    setUploadProgress(0);
    
    try {
      const uploadedFiles = [];
      
      if (files.length > 0) {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          setUploadProgress(Math.round(((i + 1) / files.length) * 50));
          const uploadedFile = await uploadFile(file);
          uploadedFiles.push(uploadedFile);
        }
      }
      
      setUploadProgress(75);
      
      const submitData = {
        project_id: parseInt(id),
        StrategicObjective: formData.StrategicObjective,
        GeneralObjective: formData.GeneralObjective,
        ProjectDescription: formData.ProjectDescription,
        ActivitiesToAutomate: formData.ActivitiesToAutomate,
        ScopeLevel: formData.ScopeLevel,
        UsersNeeded: formData.UsersNeeded,
        TargetUser: formData.TargetUser,
        CurrentProcessDescription: formData.CurrentProcessDescription,
        CurrentProcessTime: formData.CurrentProcessTime,
        Frequency: formData.Frequency,
        file_ids: uploadedFiles.map(f => f.file_id)
      };
      
      const response = await fetch(`${BACKEND_URL}/wp-json/psm/public/projects/${id}/form/responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Error al guardar las respuestas');
      }
      
      setUploadProgress(100);
      setShowModal(true);
      
      setFormData({
        StrategicObjective: '',
        GeneralObjective: '',
        ProjectDescription: '',
        ActivitiesToAutomate: '',
        ScopeLevel: '',
        UsersNeeded: '',
        TargetUser: '',
        CurrentProcessDescription: '',
        CurrentProcessTime: '',
        Frequency: '',
      });
      setFiles([]);
      setValidationErrors({});
      setUploadProgress(0);
      
    } catch (error) {
      console.error('Error al guardar:', error);
      setError(error.message || 'Error al guardar las respuestas');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    navigate(`/proyecto/${id}`);
  };

  const handleCancel = () => {
    navigate(`/proyecto/${id}`);
  };

  return (
    <div className="panorama-container">
      <main className="contenido-principal">
        <div className="project-form-header">
          <h1 className="titulo-panorama">Formulario del Proyecto</h1>
          <p className="form-note">* Todos los campos son obligatorios. Los campos de texto requieren mínimo 80 caracteres.</p>
        </div>

        {error && (
          <div className="error-message-banner">
            {error}
            <button onClick={() => setError(null)} className="close-error">
              ×
            </button>
          </div>
        )}

        {uploadProgress > 0 && uploadProgress < 100 && (
          <div className="upload-progress">
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
            </div>
            <p>Subiendo archivos... {uploadProgress}%</p>
          </div>
        )}

        <form className="project-form" onSubmit={handleSubmit}>
          {/* SECCIÓN 1: INFORMACIÓN GENERAL */}
          <div className="form-section">
            <h2 className="form-section-title">Información General</h2>
            
            <RichTextField
              field="StrategicObjective"
              label="Objetivo Estratégico"
              placeholder="Describe el objetivo estratégico del proyecto..."
              value={formData.StrategicObjective}
              onChange={(value) => handleRichTextChange('StrategicObjective', value)}
              error={validationErrors.StrategicObjective}
              minChars={MIN_CHARS}
            />

            <RichTextField
              field="GeneralObjective"
              label="Objetivo General"
              placeholder="Describe el objetivo general del proyecto..."
              value={formData.GeneralObjective}
              onChange={(value) => handleRichTextChange('GeneralObjective', value)}
              error={validationErrors.GeneralObjective}
              minChars={MIN_CHARS}
            />

            <RichTextField
              field="ProjectDescription"
              label="Descripción General"
              placeholder="Describe de manera general el proyecto..."
              value={formData.ProjectDescription}
              onChange={(value) => handleRichTextChange('ProjectDescription', value)}
              error={validationErrors.ProjectDescription}
              minChars={MIN_CHARS}
            />

            <RichTextField
              field="ActivitiesToAutomate"
              label="¿Qué actividades requiere sistematizar?"
              placeholder="Enumera las actividades que requieren ser sistematizadas..."
              value={formData.ActivitiesToAutomate}
              onChange={(value) => handleRichTextChange('ActivitiesToAutomate', value)}
              error={validationErrors.ActivitiesToAutomate}
              minChars={MIN_CHARS}
            />

            <div className={`form-field ${validationErrors.ScopeLevel ? 'has-error' : ''}`}>
              <label className="form-label">Nivel de Alcance *</label>
              <input
                type="text"
                name="ScopeLevel"
                className="form-input"
                value={formData.ScopeLevel}
                onChange={handleInputChange}
                placeholder="Ej: Local, Regional, Nacional, Internacional"
              />
              {validationErrors.ScopeLevel && (
                <div className="field-error">{validationErrors.ScopeLevel}</div>
              )}
            </div>

            <RichTextField
              field="UsersNeeded"
              label="¿Qué perfiles de usuario se requieren?"
              placeholder="Describe los perfiles de usuario necesarios..."
              value={formData.UsersNeeded}
              onChange={(value) => handleRichTextChange('UsersNeeded', value)}
              error={validationErrors.UsersNeeded}
              minChars={MIN_CHARS}
            />

            <RichTextField
              field="TargetUser"
              label="¿A qué personal va dirigido?"
              placeholder="Describe a qué personal está dirigido este proyecto..."
              value={formData.TargetUser}
              onChange={(value) => handleRichTextChange('TargetUser', value)}
              error={validationErrors.TargetUser}
              minChars={MIN_CHARS}
            />
          </div>

          {/* SECCIÓN 2: PROCESO ACTUAL */}
          <div className="form-section">
            <h2 className="form-section-title">Proceso Actual</h2>

            <RichTextField
              field="CurrentProcessDescription"
              label="Descripción del proceso actual"
              placeholder="Describe cómo se realiza actualmente el proceso..."
              value={formData.CurrentProcessDescription}
              onChange={(value) => handleRichTextChange('CurrentProcessDescription', value)}
              error={validationErrors.CurrentProcessDescription}
              minChars={MIN_CHARS}
            />

            <div className="form-row">
              <div className={`form-field half ${validationErrors.CurrentProcessTime ? 'has-error' : ''}`}>
                <label className="form-label">Tiempo invertido en proceso actual *</label>
                <input
                  type="text"
                  name="CurrentProcessTime"
                  className="form-input"
                  value={formData.CurrentProcessTime}
                  onChange={handleInputChange}
                  placeholder="Ej: 2 horas diarias, 1 semana, etc."
                />
                {validationErrors.CurrentProcessTime && (
                  <div className="field-error">{validationErrors.CurrentProcessTime}</div>
                )}
              </div>

              <div className={`form-field half ${validationErrors.Frequency ? 'has-error' : ''}`}>
                <label className="form-label">Frecuencia con la que se realiza *</label>
                <input
                  type="text"
                  name="Frequency"
                  className="form-input"
                  value={formData.Frequency}
                  onChange={handleInputChange}
                  placeholder="Ej: Diario, Semanal, Mensual"
                />
                {validationErrors.Frequency && (
                  <div className="field-error">{validationErrors.Frequency}</div>
                )}
              </div>
            </div>
          </div>

          {/* SECCIÓN 3: DOCUMENTOS ADJUNTOS */}
          <div className="form-section">
            <h2 className="form-section-title">Documentos Adjuntos</h2>
            
            <div className="file-upload-area">
              <label className="file-upload-label">
                <FaPaperclip className="upload-icon" />
                Seleccionar archivos (opcional)
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="file-input-hidden"
                />
              </label>
              <p className="file-hint">Formatos permitidos: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG </p>
            </div>

            {files.length > 0 && (
              <div className="files-list">
                <h4>Archivos seleccionados ({files.length})</h4>
                {files.map((file, index) => (
                  <div key={index} className="file-item">
                    <FaFile className="file-icon" />
                    <div className="file-info">
                      <span className="file-name">{file.name}</span>
                      <span className="file-size">{(file.size / 1024).toFixed(2)} KB</span>
                    </div>
                    <button
                      type="button"
                      className="file-remove"
                      onClick={() => removeFile(index)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="form-actions">
             
              <button type="submit" className="btn-guardar" disabled={loading}>
                <FaSave className="btn-icon" />
                {loading ? 'Subiendo archivos y guardando...' : 'Enviar Respuestas'}
              </button>
            </div>
          </div>
        </form>
      </main>

      {/* Modal de éxito */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-icon">✓</div>
            <h2 className="modal-title">¡Gracias por contestar el formulario!</h2>
            <p className="modal-message">Trabajaremos en ello.</p>
            <button className="modal-button" onClick={handleCloseModal}>
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectForm;