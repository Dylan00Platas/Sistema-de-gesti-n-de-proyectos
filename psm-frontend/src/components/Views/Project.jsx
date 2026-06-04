import { useEffect, useState } from "react";

import {
  FaCalendarAlt,
  FaChartPie,
  FaCheckCircle,
  FaChevronDown,
  FaClock,
  FaDownload,
  FaEdit,
  FaExclamationCircle,
  FaFile,
  FaFileAlt,
  FaFileExcel,
  FaFileImage,
  FaFilePdf,
  FaFilePowerpoint,
  FaFileWord,
  FaFlag,
  FaFolderOpen,
  FaPercent,
  FaPlus,
  FaSave,
  FaTasks,
  FaTimes,
  FaUser,
} from "react-icons/fa";
import { MdAssignment, MdDescription } from "react-icons/md";
import { useNavigate, useParams } from "react-router-dom";
import { apiClient } from "../../api";
import Sidebar from "../sidebar";
import "./project.css";
import "./styles.css";

function Project() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [projectData, setProjectData] = useState(null);
  const [actividades, setActividades] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [usuarios, setUsuarios] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showNuevaActividadModal, setShowNuevaActividadModal] = useState(false);
  const [showDetalleActividadModal, setShowDetalleActividadModal] =
    useState(false);
  const [showActualizarActividadModal, setShowActualizarActividadModal] =
    useState(false);
  const [showPlantillasModal, setShowPlantillasModal] = useState(false);
  const [actividadSeleccionada, setActividadSeleccionada] = useState(null);
  const [actividadEditada, setActividadEditada] = useState(null);
  const [actividadActualizar, setActividadActualizar] = useState(null);
  const [erroresEdicion, setErroresEdicion] = useState({});
  const [erroresActualizar, setErroresActualizar] = useState({});
  const [plantillas, setPlantillas] = useState([]);
  const [cargandoPlantillas, setCargandoPlantillas] = useState(false);

  const [formResponses, setFormResponses] = useState(null);
  const [loadingForm, setLoadingForm] = useState(false);
  const [formFiles, setFormFiles] = useState([]);

  const [isFormSectionExpanded, setIsFormSectionExpanded] = useState(false);

  const [showEditarProyectoModal, setShowEditarProyectoModal] = useState(false);
  const [proyectoEditado, setProyectoEditado] = useState(null);
  const [responsablesSeleccionados, setResponsablesSeleccionados] = useState(
    [],
  );
  const [showResponsablesDropdown, setShowResponsablesDropdown] =
    useState(false);
  const [erroresProyecto, setErroresProyecto] = useState({});
  const [showActividadesFinalizadas, setShowActividadesFinalizadas] =
    useState(false);

  const [nuevaActividad, setNuevaActividad] = useState({
    nombre: "",
    fechaInicio: "",
    fechaFin: "",
    prioridad: "media",
    responsable: "",
  });

  const [errores, setErrores] = useState({});
  const [archivoActualizar, setArchivoActualizar] = useState(null);

  const prioridades = [
    { valor: "high", label: "Alta", color: "#F44336" },
    { valor: "media", label: "Media", color: "#FFC107" },
    { valor: "low", label: "Baja", color: "#4CAF50" },
  ];

  const estados = [
    { valor: "pending", label: "Pendiente" },
    { valor: "in_progress", label: "En progreso" },
    { valor: "completed", label: "Completado" },
  ];

  useEffect(() => {
    cargarDatosProyecto();
  }, [id]);

  const cargarUsuarios = async () => {
    try {
      const response = await apiClient.get("/users");
      let usuariosArray = [];
      if (Array.isArray(response)) {
        usuariosArray = response;
      } else if (response && typeof response === "object") {
        usuariosArray = Object.values(response);
      }

      const mapaUsuarios = {};
      usuariosArray.forEach((u) => {
        mapaUsuarios[u.ID] = {
          display_name: u.display_name,
          username: u.username,
          email: u.email,
        };
      });

      setUsuarios(mapaUsuarios);
      return mapaUsuarios;
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      return {};
    }
  };

  const cargarDatosProyecto = async () => {
    try {
      setLoading(true);

      const mapaUsuarios = await cargarUsuarios();

      const proyectoResponse = await apiClient.get(`/projects/${id}`);
      if (!proyectoResponse) {
        throw new Error("Proyecto no encontrado");
      }

      const actividadesResponse = await apiClient.get(
        `/projects/${id}/activities`,
      );
      let actividadesArray = [];
      if (Array.isArray(actividadesResponse)) {
        actividadesArray = actividadesResponse;
      } else if (
        actividadesResponse &&
        typeof actividadesResponse === "object"
      ) {
        actividadesArray = Object.values(actividadesResponse);
      }

      const documentosResponse = await apiClient.get("/documents");
      let documentosArray = [];
      if (Array.isArray(documentosResponse)) {
        documentosArray = documentosResponse;
      } else if (documentosResponse && typeof documentosResponse === "object") {
        documentosArray = Object.values(documentosResponse);
      }
      setDocumentos(documentosArray);

      const docsPorActividad = {};
      documentosArray.forEach((doc) => {
        if (doc.activity_id) {
          if (!docsPorActividad[doc.activity_id]) {
            docsPorActividad[doc.activity_id] = 0;
          }
          docsPorActividad[doc.activity_id]++;
        }
      });

      let responsablesArray = [];
      try {
        const users = await apiClient.get(`/projects/${id}/users`);
        if (Array.isArray(users)) {
          responsablesArray = users;
        } else if (users && typeof users === "object") {
          responsablesArray = Object.values(users);
        }
      } catch (err) {
        console.log("No se pudieron cargar responsables");
      }

      const actividadesProcesadas = actividadesArray.map((a) => {
        let responsableNombre = "No asignado";
        if (a.assigned_to && mapaUsuarios[a.assigned_to]) {
          responsableNombre =
            mapaUsuarios[a.assigned_to].display_name ||
            mapaUsuarios[a.assigned_to].username ||
            `Usuario ${a.assigned_to}`;
        }

        return {
          id: a.id,
          nombre: a.name,
          estado: a.status,
          prioridad: a.priority,
          responsable: responsableNombre,
          responsable_id: a.assigned_to,
          fechaInicio: a.start_date || "",
          fechaFin: a.end_date || "",
          tieneDocumento: docsPorActividad[a.id] > 0,
          documentRequired:
            a.documentRequired === "1" || a.documentRequired === 1 ? 1 : 0,
          archivos: [],
        };
      });

      setActividades(actividadesProcesadas);

      setProjectData({
        id: proyectoResponse.id,
        titulo: proyectoResponse.name,
        descripcion: proyectoResponse.description,
        fechaCreacion: proyectoResponse.created_at
          ? new Date(proyectoResponse.created_at).toLocaleDateString("es-MX", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : "Fecha no disponible",
        responsables: responsablesArray.map(
          (r) => r.display_name || r.user_login,
        ),
        documentacion: proyectoResponse.documentacion || "",
      });

      setError(null);
    } catch (err) {
      console.error("Error al cargar proyecto:", err);
      setError("No se pudo cargar el proyecto. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const getEstadoIcon = (estado) => {
    switch (estado) {
      case "completed":
        return <FaCheckCircle className="estado-icon completado" />;
      case "in_progress":
        return <FaClock className="estado-icon progreso" />;
      default:
        return <FaExclamationCircle className="estado-icon pendiente" />;
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case "completed":
        return "Completado";
      case "in_progress":
        return "En progreso";
      default:
        return "Pendiente";
    }
  };

  const getPrioridadColor = (prioridad) => {
    switch (prioridad) {
      case "alta":
      case "high":
        return "#F44336";
      case "media":
      case "medium":
        return "#FFC107";
      case "baja":
      case "low":
        return "#4CAF50";
      default:
        return "#FFC107";
    }
  };

  const getFileIcon = (filename) => {
    const extension = filename?.split(".").pop().toLowerCase() || "";

    switch (extension) {
      case "pdf":
        return <FaFilePdf className="file-icon pdf" />;
      case "doc":
      case "docx":
        return <FaFileWord className="file-icon word" />;
      case "xls":
      case "xlsx":
        return <FaFileExcel className="file-icon excel" />;
      case "ppt":
      case "pptx":
        return <FaFilePowerpoint className="file-icon powerpoint" />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
        return <FaFileImage className="file-icon image" />;
      default:
        return <FaFileAlt className="file-icon default" />;
    }
  };

  const handleOpenNuevaActividadModal = () => {
    setShowNuevaActividadModal(true);
    document.body.style.overflow = "hidden";
  };

  const handleCloseNuevaActividadModal = () => {
    setShowNuevaActividadModal(false);
    setNuevaActividad({
      nombre: "",
      fechaInicio: "",
      fechaFin: "",
      prioridad: "media",
      responsable: "",
    });
    setErrores({});
    document.body.style.overflow = "auto";
  };

  const handleOpenDetalleActividadModal = (e, actividad) => {
    e.stopPropagation();
    setActividadSeleccionada(actividad);
    setActividadEditada({ ...actividad });
    setErroresEdicion({});
    setShowDetalleActividadModal(true);
    document.body.style.overflow = "hidden";
  };

  const handleCloseDetalleActividadModal = () => {
    setShowDetalleActividadModal(false);
    setActividadSeleccionada(null);
    setActividadEditada(null);
    setErroresEdicion({});
    document.body.style.overflow = "auto";
  };

  const handleDescargarDocumento = async (activityId) => {
    try {
      const documento = documentos.find((d) => d.activity_id == activityId);
      if (!documento) {
        alert("No se encontró el documento");
        return;
      }

      const token = localStorage.getItem("auth_token");

      const response = await fetch(
        `http://gestiondeproyectos.local/wp-json/psm/documents/${documento.id}/download`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        },
      );

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("No autorizado. Por favor inicia sesión nuevamente.");
        }
        throw new Error("Error al descargar el documento");
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = documento.name || "documento";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al descargar:", err);
      alert(err.message || "Error al descargar el documento");
    }
  };

  const handleOpenActualizarActividadModal = (actividad) => {
    const documentoActividad = documentos.find(
      (d) => d.activity_id == actividad.id,
    );

    setActividadActualizar({
      id: actividad.id,
      estado: actividad.estado,
      archivos: documentoActividad
        ? [
            {
              id: documentoActividad.id,
              nombre: documentoActividad.name,
              mime_type: documentoActividad.mime_type,
            },
          ]
        : [],
    });
    setArchivoActualizar(null);
    setErroresActualizar({});
    setShowActualizarActividadModal(true);
    document.body.style.overflow = "hidden";
  };

  const handleCloseActualizarActividadModal = () => {
    setShowActualizarActividadModal(false);
    setActividadActualizar(null);
    setArchivoActualizar(null);
    setErroresActualizar({});
    document.body.style.overflow = "auto";
  };

  const handleGuardarActividad = async () => {
    const nuevosErrores = {};

    if (!nuevaActividad.nombre?.trim()) {
      nuevosErrores.nombre = "El nombre de la actividad es requerido";
    }

    if (!nuevaActividad.fechaFin) {
      nuevosErrores.fechaFin = "La fecha de finalización es requerida";
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    try {
      const actividadData = {
        project_id: parseInt(id),
        name: nuevaActividad.nombre,
        description: `Actividad: ${nuevaActividad.nombre}`,
        priority: nuevaActividad.prioridad,
        status: "pending",
        start_date: nuevaActividad.fechaInicio || null,
        end_date: nuevaActividad.fechaFin,
        assigned_to: nuevaActividad.responsable_id || null,
      };

      console.log("Creando actividad con responsable:", actividadData);

      const response = await apiClient.post("/activities", actividadData);

      if (response.success) {
        await cargarDatosProyecto();
        handleCloseNuevaActividadModal();
      }
    } catch (err) {
      console.error("Error al crear actividad:", err);
      setErrores({ general: "Error al crear la actividad" });
    }
  };
  const handleGuardarCambios = async () => {
    try {
      const actividadData = {
        name: actividadEditada.nombre,
        priority: actividadEditada.prioridad,
        status: actividadEditada.estado,
        start_date: actividadEditada.fechaInicio,
        end_date: actividadEditada.fechaFin,
        assigned_to: actividadEditada.responsable_id || null,
      };

      const response = await apiClient.put(
        `/activities/${actividadEditada.id}`,
        actividadData,
      );

      if (response.success) {
        await cargarDatosProyecto();
        handleCloseDetalleActividadModal();
      }
    } catch (err) {
      console.error("Error al actualizar actividad:", err);
      setErroresEdicion({ general: "Error al actualizar la actividad" });
    }
  };

  const handleGuardarActualizacion = async () => {
    try {
      setErroresActualizar({});

      if (!actividadActualizar.estado) {
        setErroresActualizar({ estado: "Debes seleccionar un estado" });
        return;
      }

      const actividadOriginal = actividades.find(
        (a) => a.id === actividadActualizar.id,
      );
      const requiereDocumento = actividadOriginal?.documentRequired === 1;

      const tieneDocumentoAhora =
        actividadOriginal?.tieneDocumento ||
        actividadActualizar.archivos?.length > 0 ||
        !!archivoActualizar;

      if (
        actividadActualizar.estado === "completed" &&
        requiereDocumento &&
        !tieneDocumentoAhora
      ) {
        setErroresActualizar({
          estado:
            "No puedes completar esta actividad sin subir el documento requerido.",
        });
        return;
      }

      const actividadData = { status: actividadActualizar.estado };
      const response = await apiClient.put(
        `/activities/${actividadActualizar.id}`,
        actividadData,
      );

      if (!response.success) {
        throw new Error("Error al actualizar el estado");
      }

      if (archivoActualizar) {
        const formData = new FormData();
        formData.append("file_content", archivoActualizar);

        console.log("Enviando documento a reemplazar (archivo binario):", {
          activity_id: actividadActualizar.id,
          name: archivoActualizar.name,
          mime_type: archivoActualizar.type,
          file_size: archivoActualizar.size,
        });

        const replaceResponse = await apiClient.replaceDocument(
          `/activities/${actividadActualizar.id}/replace-document`,
          formData,
        );

        console.log("Respuesta de reemplazo:", replaceResponse);

        if (replaceResponse && replaceResponse.success) {
          const updateDocumentRequired = await apiClient.put(
            `/activities/${actividadActualizar.id}`,
            {
              documentRequired: 1,
            },
          );

          console.log(
            "Actividad actualizada con documentRequired=1:",
            updateDocumentRequired,
          );
        }
      }

      await cargarDatosProyecto();
      handleCloseActualizarActividadModal();
    } catch (err) {
      console.error("Error al actualizar:", err);
      setErroresActualizar({
        general: "Error al actualizar la actividad. Intenta de nuevo.",
      });
    }
  };

  const handleOpenEditarProyectoModal = () => {
    if (!projectData) return;

    const responsables = projectData.responsables
      .map((nombre) => {
        const usuario = Object.values(usuarios).find(
          (u) => u.display_name === nombre || u.username === nombre,
        );
        return usuario
          ? {
              id: Object.keys(usuarios).find(
                (key) => usuarios[key] === usuario,
              ),
              nombre,
            }
          : null;
      })
      .filter(Boolean);

    setProyectoEditado({
      nombre: projectData.titulo,
      descripcion: projectData.descripcion,
    });
    setResponsablesSeleccionados(responsables);
    setErroresProyecto({});
    setShowEditarProyectoModal(true);
    document.body.style.overflow = "hidden";
  };

  const handleCloseEditarProyectoModal = () => {
    setShowEditarProyectoModal(false);
    setProyectoEditado(null);
    setResponsablesSeleccionados([]);
    setErroresProyecto({});
    document.body.style.overflow = "auto";
  };

  const handleProyectoInputChange = (e) => {
    const { name, value } = e.target;
    setProyectoEditado((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (erroresProyecto[name]) {
      setErroresProyecto((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const handleResponsableProyectoToggle = (usuario) => {
    const isSelected = responsablesSeleccionados.some(
      (r) => r.id === usuario.id,
    );

    let nuevosResponsables;
    if (isSelected) {
      nuevosResponsables = responsablesSeleccionados.filter(
        (r) => r.id !== usuario.id,
      );
    } else {
      nuevosResponsables = [
        ...responsablesSeleccionados,
        {
          id: usuario.id,
          nombre: usuario.display_name || usuario.username,
        },
      ];
    }

    setResponsablesSeleccionados(nuevosResponsables);

    if (erroresProyecto.responsables) {
      setErroresProyecto((prev) => ({
        ...prev,
        responsables: null,
      }));
    }
  };

  const handleGuardarProyecto = async () => {
    const nuevosErrores = {};

    if (!proyectoEditado.nombre?.trim()) {
      nuevosErrores.nombre = "El nombre del proyecto es requerido";
    }

    if (!proyectoEditado.descripcion?.trim()) {
      nuevosErrores.descripcion = "La descripción del proyecto es requerida";
    }

    if (responsablesSeleccionados.length === 0) {
      nuevosErrores.responsables = "Debes seleccionar al menos un responsable";
    }

    if (Object.keys(nuevosErrores).length > 0) {
      setErroresProyecto(nuevosErrores);
      return;
    }

    try {
      const proyectoData = {
        name: proyectoEditado.nombre,
        description: proyectoEditado.descripcion,
      };

      const response = await apiClient.put(`/projects/${id}`, proyectoData);

      if (!response.success) {
        throw new Error("Error al actualizar el proyecto");
      }

      const responsablesActuales = await apiClient.get(`/projects/${id}/users`);

      if (responsablesActuales && responsablesActuales.length > 0) {
        await Promise.all(
          responsablesActuales.map((r) =>
            apiClient.delete(`/projects/${id}/users/${r.user_id}`),
          ),
        );
      }

      if (responsablesSeleccionados.length > 0) {
        await apiClient.post(
          `/projects/${id}/users/bulk`,
          responsablesSeleccionados.map((r) => ({
            user_id: r.id,
            role: "responsable",
          })),
        );
      }

      await cargarDatosProyecto();
      handleCloseEditarProyectoModal();
    } catch (err) {
      console.error("Error al guardar proyecto:", err);
      setErroresProyecto({
        general: "Error al guardar los cambios. Intenta de nuevo.",
      });
    }
  };

  const handleVerPlantillas = async () => {
    setShowPlantillasModal(true);
    document.body.style.overflow = "hidden";
    setCargandoPlantillas(true);

    try {
      // Obtener lista de plantillas desde el backend
      const response = await apiClient.get("/templates");

      console.log("Plantillas recibidas:", response);

      // La respuesta ya viene formateada con id, name, file_name, etc.
      setPlantillas(response);
      setCargandoPlantillas(false);
    } catch (err) {
      console.error("Error al cargar plantillas:", err);
      setCargandoPlantillas(false);
      alert("No se pudieron cargar las plantillas. Intenta de nuevo.");
    }
  };

  const handleDescargarPlantilla = async (plantilla) => {
    try {
      console.log("Descargando plantilla:", plantilla.name);

      const token = localStorage.getItem("auth_token");

      // Hacer petición al endpoint de descarga del backend
      const response = await fetch(
        `http://gestiondeproyectos.local/wp-json/psm/templates/${plantilla.id}/download`,
        {
          headers: {
            Authorization: token ? `Bearer ${token}` : "",
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Error al descargar la plantilla");
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = plantilla.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al descargar plantilla:", err);
      alert(
        err.message || "Error al descargar la plantilla. Intenta de nuevo.",
      );
    }
  };

  const totalActividades = actividades.length;
  const actividadesCompletadas = actividades.filter(
    (a) => a.estado === "completed",
  ).length;
  const documentosRequeridos = actividades.filter(
    (a) => a.documentRequired === 1,
  ).length;
  const documentosSubidos = actividades.filter((a) => a.tieneDocumento).length;

  const progresoTotal =
    totalActividades > 0
      ? Math.round((actividadesCompletadas / totalActividades) * 100)
      : 0;

  const progresoActividades =
    totalActividades > 0
      ? Math.round((actividadesCompletadas / totalActividades) * 100)
      : 0;

  const progresoDocumentos =
    documentosRequeridos > 0
      ? Math.round((documentosSubidos / documentosRequeridos) * 100)
      : 0;

  const actividadesActivas = actividades.filter(
    (a) => a.estado !== "completed",
  );
  const actividadesFinalizadas = actividades.filter(
    (a) => a.estado === "completed",
  );

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      if (showNuevaActividadModal) handleCloseNuevaActividadModal();
      if (showDetalleActividadModal) handleCloseDetalleActividadModal();
      if (showActualizarActividadModal) handleCloseActualizarActividadModal();
      if (showPlantillasModal) handleClosePlantillasModal();
    }
  };

  const handleClosePlantillasModal = () => {
    setShowPlantillasModal(false);
    setPlantillas([]);
    document.body.style.overflow = "auto";
  };

  const fetchFormResponses = async () => {
    setLoadingForm(true);
    try {
      // Obtener el formulario por proyecto ID
      const response = await fetch(
        `http://gestiondeproyectos.local/wp-json/psm/public/projects/${id}/form/responses`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data && Object.keys(data).length > 0 && data.id) {
          setFormResponses(data);

          // Obtener archivos del formulario
          const filesResponse = await fetch(
            `http://gestiondeproyectos.local/wp-json/psm/public/projects/${id}/form/files`,
            {
              method: "GET",
              headers: {
                "Content-Type": "application/json",
              },
            },
          );

          if (filesResponse.ok) {
            const files = await filesResponse.json();
            setFormFiles(files);
          }
        } else {
          setFormResponses(null);
        }
      } else {
        setFormResponses(null);
      }
    } catch (error) {
      console.error("Error al cargar respuestas del formulario:", error);
      setFormResponses(null);
    } finally {
      setLoadingForm(false);
    }
  };

  // Llamar a la función al cargar el componente
  useEffect(() => {
    fetchFormResponses();
  }, [id]);

  // Función para descargar archivo del formulario
  const handleDownloadFormFile = async (file) => {
  try {
    const response = await fetch(
      `http://gestiondeproyectos.local/wp-json/psm/public/projects/${id}/form/files/${file.id}/download`,
      {
        method: "GET",
      },
    );

    if (!response.ok) {
      throw new Error("Error al descargar el archivo");
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error al descargar archivo:", error);
    alert("Error al descargar el archivo");
  }
};

const stripHtml = (html) => {
  if (!html) return "";
  const temp = document.createElement("div");
  temp.innerHTML = html;
  return temp.textContent || temp.innerText || "";
};

const renderFormResponse = () => {
  if (loadingForm) {
    return (
      <div className="form-loading">
        <div className="loading-spinner-small"></div>
        <p>Cargando respuestas del formulario...</p>
      </div>
    );
  }

  if (
    !formResponses ||
    Object.keys(formResponses).length === 0 ||
    !formResponses.id
  ) {
    return (
      <div className="form-empty">
        <p>Parece ser que no ha sido respondido el formulario.</p>
        <p>Envía el siguiente enlace al interesado:</p>
        <div className="form-link-container">
          <a
            href={`http://localhost:5173/proyecto/${id}/formulario`}
            target="_blank"
            rel="noopener noreferrer"
            className="form-link"
          >
            http://localhost:5173/proyecto/{id}/formulario
          </a>
          <button
            className="btn-copy-link"
            onClick={() => {
              navigator.clipboard.writeText(
                `http://localhost:5173/proyecto/${id}/formulario`,
              );
              alert("Enlace copiado al portapapeles");
            }}
          >
            Copiar enlace
          </button>
        </div>
      </div>
    );
  }

  // Mapeo de campos para mostrar - con mejor organización
  const fieldsMapping = [
    { key: "StrategicObjective", label: "🎯 Objetivo Estratégico" },
    { key: "GeneralObjective", label: "📌 Objetivo General" },
    { key: "ProjectDescription", label: "📋 Descripción General" },
    { key: "ActivitiesToAutomate", label: "⚙️ Actividades a sistematizar" },
    { key: "ScopeLevel", label: "🌍 Nivel de Alcance" },
    { key: "UsersNeeded", label: "👥 Perfiles de usuario requeridos" },
    { key: "TargetUser", label: "👤 Personal al que va dirigido" },
    {
      key: "CurrentProcessDescription",
      label: "🔄 Descripción del proceso actual",
    },
    {
      key: "CurrentProcessTime",
      label: "⏱️ Tiempo invertido en proceso actual",
    },
    { key: "Frequency", label: "📅 Frecuencia del proceso" },
  ];

  return (
    <>
      <div className="form-actions-header">
        <a
          href={`http://localhost:5173/proyecto/${id}/formulario`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-responder-link"
        >
          <FaEdit className="btn-icon" />
          Responder preguntas nuevamente
        </a>
      </div>

      <div className="form-responses-grid">
        {fieldsMapping.map((field) => {
          const value = formResponses[field.key];
          if (!value || value === "") return null;

          // Verificar si el contenido contiene HTML
          const hasHtml = /<[a-z][\s\S]*>/i.test(value);
          const hasList = /<(ul|ol|li)/i.test(value);
          const hasFormatting = /<(b|strong|i|em|u|span)/i.test(value);

          return (
            <div key={field.key} className="form-response-card">
              <div className="response-label">{field.label}</div>
              <div className="response-value">
                {hasHtml || hasList || hasFormatting ? (
                  <div 
                    className="rich-text-content"
                    dangerouslySetInnerHTML={{ __html: value }} 
                  />
                ) : (
                  <p>{value}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Sección de archivos adjuntos */}
      {formFiles && formFiles.length > 0 && (
        <div className="form-files-section">
          <h4>📎 Documentos Adjuntos ({formFiles.length})</h4>
          <div className="form-files-list">
            {formFiles.map((file) => (
              <div key={file.id} className="form-file-item">
                {getFileIcon(file.file_name)}
                <div className="form-file-info">
                  <span className="form-file-name">{file.file_name}</span>
                  <span className="form-file-size">
                    {(file.file_size / 1024).toFixed(2)} KB
                  </span>
                </div>
                <button
                  className="form-file-download"
                  onClick={() => handleDownloadFormFile(file)}
                  title="Descargar archivo"
                >
                  <FaDownload />
                  <span>Descargar</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

  <div className="project-stats-compact"></div>;

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

  if (error || !projectData) {
    return (
      <div className="panorama-container">
        <Sidebar />
        <main className="contenido-principal">
          <div className="error-message-banner">
            {error || "Proyecto no encontrado"}
            <button
              onClick={() => navigate("/panorama")}
              className="btn-reintentar"
            >
              Volver al panorama
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="panorama-container">
      <Sidebar />

      <main className="contenido-principal">
        <div className="project-header">
          <h1 className="titulo-proyecto">{projectData.titulo}</h1>
          <div className="header-buttons">
            <button
              className="btn-plantillas"
              onClick={handleOpenEditarProyectoModal}
            >
              <FaEdit className="btn-icon" />
              Editar Proyecto
            </button>
            <button className="btn-plantillas" onClick={handleVerPlantillas}>
              <FaFolderOpen className="btn-icon" />
              Ver Plantillas
            </button>
          </div>
        </div>

        <div className="project-info-grid">
          <div className="info-card descripcion-card">
            <div className="card-header">
              <MdDescription className="card-icon" />
              <h3>Descripción</h3>
            </div>
            <p className="descripcion-texto">{projectData.descripcion}</p>
          </div>

          <div className="info-card">
            <div className="card-header">
              <FaCalendarAlt className="card-icon" />
              <h3>Fecha de Creación</h3>
            </div>
            <p className="fecha-texto">{projectData.fechaCreacion}</p>
          </div>

          <div className="info-card responsables-card">
            <div className="card-header">
              <FaUser className="card-icon" />
              <h3>Responsables</h3>
            </div>
            <div className="responsables-lista">
              {projectData.responsables.length > 0 ? (
                projectData.responsables.map((responsable, index) => (
                  <div key={index} className="responsable-item">
                    <span className="responsable-nombre">{responsable}</span>
                  </div>
                ))
              ) : (
                <p className="sin-responsables">Sin responsables asignados</p>
              )}
            </div>
          </div>
        </div>

        {/* Estadísticas del Proyecto - Versión Compacta */}
        <div className="project-stats-compact">
          <div className="stats-grid-compact">
            <div className="stat-card-compact">
              <div className="stat-header-compact">
                <FaTasks className="stat-icon-compact" />
                <span className="stat-label-compact">Actividades</span>
              </div>
              <div className="stat-value-compact">
                {actividadesCompletadas}/{totalActividades}
              </div>
              <div className="stat-progress-compact">
                <div className="progress-track-compact">
                  <div
                    className="progress-fill-compact actividades-fill"
                    style={{ width: `${progresoActividades}%` }}
                  ></div>
                </div>
                <span className="progress-percent-compact">
                  {progresoActividades}%
                </span>
              </div>
            </div>

            <div className="stat-card-compact">
              <div className="stat-header-compact">
                <FaFileAlt className="stat-icon-compact" />
                <span className="stat-label-compact">Documentos</span>
              </div>
              <div className="stat-value-compact">
                {documentosSubidos}/{documentosRequeridos}
              </div>
              <div className="stat-progress-compact">
                <div className="progress-track-compact">
                  <div
                    className="progress-fill-compact documentos-fill"
                    style={{ width: `${progresoDocumentos}%` }}
                  ></div>
                </div>
                <span className="progress-percent-compact">
                  {progresoDocumentos}%
                </span>
              </div>
            </div>

            <div className="stat-card-compact total">
              <div className="stat-header-compact">
                <FaChartPie className="stat-icon-compact" />
                <span className="stat-label-compact">Progreso Total</span>
              </div>
              <div className="stat-value-compact total">{progresoTotal}%</div>
              <div className="stat-progress-compact">
                <div className="progress-track-compact">
                  <div
                    className="progress-fill-compact total-fill"
                    style={{ width: `${progresoTotal}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* SECCIÓN DEL FORMULARIO - RESULTADOS */}
          <div className="formulario-section">
            <div
              className="section-header collapsible-header"
              onClick={() => setIsFormSectionExpanded(!isFormSectionExpanded)}
            >
              <div className="header-left">
                <FaFileAlt className="section-icon" />
                <h2>Formulario del Proyecto</h2>
              </div>
              <div className="header-right">
                <span className="form-status-badge">
                  {formResponses && formResponses.id
                    ? "✓ Respondido"
                    : "⏳ Pendiente"}
                </span>
                <FaChevronDown
                  className={`collapse-icon ${isFormSectionExpanded ? "expanded" : ""}`}
                />
              </div>
            </div>
            {isFormSectionExpanded && (
              <div className="formulario-container">{renderFormResponse()}</div>
            )}
          </div>
        </div>

        <div className="actividades-section">
          <div className="section-header">
            <MdAssignment className="section-icon" />
            <h2>Actividades del Proyecto</h2>
            <button
              className="btn-nueva-actividad-header"
              onClick={handleOpenNuevaActividadModal}
            >
              <FaPlus className="btn-icon" />
              Nueva Actividad
            </button>
          </div>

          <div className="actividades-container">
            {/* Actividades Activas */}
            {actividadesActivas.length > 0 && (
              <>
                <h3 className="actividades-subseccion-titulo">
                  <FaClock className="subseccion-icon" />
                  En progreso ({actividadesActivas.length})
                </h3>
                <table className="tabla-actividades">
                  <thead>
                    <tr>
                      <th>Prioridad</th>
                      <th>Estado</th>
                      <th>Actividad</th>
                      <th>Responsable</th>
                      <th>Fecha Límite</th>
                      <th>Documento</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {actividadesActivas.map((actividad) => (
                      <tr key={actividad.id} className="actividad-row">
                        <td
                          onClick={() =>
                            handleOpenActualizarActividadModal(actividad)
                          }
                        >
                          <div
                            className="prioridad-indicador"
                            style={{
                              backgroundColor: getPrioridadColor(
                                actividad.prioridad,
                              ),
                            }}
                            title={`Prioridad ${actividad.prioridad}`}
                          >
                            <FaFlag size={12} />
                          </div>
                        </td>
                        <td
                          onClick={() =>
                            handleOpenActualizarActividadModal(actividad)
                          }
                        >
                          <div
                            className={`estado-badge estado-${actividad.estado}`}
                          >
                            {getEstadoIcon(actividad.estado)}
                            <span>{getEstadoTexto(actividad.estado)}</span>
                          </div>
                        </td>
                        <td
                          onClick={() =>
                            handleOpenActualizarActividadModal(actividad)
                          }
                          className="actividad-nombre"
                        >
                          {actividad.nombre}
                        </td>
                        <td
                          onClick={() =>
                            handleOpenActualizarActividadModal(actividad)
                          }
                        >
                          {actividad.responsable}
                        </td>
                        <td
                          onClick={() =>
                            handleOpenActualizarActividadModal(actividad)
                          }
                        >
                          {actividad.fechaFin || "No definida"}
                        </td>
                        <td
                          onClick={() =>
                            handleOpenActualizarActividadModal(actividad)
                          }
                        >
                          {(() => {
                            if (actividad.tieneDocumento) {
                              return (
                                <div
                                  className="documento-indicador"
                                  title="Documento subido"
                                >
                                  <FaFile className="documento-icon subido" />
                                </div>
                              );
                            }
                            if (actividad.documentRequired === 1) {
                              return (
                                <div
                                  className="documento-indicador"
                                  title="Requiere documento - Pendiente"
                                >
                                  <FaFile className="documento-icon requerido" />
                                </div>
                              );
                            }
                            return (
                              <div
                                className="documento-indicador"
                                title="No requiere documento"
                              >
                                <FaFile className="documento-icon no-requerido" />
                              </div>
                            );
                          })()}
                        </td>
                        <td className="acciones-cell">
                          <div className="acciones-container">
                            <button
                              className="btn-actualizar-actividad"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenActualizarActividadModal(actividad);
                              }}
                              title="Actualizar estado y documento"
                            >
                              <FaPercent />
                            </button>
                            <button
                              className="btn-editar-actividad"
                              onClick={(e) =>
                                handleOpenDetalleActividadModal(e, actividad)
                              }
                              title="Editar actividad"
                            >
                              <FaEdit />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}

            {/* Actividades Finalizadas (minimizadas) */}
            {actividadesFinalizadas.length > 0 && (
              <div className="finalizadas-section">
                <div
                  className="finalizadas-header"
                  onClick={() =>
                    setShowActividadesFinalizadas(!showActividadesFinalizadas)
                  }
                >
                  <h3 className="actividades-subseccion-titulo finalizadas-titulo">
                    <FaCheckCircle className="subseccion-icon" />
                    Actividades Finalizadas ({actividadesFinalizadas.length})
                  </h3>
                  <button className="expand-button-finalizadas">
                    {showActividadesFinalizadas ? (
                      <FaChevronDown />
                    ) : (
                      <FaChevronDown />
                    )}
                    {showActividadesFinalizadas ? "Mostrar menos" : "Mostrar"}
                  </button>
                </div>

                {showActividadesFinalizadas && (
                  <table className="tabla-actividades finalizadas-tabla">
                    <thead>
                      <tr>
                        <th>Prioridad</th>
                        <th>Estado</th>
                        <th>Actividad</th>
                        <th>Responsable</th>
                        <th>Fecha Límite</th>
                        <th>Documento</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {actividadesFinalizadas.map((actividad) => (
                        <tr
                          key={actividad.id}
                          className="actividad-row finalizada-row"
                        >
                          <td
                            onClick={() =>
                              handleOpenActualizarActividadModal(actividad)
                            }
                          >
                            <div
                              className="prioridad-indicador"
                              style={{
                                backgroundColor: getPrioridadColor(
                                  actividad.prioridad,
                                ),
                              }}
                              title={`Prioridad ${actividad.prioridad}`}
                            >
                              <FaFlag size={12} />
                            </div>
                          </td>

                          <td
                            onClick={() =>
                              handleOpenActualizarActividadModal(actividad)
                            }
                          >
                            <div
                              className={`estado-badge estado-${actividad.estado}`}
                            >
                              {getEstadoIcon(actividad.estado)}
                              <span>{getEstadoTexto(actividad.estado)}</span>
                            </div>
                          </td>
                          <td
                            className="actividad-nombre"
                            onClick={() =>
                              handleOpenActualizarActividadModal(actividad)
                            }
                          >
                            {actividad.nombre}
                          </td>
                          <td
                            onClick={() =>
                              handleOpenActualizarActividadModal(actividad)
                            }
                          >
                            {actividad.responsable}
                          </td>
                          <td
                            onClick={() =>
                              handleOpenActualizarActividadModal(actividad)
                            }
                          >
                            {actividad.fechaFin || "No definida"}
                          </td>
                          <td
                            onClick={() =>
                              handleOpenActualizarActividadModal(actividad)
                            }
                          >
                            {(() => {
                              if (actividad.tieneDocumento) {
                                return (
                                  <div
                                    className="documento-indicador"
                                    title="Documento subido"
                                  >
                                    <FaFile className="documento-icon subido" />
                                  </div>
                                );
                              }
                              if (actividad.documentRequired === 1) {
                                return (
                                  <div
                                    className="documento-indicador"
                                    title="Requiere documento - Pendiente"
                                  >
                                    <FaFile className="documento-icon requerido" />
                                  </div>
                                );
                              }
                              return (
                                <div
                                  className="documento-indicador"
                                  title="No requiere documento"
                                >
                                  <FaFile className="documento-icon no-requerido" />
                                </div>
                              );
                            })()}
                          </td>
                          <td className="acciones-cell">
                            <div className="acciones-container">
                              <button
                                className="btn-actualizar-actividad"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenActualizarActividadModal(actividad);
                                }}
                                title="Actualizar estado y documento"
                              >
                                <FaPercent />
                              </button>
                              <button
                                className="btn-editar-actividad"
                                onClick={(e) =>
                                  handleOpenDetalleActividadModal(e, actividad)
                                }
                                title="Editar actividad"
                              >
                                <FaEdit />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {actividadesActivas.length === 0 &&
              actividadesFinalizadas.length === 0 && (
                <div className="no-actividades">
                  <p>No hay actividades para este proyecto.</p>
                </div>
              )}
          </div>
        </div>
      </main>

      {showNuevaActividadModal && (
        <div className="modal-overlay" onClick={handleCloseNuevaActividadModal}>
          <div
            className="modal-contenido"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
            tabIndex={-1}
          >
            <div className="modal-header">
              <h2>Nueva Actividad</h2>
              <button
                className="modal-close"
                onClick={handleCloseNuevaActividadModal}
              >
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
                <label htmlFor="actividad-nombre">
                  <MdAssignment className="label-icon" />
                  Nombre de la actividad
                </label>
                <input
                  type="text"
                  id="actividad-nombre"
                  name="nombre"
                  value={nuevaActividad.nombre}
                  onChange={(e) =>
                    setNuevaActividad({
                      ...nuevaActividad,
                      nombre: e.target.value,
                    })
                  }
                  placeholder="Ej: Desarrollo de módulo de autenticación"
                  className={errores.nombre ? "error" : ""}
                  autoFocus
                />
                {errores.nombre && (
                  <span className="error-message">{errores.nombre}</span>
                )}
              </div>

              <div className="modal-form-row">
                <div className="modal-form-group half">
                  <label htmlFor="fecha-inicio">
                    <FaCalendarAlt className="label-icon" />
                    Fecha de inicio
                  </label>
                  <input
                    type="date"
                    id="fecha-inicio"
                    name="fechaInicio"
                    value={nuevaActividad.fechaInicio}
                    onChange={(e) =>
                      setNuevaActividad({
                        ...nuevaActividad,
                        fechaInicio: e.target.value,
                      })
                    }
                  />
                  {errores.fechaInicio && (
                    <span className="error-message">{errores.fechaInicio}</span>
                  )}
                </div>

                <div className="modal-form-group half">
                  <label htmlFor="fecha-fin">
                    <FaCalendarAlt className="label-icon" />
                    Fecha de finalización
                  </label>
                  <input
                    type="date"
                    id="fecha-fin"
                    name="fechaFin"
                    value={nuevaActividad.fechaFin}
                    onChange={(e) =>
                      setNuevaActividad({
                        ...nuevaActividad,
                        fechaFin: e.target.value,
                      })
                    }
                  />
                  {errores.fechaFin && (
                    <span className="error-message">{errores.fechaFin}</span>
                  )}
                </div>
              </div>

              <div className="modal-form-group">
                <label htmlFor="prioridad">
                  <FaFlag className="label-icon" />
                  Prioridad
                </label>
                <select
                  id="prioridad"
                  name="prioridad"
                  value={nuevaActividad.prioridad}
                  onChange={(e) =>
                    setNuevaActividad({
                      ...nuevaActividad,
                      prioridad: e.target.value,
                    })
                  }
                >
                  {prioridades.map((p) => (
                    <option key={p.valor} value={p.valor}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-form-group">
                <label htmlFor="responsable">
                  <FaUser className="label-icon" />
                  Responsable
                </label>
                <select
                  id="responsable"
                  name="responsable_id"
                  value={nuevaActividad.responsable_id || ""}
                  onChange={(e) => {
                    const userId = e.target.value;
                    const user = usuarios[userId];
                    setNuevaActividad({
                      ...nuevaActividad,
                      responsable_id: userId,
                      responsable: user
                        ? user.display_name || user.username
                        : "",
                    });
                  }}
                  className={errores.responsable ? "error" : ""}
                >
                  <option value="">Sin responsable</option>
                  {Object.entries(usuarios).map(([id, user]) => (
                    <option key={id} value={id}>
                      {user.display_name || user.username}
                    </option>
                  ))}
                </select>
                {errores.responsable && (
                  <span className="error-message">{errores.responsable}</span>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="modal-btn-cancelar"
                onClick={handleCloseNuevaActividadModal}
              >
                Cancelar
              </button>
              <button
                className="modal-btn-guardar"
                onClick={handleGuardarActividad}
              >
                <FaSave className="btn-icon" />
                Guardar Actividad
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetalleActividadModal && actividadEditada && (
        <div
          className="modal-overlay"
          onClick={handleCloseDetalleActividadModal}
        >
          <div
            className="modal-contenido modal-detalle"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
            tabIndex={-1}
          >
            <div className="modal-header">
              <h2>Editar Actividad</h2>
              <button
                className="modal-close"
                onClick={handleCloseDetalleActividadModal}
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              {erroresEdicion.general && (
                <div className="error-message-banner modal-error">
                  {erroresEdicion.general}
                </div>
              )}

              <div className="detalle-estado-prioridad">
                <div className="detalle-select-group">
                  <label>Estado</label>
                  <select
                    name="estado"
                    value={actividadEditada.estado}
                    onChange={(e) =>
                      setActividadEditada({
                        ...actividadEditada,
                        estado: e.target.value,
                      })
                    }
                    className="detalle-select"
                  >
                    {estados.map((e) => (
                      <option key={e.valor} value={e.valor}>
                        {e.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="detalle-select-group">
                  <label>Prioridad</label>
                  <select
                    name="prioridad"
                    value={actividadEditada.prioridad}
                    onChange={(e) =>
                      setActividadEditada({
                        ...actividadEditada,
                        prioridad: e.target.value,
                      })
                    }
                    className="detalle-select"
                  >
                    {prioridades.map((p) => (
                      <option key={p.valor} value={p.valor}>
                        {p.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="detalle-info-group">
                <label htmlFor="edit-nombre">
                  <MdAssignment className="label-icon" />
                  Nombre de la actividad
                </label>
                <input
                  type="text"
                  id="edit-nombre"
                  name="nombre"
                  value={actividadEditada.nombre}
                  onChange={(e) =>
                    setActividadEditada({
                      ...actividadEditada,
                      nombre: e.target.value,
                    })
                  }
                  className="detalle-input"
                  placeholder="Nombre de la actividad"
                />
              </div>

              <div className="detalle-fechas-grid">
                <div className="detalle-info-group">
                  <label htmlFor="edit-fechaInicio">
                    <FaCalendarAlt className="label-icon" />
                    Fecha de inicio
                  </label>
                  <input
                    type="date"
                    id="edit-fechaInicio"
                    name="fechaInicio"
                    value={actividadEditada.fechaInicio}
                    onChange={(e) =>
                      setActividadEditada({
                        ...actividadEditada,
                        fechaInicio: e.target.value,
                      })
                    }
                    className="detalle-input"
                  />
                </div>

                <div className="detalle-info-group">
                  <label htmlFor="edit-fechaFin">
                    <FaCalendarAlt className="label-icon" />
                    Fecha de finalización
                  </label>
                  <input
                    type="date"
                    id="edit-fechaFin"
                    name="fechaFin"
                    value={actividadEditada.fechaFin}
                    onChange={(e) =>
                      setActividadEditada({
                        ...actividadEditada,
                        fechaFin: e.target.value,
                      })
                    }
                    className="detalle-input"
                  />
                </div>
              </div>

              <div className="detalle-info-group">
                <label htmlFor="edit-responsable">
                  <FaUser className="label-icon" />
                  Responsable
                </label>
                <select
                  id="edit-responsable"
                  name="responsable_id"
                  value={actividadEditada.responsable_id || ""}
                  onChange={(e) => {
                    const userId = e.target.value;
                    const user = usuarios[userId];
                    setActividadEditada({
                      ...actividadEditada,
                      responsable_id: userId,
                      responsable: user
                        ? user.display_name || user.username
                        : "No asignado",
                    });
                  }}
                  className="detalle-select"
                >
                  <option value="">Sin responsable</option>
                  {Object.entries(usuarios).map(([id, user]) => (
                    <option key={id} value={id}>
                      {user.display_name || user.username}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="modal-btn-cancelar"
                onClick={handleCloseDetalleActividadModal}
              >
                Cancelar
              </button>
              <button
                className="modal-btn-guardar"
                onClick={handleGuardarCambios}
              >
                <FaSave className="btn-icon" />
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {showActualizarActividadModal && actividadActualizar && (
        <div
          className="modal-overlay"
          onClick={handleCloseActualizarActividadModal}
        >
          <div
            className="modal-contenido modal-actualizar"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
            tabIndex={-1}
          >
            <div className="modal-header">
              <h2>Actualizar Actividad</h2>
              <button
                className="modal-close"
                onClick={handleCloseActualizarActividadModal}
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              {erroresActualizar.general && (
                <div className="error-message-banner modal-error">
                  {erroresActualizar.general}
                </div>
              )}

              <div className="modal-form-group">
                <label htmlFor="actualizar-estado">
                  <FaCheckCircle className="label-icon" />
                  Estado de la actividad
                </label>

                {(() => {
                  const actividadOriginal = actividades.find(
                    (a) => a.id === actividadActualizar.id,
                  );
                  const requiereDocumento =
                    actividadOriginal?.documentRequired === 1;

                  const tieneDocumentoAhora =
                    actividadOriginal?.tieneDocumento ||
                    actividadActualizar.archivos?.length > 0 ||
                    !!archivoActualizar;

                  const opcionesEstado = estados.map((estado) => {
                    const isDisabled =
                      estado.valor === "completed" &&
                      requiereDocumento &&
                      !tieneDocumentoAhora;

                    return (
                      <option
                        key={estado.valor}
                        value={estado.valor}
                        disabled={isDisabled}
                        style={
                          isDisabled
                            ? { color: "#999", fontStyle: "italic" }
                            : {}
                        }
                      >
                        {estado.label}{" "}
                        {isDisabled ? " (Requiere documento)" : ""}
                      </option>
                    );
                  });

                  return (
                    <select
                      id="actualizar-estado"
                      name="estado"
                      value={actividadActualizar.estado}
                      onChange={(e) =>
                        setActividadActualizar({
                          ...actividadActualizar,
                          estado: e.target.value,
                        })
                      }
                    >
                      {opcionesEstado}
                    </select>
                  );
                })()}

                {(() => {
                  const actividadOriginal = actividades.find(
                    (a) => a.id === actividadActualizar.id,
                  );
                  const requiereDocumento =
                    actividadOriginal?.documentRequired === 1;
                  const tieneDocumentoAhora =
                    actividadOriginal?.tieneDocumento ||
                    actividadActualizar.archivos?.length > 0 ||
                    !!archivoActualizar;

                  if (
                    requiereDocumento &&
                    !tieneDocumentoAhora &&
                    actividadActualizar.estado === "completed"
                  ) {
                    return (
                      <div
                        className="warning-message"
                        style={{
                          color: "#F44336",
                          marginTop: "0.5rem",
                          fontSize: "0.85rem",
                        }}
                      >
                        <FaExclamationCircle
                          style={{ marginRight: "0.3rem" }}
                        />
                        Esta actividad requiere un documento. Debes subir un
                        documento antes de marcarla como completada.
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              <div className="modal-form-group">
                <label htmlFor="actualizar-archivo">
                  <FaFile className="label-icon" />
                  Documento de la actividad
                </label>

                {!archivoActualizar &&
                  actividadActualizar.archivos?.length > 0 && (
                    <div className="documento-existente-container">
                      <div className="archivo-existente">
                        <div className="archivo-info">
                          {getFileIcon(
                            actividadActualizar.archivos[0].nombre ||
                              "documento.pdf",
                          )}
                          <span className="archivo-nombre">
                            {actividadActualizar.archivos[0].nombre ||
                              "Documento adjunto"}
                          </span>
                        </div>
                        <div className="archivo-acciones">
                          <button
                            className="archivo-btn descargar"
                            onClick={() =>
                              handleDescargarDocumento(actividadActualizar.id)
                            }
                            title="Descargar documento"
                          >
                            <FaDownload />
                          </button>
                          <button
                            className="archivo-btn reemplazar"
                            onClick={() =>
                              document
                                .getElementById("actualizar-archivo")
                                .click()
                            }
                            title="Reemplazar documento"
                          >
                            <FaEdit />
                          </button>
                        </div>
                      </div>
                      <p className="documento-nota">
                        Haz clic en <FaEdit /> para reemplazar el documento
                        actual
                      </p>
                    </div>
                  )}

                {!archivoActualizar &&
                  actividadActualizar.archivos?.length === 0 && (
                    <div className="no-documento-container">
                      <p className="no-documento">
                        Esta actividad no tiene documento adjunto
                      </p>
                      <button
                        className="btn-agregar-documento"
                        onClick={() =>
                          document.getElementById("actualizar-archivo").click()
                        }
                      >
                        <FaPlus size={12} />
                        Agregar documento
                      </button>
                    </div>
                  )}

                <input
                  type="file"
                  id="actualizar-archivo"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setArchivoActualizar(file);
                      setErroresActualizar((prev) => ({
                        ...prev,
                        archivo: null,
                      }));
                    }
                  }}
                  className="file-input-hidden"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                />

                {archivoActualizar && (
                  <div className="archivo-preview-container">
                    <h4>Nuevo documento a subir:</h4>
                    <div className="archivo-preview">
                      {getFileIcon(archivoActualizar.name)}
                      <span className="preview-nombre">
                        {archivoActualizar.name}
                      </span>
                      <span className="preview-tamaño">
                        {(archivoActualizar.size / 1024).toFixed(2)} KB
                      </span>
                      <button
                        className="preview-eliminar"
                        onClick={() => setArchivoActualizar(null)}
                        title="Cancelar"
                      >
                        <FaTimes />
                      </button>
                    </div>
                    {actividadActualizar.archivos?.length > 0 && (
                      <p className="reemplazar-nota">
                        ⚠️ Este documento reemplazará al existente
                      </p>
                    )}
                    <p
                      className="documento-listook"
                      style={{
                        color: "#4CAF50",
                        marginTop: "0.5rem",
                        fontWeight: "bold",
                      }}
                    >
                      <FaCheckCircle style={{ marginRight: "0.3rem" }} />
                      Documento listo para subir. Ya puedes marcar como
                      completada.
                    </p>
                  </div>
                )}
              </div>

              <div className="actualizar-info">
                <p>
                  {actividadActualizar.archivos?.length > 0
                    ? "📄 Puedes descargar el documento actual o reemplazarlo por uno nuevo."
                    : "📎 Puedes adjuntar un documento a esta actividad."}
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="modal-btn-cancelar"
                onClick={handleCloseActualizarActividadModal}
              >
                Cancelar
              </button>
              <button
                className="modal-btn-guardar"
                onClick={handleGuardarActualizacion}
              >
                <FaSave className="btn-icon" />
                Actualizar
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditarProyectoModal && proyectoEditado && (
        <div className="modal-overlay" onClick={handleCloseEditarProyectoModal}>
          <div
            className="modal-contenido modal-proyecto"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
            tabIndex={-1}
          >
            <div className="modal-header">
              <h2>Editar Proyecto</h2>
              <button
                className="modal-close"
                onClick={handleCloseEditarProyectoModal}
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              {erroresProyecto.general && (
                <div className="error-message-banner modal-error">
                  {erroresProyecto.general}
                </div>
              )}

              <div className="modal-form-group">
                <label htmlFor="proyecto-nombre">
                  <MdAssignment className="label-icon" />
                  Nombre del Proyecto
                </label>
                <input
                  type="text"
                  id="proyecto-nombre"
                  name="nombre"
                  value={proyectoEditado.nombre}
                  onChange={handleProyectoInputChange}
                  placeholder="Nombre del proyecto"
                  className={erroresProyecto.nombre ? "error" : ""}
                  autoFocus
                />
                {erroresProyecto.nombre && (
                  <span className="error-message">
                    {erroresProyecto.nombre}
                  </span>
                )}
              </div>

              <div className="modal-form-group">
                <label htmlFor="proyecto-descripcion">
                  <MdDescription className="label-icon" />
                  Descripción del Proyecto
                </label>
                <textarea
                  id="proyecto-descripcion"
                  name="descripcion"
                  value={proyectoEditado.descripcion}
                  onChange={handleProyectoInputChange}
                  placeholder="Describe el propósito, alcance y objetivos del proyecto..."
                  rows="4"
                  className={erroresProyecto.descripcion ? "error" : ""}
                />
                {erroresProyecto.descripcion && (
                  <span className="error-message">
                    {erroresProyecto.descripcion}
                  </span>
                )}
              </div>

              <div className="modal-form-group">
                <label htmlFor="proyecto-responsables">
                  <FaUser className="label-icon" />
                  Responsables del Proyecto
                </label>

                <div className="custom-select-container">
                  <div
                    className={`custom-select ${erroresProyecto.responsables ? "error" : ""}`}
                    onClick={() =>
                      setShowResponsablesDropdown(!showResponsablesDropdown)
                    }
                  >
                    <div className="select-selected">
                      {responsablesSeleccionados.length === 0 ? (
                        <span className="placeholder">
                          Selecciona los responsables...
                        </span>
                      ) : (
                        <div className="selected-items">
                          {responsablesSeleccionados.map((r) => (
                            <span key={r.id} className="selected-tag">
                              {r.nombre.split(" ").slice(0, 2).join(" ")}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <FaChevronDown
                      className={`select-arrow ${showResponsablesDropdown ? "open" : ""}`}
                    />
                  </div>
                  {showResponsablesDropdown && (
                    <div className="select-dropdown">
                      {Object.entries(usuarios).length === 0 ? (
                        <div className="no-results">
                          No hay usuarios disponibles
                        </div>
                      ) : (
                        Object.entries(usuarios).map(([id, user]) => {
                          const isSelected = responsablesSeleccionados.some(
                            (r) => r.id == id,
                          );
                          return (
                            <div
                              key={id}
                              className={`select-option ${isSelected ? "selected" : ""}`}
                              onClick={() =>
                                handleResponsableProyectoToggle({ id, ...user })
                              }
                            >
                              <div className="option-info">
                                <span className="option-nombre">
                                  {user.display_name || user.username}
                                </span>
                                <span className="option-rol">
                                  {user.email || ""}
                                </span>
                              </div>
                              {isSelected && (
                                <span className="check-mark">✓</span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
                {erroresProyecto.responsables && (
                  <span className="error-message">
                    {erroresProyecto.responsables}
                  </span>
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="modal-btn-cancelar"
                onClick={handleCloseEditarProyectoModal}
              >
                Cancelar
              </button>
              <button
                className="modal-btn-guardar"
                onClick={handleGuardarProyecto}
              >
                <FaSave className="btn-icon" />
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {showPlantillasModal && (
        <div className="modal-overlay" onClick={handleClosePlantillasModal}>
          <div
            className="modal-contenido modal-plantillas"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
            tabIndex={-1}
          >
            <div className="modal-header">
              <h2>
                <FaFolderOpen className="modal-title-icon" />
                Plantillas Disponibles
              </h2>
              <button
                className="modal-close"
                onClick={handleClosePlantillasModal}
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              {cargandoPlantillas ? (
                <div className="plantillas-loading">
                  <div className="loading-spinner"></div>
                  <p>Cargando plantillas...</p>
                </div>
              ) : (
                <>
                  <p className="plantillas-descripcion">
                    Estas son las plantillas disponibles para descargar y
                    modificar según el sistema.
                  </p>

                  <div className="plantillas-lista">
                    {plantillas.length === 0 ? (
                      <p className="no-plantillas">
                        No hay plantillas disponibles
                      </p>
                    ) : (
                      plantillas.map((plantilla) => (
                        <div key={plantilla.id} className="plantilla-item">
                          <div className="plantilla-info">
                            {getFileIcon(plantilla.file_name)}
                            <div className="plantilla-detalles">
                              <span className="plantilla-nombre">
                                {plantilla.name}
                              </span>
                              <span className="plantilla-metadata">
                                •{(plantilla.file_size / 1024).toFixed(2)} KB
                              </span>
                              {plantilla.description && (
                                <span className="plantilla-descripcion">
                                  {plantilla.description}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            className="plantilla-btn-descargar"
                            onClick={() => handleDescargarPlantilla(plantilla)}
                            title="Descargar plantilla"
                          >
                            <FaDownload />
                            <span>Descargar</span>
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer">
              <button
                className="modal-btn-cancelar"
                onClick={handleClosePlantillasModal}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Project;
