import { useEffect, useState } from "react";
import {
    FaDownload,
    FaFileAlt,
    FaFileExcel,
    FaFileImage,
    FaFilePdf,
    FaFilePowerpoint,
    FaFileWord,
    FaFolderOpen,
    FaPlus,
    FaSave,
    FaSpinner,
    FaTimes,
    FaTrash,
    FaUpload
} from "react-icons/fa";
import { apiClient } from "../../api";
import Sidebar from "../sidebar";
import "./settings.css";
import "./styles.css";

function Settings() {
    const [plantillas, setPlantillas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [saving, setSaving] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [formData, setFormData] = useState({
        name: "",
        category: "general"
    });
    const [errores, setErrores] = useState({});

    useEffect(() => {
        cargarPlantillas();
    }, []);

    const cargarPlantillas = async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/templates');
            setPlantillas(response);
            setError(null);
        } catch (err) {
            console.error('Error al cargar plantillas:', err);
            setError('No se pudieron cargar las plantillas');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = () => {
        setFormData({ name: "", category: "general" });
        setSelectedFile(null);
        setErrores({});
        setShowModal(true);
        document.body.style.overflow = 'hidden';
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedFile(null);
        setFormData({ name: "", category: "general" });
        setErrores({});
        document.body.style.overflow = 'auto';
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        if (errores[name]) {
            setErrores(prev => ({ ...prev, [name]: null }));
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const extension = file.name.split('.').pop().toLowerCase();
            const allowedExtensions = ['docx', 'doc', 'pdf', 'xlsx', 'pptx', 'jpg', 'png'];

            if (!allowedExtensions.includes(extension)) {
                setErrores(prev => ({ ...prev, file: 'Formato no permitido. Use: .docx, .doc, .pdf, .xlsx, .pptx, .jpg, .png' }));
                setSelectedFile(null);
                return;
            }

            setSelectedFile(file);
            setErrores(prev => ({ ...prev, file: null }));

            if (!formData.name) {
                const baseName = file.name.replace(`.${extension}`, '');
                setFormData(prev => ({ ...prev, name: baseName }));
            }
        }
    };

    const validarFormulario = () => {
        const nuevosErrores = {};

        if (!formData.name.trim()) {
            nuevosErrores.name = "El nombre de la plantilla es requerido";
        }

        if (!selectedFile) {
            nuevosErrores.file = "Debes seleccionar un archivo";
        }

        return nuevosErrores;
    };

    const handleSubirPlantilla = async () => {
        const nuevosErrores = validarFormulario();
        if (Object.keys(nuevosErrores).length > 0) {
            setErrores(nuevosErrores);
            return;
        }

        setSaving(true);

        try {
            const formDataToSend = new FormData();
            formDataToSend.append('name', formData.name);
            formDataToSend.append('category', formData.category);
            formDataToSend.append('file', selectedFile);

            const response = await fetch('http://gestiondeproyectos.local/wp-json/psm/templates', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                },
                body: formDataToSend
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Error al subir la plantilla');
            }

            await cargarPlantillas();
            handleCloseModal();
        } catch (err) {
            console.error('Error al subir plantilla:', err);
            setErrores(prev => ({ ...prev, general: err.message }));
        } finally {
            setSaving(false);
        }
    };

    const handleEliminarPlantilla = async (id, nombre) => {
        if (!window.confirm(`¿Estás seguro de eliminar la plantilla "${nombre}"?`)) {
            return;
        }

        try {
            const response = await apiClient.delete(`/templates/${id}`);

            if (response.success) {
                await cargarPlantillas();
            } else {
                throw new Error(response.message || 'Error al eliminar');
            }
        } catch (err) {
            console.error('Error al eliminar plantilla:', err);
            alert('Error al eliminar la plantilla');
        }
    };

    const handleDescargarPlantilla = async (plantilla) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`http://gestiondeproyectos.local/wp-json/psm/templates/${plantilla.id}/download`, {
                headers: {
                    'Authorization': token ? `Bearer ${token}` : ''
                }
            });

            if (!response.ok) {
                throw new Error('Error al descargar');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = plantilla.file_name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (err) {
            console.error('Error al descargar:', err);
            alert('Error al descargar la plantilla');
        }
    };

    const getFileIcon = (filename) => {
        const extension = filename?.split('.').pop().toLowerCase() || '';

        switch (extension) {
            case 'pdf':
                return <FaFilePdf className="file-icon pdf" />;
            case 'doc':
            case 'docx':
                return <FaFileWord className="file-icon word" />;
            case 'xls':
            case 'xlsx':
                return <FaFileExcel className="file-icon excel" />;
            case 'ppt':
            case 'pptx':
                return <FaFilePowerpoint className="file-icon powerpoint" />;
            case 'jpg':
            case 'jpeg':
            case 'png':
            case 'gif':
                return <FaFileImage className="file-icon image" />;
            default:
                return <FaFileAlt className="file-icon default" />;
        }
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '0 KB';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    };

    if (loading) {
        return (
            <div className="panorama-container">
                <Sidebar />
                <main className="contenido-principal">
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="panorama-container">
            <Sidebar />

            <main className="contenido-principal">
                <div className="settings-header">
                    <h1 className="titulo-panorama">Ajustes</h1>
                    <div className="settings-tabs">
                        <button className="tab-btn active">
                            <FaFolderOpen className="tab-icon" />
                            Plantillas
                        </button>
                    </div>
                </div>

                <div className="settings-content">
                    <div className="settings-section">
                        <div className="section-header">
                            <h2>Gestión de Plantillas</h2>
                            <button className="btn-nueva-plantilla" onClick={handleOpenModal}>
                                <FaPlus className="btn-icon" />
                                Nueva Plantilla
                            </button>
                        </div>

                        {error && (
                            <div className="error-message-banner">
                                {error}
                                <button onClick={() => setError(null)} className="close-error">
                                    <FaTimes />
                                </button>
                            </div>
                        )}

                        <div className="plantillas-table-container">
                            {plantillas.length === 0 ? (
                                <div className="no-plantillas">
                                    <FaFolderOpen className="no-plantillas-icon" />
                                    <p>No hay plantillas disponibles</p>
                                    <button className="btn-crear-plantilla" onClick={handleOpenModal}>
                                        Crear primera plantilla
                                    </button>
                                </div>
                            ) : (
                                <table className="plantillas-table">
                                    <thead>
                                        <tr>
                                            <th>Nombre</th>
                                            <th>Archivo</th>
                                            <th>Categoría</th>
                                            <th>Tamaño</th>
                                            <th>Fecha</th>
                                            <th>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {plantillas.map((plantilla) => (
                                            <tr key={plantilla.id}>
                                                <td className="plantilla-nombre">
                                                    <div className="nombre-contenido">
                                                        {getFileIcon(plantilla.file_name)}
                                                        <span>{plantilla.name}</span>
                                                    </div>
                                                </td>
                                                <td className="plantilla-filename" title={plantilla.file_name}>
                                                    {plantilla.file_name.length > 40
                                                        ? plantilla.file_name.substring(0, 37) + '...'
                                                        : plantilla.file_name}
                                                </td>
                                                <td>
                                                    <span className="category-badge">{plantilla.category}</span>
                                                </td>
                                                <td>{formatFileSize(plantilla.file_size)}</td>
                                                <td>{new Date(plantilla.created_at).toLocaleDateString('es-MX')}</td>
                                                <td className="acciones-cell">
                                                    <div className="acciones-container">
                                                        <button
                                                            className="btn-descargar-plantilla"
                                                            onClick={() => handleDescargarPlantilla(plantilla)}
                                                            title="Descargar plantilla"
                                                        >
                                                            <FaDownload />
                                                        </button>
                                                        <button
                                                            className="btn-eliminar-plantilla"
                                                            onClick={() => handleEliminarPlantilla(plantilla.id, plantilla.name)}
                                                            title="Eliminar plantilla"
                                                        >
                                                            <FaTrash />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {showModal && (
                <div className="modal-overlay" onClick={handleCloseModal}>
                    <div
                        className="modal-contenido modal-plantilla"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="modal-header">
                            <h2>
                                <FaUpload className="modal-icon" />
                                Subir Nueva Plantilla
                            </h2>
                            <button className="modal-close" onClick={handleCloseModal}>
                                <FaTimes />
                            </button>
                        </div>

                        <div className="modal-body">
                            {errores.general && (
                                <div className="error-message-banner modal-error">
                                    {errores.general}
                                </div>
                            )}

                            <div className="modal-form-group">
                                <label htmlFor="plantilla-nombre">
                                    <FaFileAlt className="label-icon" />
                                    Nombre de la plantilla *
                                </label>
                                <input
                                    type="text"
                                    id="plantilla-nombre"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Ej: Acta de Entrega"
                                    className={errores.name ? "error" : ""}
                                    autoFocus
                                />
                                {errores.name && <span className="error-message">{errores.name}</span>}
                            </div>

                            <div className="modal-form-group">
                                <label htmlFor="plantilla-categoria">
                                    <FaFolderOpen className="label-icon" />
                                    Categoría
                                </label>
                                <select
                                    id="plantilla-categoria"
                                    name="category"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                >
                                    <option value="general">General</option>
                                    <option value="actas">Actas</option>
                                    <option value="informes">Informes</option>
                                    <option value="manuales">Manuales</option>
                                    <option value="formatos">Formatos</option>
                                </select>
                            </div>

                            <div className="modal-form-group">
                                <label htmlFor="plantilla-archivo">
                                    <FaUpload className="label-icon" />
                                    Archivo *
                                </label>
                                <div className="file-upload-area">
                                    <input
                                        type="file"
                                        id="plantilla-archivo"
                                        onChange={handleFileChange}
                                        className="file-input-hidden"
                                        accept=".docx,.doc,.pdf,.xlsx,.pptx,.jpg,.png"
                                    />
                                    <label htmlFor="plantilla-archivo" className="file-upload-label">
                                        <FaUpload />
                                        {selectedFile ? selectedFile.name : "Seleccionar archivo"}
                                    </label>
                                    {selectedFile && (
                                        <div className="file-info">
                                            {getFileIcon(selectedFile.name)}
                                            <span className="file-name">{selectedFile.name}</span>
                                            <span className="file-size">
                                                {(selectedFile.size / 1024).toFixed(2)} KB
                                            </span>
                                            <button
                                                className="file-remove"
                                                onClick={() => setSelectedFile(null)}
                                                title="Quitar archivo"
                                            >
                                                <FaTimes />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <p className="file-hint">Formatos permitidos: .docx, .docn</p>
                                {errores.file && <span className="error-message">{errores.file}</span>}
                            </div>

                            <div className="modal-info">
                                <p>⚠️ Las plantillas subidas estarán disponibles para todos los usuarios en el módulo "Ver Plantillas".</p>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button className="modal-btn-cancelar" onClick={handleCloseModal}>
                                Cancelar
                            </button>
                            <button
                                className="modal-btn-guardar"
                                onClick={handleSubirPlantilla}
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <FaSpinner className="spinning" />
                                        Subiendo...
                                    </>
                                ) : (
                                    <>
                                        <FaSave className="btn-icon" />
                                        Subir Plantilla
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Settings;