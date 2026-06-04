import { useEffect, useState } from "react";
import {
  FaChartPie,
  FaCheckCircle,
  FaChevronDown,
  FaChevronUp,
  FaClock,
  FaExclamationCircle,
  FaExternalLinkAlt,
  FaFileAlt,
  FaFileExcel,
  FaFileImage,
  FaFilePdf,
  FaFileWord,
  FaFlag,
  FaFolderOpen,
  FaTasks,
  FaUsers,
} from "react-icons/fa";
import { MdAssignment } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../../api";
import Sidebar from "../sidebar";
import "./generalOverview.css";
import "./styles.css";

function GeneralOverview() {
  const navigate = useNavigate();
  const [proyectosExpandidos, setProyectosExpandidos] = useState({});
  const [finalizadosExpandidos, setFinalizadosExpandidos] = useState(false);
  const [proyectos, setProyectos] = useState([]);
  const [actividades, setActividades] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [usuarios, setUsuarios] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [documentosPorActividad, setDocumentosPorActividad] = useState({});

  useEffect(() => {
    cargarDatos();
  }, []);

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

      console.log("Mapa de usuarios cargado:", mapaUsuarios);
      setUsuarios(mapaUsuarios);
      return mapaUsuarios;
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      return {};
    }
  };

  const cargarDatos = async () => {
    try {
      setLoading(true);

      const mapaUsuarios = await cargarUsuarios();

      const proyectosData = await apiClient.get("/projects");
      let proyectosArray = [];
      if (Array.isArray(proyectosData)) {
        proyectosArray = proyectosData;
      } else if (proyectosData && typeof proyectosData === "object") {
        proyectosArray = Object.values(proyectosData);
      }

      const actividadesData = await apiClient.get("/activities");
      let actividadesArray = [];
      if (Array.isArray(actividadesData)) {
        actividadesArray = actividadesData;
      } else if (actividadesData && typeof actividadesData === "object") {
        actividadesArray = Object.values(actividadesData);
      }
      setActividades(actividadesArray);

      const documentosData = await apiClient.get("/documents");
      let documentosArray = [];
      if (Array.isArray(documentosData)) {
        documentosArray = documentosData;
      } else if (documentosData && typeof documentosData === "object") {
        documentosArray = Object.values(documentosData);
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
      setDocumentosPorActividad(docsPorActividad);

      const proyectosProcesados = proyectosArray.map((proyecto) => {
        const actividadesProyecto = actividadesArray.filter(
          (a) => a.project_id == proyecto.id,
        );

        const actividadesCompletadas = actividadesProyecto.filter(
          (a) => a.status === "completed",
        ).length;
        const totalActividades = actividadesProyecto.length;
        const progreso =
          totalActividades > 0
            ? Math.round((actividadesCompletadas / totalActividades) * 100)
            : 0;

        const actividadesConDocumentoRequerido = actividadesProyecto.filter(
          (a) => a.documentRequired === "1" || a.documentRequired === 1,
        );

        const actividadesConDocumentoSubido =
          actividadesConDocumentoRequerido.filter(
            (a) => docsPorActividad[a.id] > 0,
          );

        return {
          id: proyecto.id,
          nombre: proyecto.name,
          descripcion: proyecto.description,
          fechaInicio: proyecto.created_at?.split(" ")[0] || "",
          fechaFin: proyecto.end_date || "No definida",
          responsables: [],
          progreso: progreso,
          actividades: actividadesProyecto.map((a) => {
            let responsableDisplay = "No asignado";
            if (a.assigned_to && mapaUsuarios[a.assigned_to]) {
              responsableDisplay =
                mapaUsuarios[a.assigned_to].display_name ||
                mapaUsuarios[a.assigned_to].username ||
                `Usuario ${a.assigned_to}`;
            } else if (a.assigned_to) {
              responsableDisplay = `Usuario ${a.assigned_to}`;
            }

            return {
              id: a.id,
              nombre: a.name,
              estado: a.status,
              prioridad: a.priority,
              responsable_id: a.assigned_to,
              responsable_nombre: responsableDisplay,
              documentRequired:
                a.documentRequired === "1" || a.documentRequired === 1 ? 1 : 0,
              tieneDocumento: docsPorActividad[a.id] > 0,
            };
          }),
          documentos: {
            total: actividadesConDocumentoRequerido.length,
            completados: actividadesConDocumentoSubido.length,
          },
        };
      });

      for (let i = 0; i < proyectosProcesados.length; i++) {
        try {
          const users = await apiClient.get(
            `/projects/${proyectosProcesados[i].id}/users`,
          );
          let usersArray = [];
          if (Array.isArray(users)) {
            usersArray = users;
          } else if (users && typeof users === "object") {
            usersArray = Object.values(users);
          }
          proyectosProcesados[i].responsables = usersArray.map(
            (u) => u.display_name || u.user_login,
          );
        } catch (err) {
          console.log(
            `No se pudieron cargar responsables para proyecto ${proyectosProcesados[i].id}`,
          );
          proyectosProcesados[i].responsables = [];
        }
      }

      console.log("Proyectos procesados:", proyectosProcesados);
      setProyectos(proyectosProcesados);
      setError(null);
    } catch (err) {
      console.error("Error al cargar datos:", err);
      setError("No se pudieron cargar los datos. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const toggleProyecto = (proyectoId) => {
    setProyectosExpandidos((prev) => ({
      ...prev,
      [proyectoId]: !prev[proyectoId],
    }));
  };

  const toggleFinalizados = () => {
    setFinalizadosExpandidos(!finalizadosExpandidos);
  };

  const handleVerProyecto = (e, proyectoId) => {
    e.stopPropagation();
    navigate(`/proyecto/${proyectoId}`);
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
      case "urgente":
        return "#F44336";
      case "media":
        return "#FFC107";
      case "baja":
        return "#4CAF50";
      default:
        return "#FFC107";
    }
  };

  const getFileIcon = (mimeType) => {
    if (!mimeType) return <FaFileAlt />;
    if (mimeType.includes("pdf")) return <FaFilePdf />;
    if (mimeType.includes("word") || mimeType.includes("document"))
      return <FaFileWord />;
    if (mimeType.includes("excel") || mimeType.includes("sheet"))
      return <FaFileExcel />;
    if (mimeType.includes("image")) return <FaFileImage />;
    return <FaFileAlt />;
  };

  const totalProyectos = proyectos.length;
  const proyectosCompletados = proyectos.filter(
    (p) => p.progreso === 100,
  ).length;
  const proyectosEnProgreso = proyectos.filter(
    (p) => p.progreso > 0 && p.progreso < 100,
  ).length;
  const proyectosPendientes = proyectos.filter((p) => p.progreso === 0).length;

  const totalActividadesGlobal = proyectos.reduce(
    (acc, proyecto) => acc + proyecto.actividades.length,
    0,
  );

  const actividadesCompletadasGlobal = proyectos.reduce(
    (acc, proyecto) =>
      acc + proyecto.actividades.filter((a) => a.estado === "completed").length,
    0,
  );

  const totalDocumentosRequeridosGlobal = proyectos.reduce(
    (acc, proyecto) =>
      acc + proyecto.actividades.filter((a) => a.documentRequired === 1).length,
    0,
  );

  const documentosSubidosGlobal = documentos.length;

  const proyectosActivos = proyectos.filter((p) => p.progreso < 100);
  const proyectosFinalizados = proyectos.filter((p) => p.progreso === 100);

  const getNombreResponsable = (actividad) => {
    if (
      actividad.responsable_nombre &&
      actividad.responsable_nombre !== "No asignado"
    ) {
      return actividad.responsable_nombre;
    }
    if (actividad.responsable_id && usuarios[actividad.responsable_id]) {
      return (
        usuarios[actividad.responsable_id].display_name ||
        usuarios[actividad.responsable_id].username ||
        `Usuario ${actividad.responsable_id}`
      );
    }
    return "No asignado";
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

  if (error) {
    return (
      <div className="panorama-container">
        <Sidebar />
        <main className="contenido-principal">
          <div className="error-message-banner">
            {error}
            <button
              onClick={() => window.location.reload()}
              className="btn-reintentar"
            >
              Reintentar
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
        <h1 className="titulo-panorama">Panorama Global</h1>

        <div className="stats-general-container">
          <div className="stats-card">
            <div className="stats-header">
              <FaChartPie className="stats-icon" />
              <h3>Resumen General</h3>
            </div>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Total Proyectos</span>
                <span className="stat-value">{totalProyectos}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">En Progreso</span>
                <span className="stat-value progreso">
                  {proyectosEnProgreso}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Completados</span>
                <span className="stat-value completado">
                  {proyectosCompletados}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Pendientes</span>
                <span className="stat-value pendiente">
                  {proyectosPendientes}
                </span>
              </div>
            </div>

            <div className="pie-chart-container">
              <div className="pie-chart">
                <svg viewBox="0 0 100 100" className="pie-svg">
                  {totalProyectos > 0 && (
                    <>
                      {proyectosCompletados > 0 && (
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke="#4CAF50"
                          strokeWidth="20"
                          strokeDasharray={`${(proyectosCompletados / totalProyectos) * 251.2} 251.2`}
                          strokeDashoffset="0"
                          transform="rotate(-90 50 50)"
                          className="pie-segment completado"
                        />
                      )}
                      {proyectosEnProgreso > 0 && (
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke="#FFC107"
                          strokeWidth="20"
                          strokeDasharray={`${(proyectosEnProgreso / totalProyectos) * 251.2} 251.2`}
                          strokeDashoffset={`-${(proyectosCompletados / totalProyectos) * 251.2}`}
                          transform="rotate(-90 50 50)"
                          className="pie-segment progreso"
                        />
                      )}
                      {proyectosPendientes > 0 && (
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke="#F44336"
                          strokeWidth="20"
                          strokeDasharray={`${(proyectosPendientes / totalProyectos) * 251.2} 251.2`}
                          strokeDashoffset={`-${((proyectosCompletados + proyectosEnProgreso) / totalProyectos) * 251.2}`}
                          transform="rotate(-90 50 50)"
                          className="pie-segment pendiente"
                        />
                      )}
                    </>
                  )}
                </svg>
              </div>
              <div className="pie-legend">
                <div className="legend-item">
                  <span className="legend-color completado"></span>
                  <span>Completados ({proyectosCompletados})</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color progreso"></span>
                  <span>En progreso ({proyectosEnProgreso})</span>
                </div>
                <div className="legend-item">
                  <span className="legend-color pendiente"></span>
                  <span>Pendientes ({proyectosPendientes})</span>
                </div>
              </div>
            </div>

            <div className="global-stats-footer">
              <div className="global-stat">
                <FaTasks className="global-icon" />
                <div>
                  <span className="global-label">Actividades</span>
                  <span className="global-value">
                    {actividadesCompletadasGlobal}/{totalActividadesGlobal}
                  </span>
                </div>
              </div>
              <div className="global-stat">
                <FaFileAlt className="global-icon" />
                <div>
                  <span className="global-label">Documentos</span>
                  <span className="global-value">
                    {documentosSubidosGlobal}/{totalDocumentosRequeridosGlobal}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="proyectos-container">
          <h2 className="proyectos-titulo">
            <FaFolderOpen className="section-icon" />
            Proyectos Activos ({proyectosActivos.length})
          </h2>

          {proyectosActivos.length === 0 ? (
            <div className="no-proyectos">
              <p>No hay proyectos activos en este momento.</p>
            </div>
          ) : (
            proyectosActivos.map((proyecto) => {
              const actividadesCompletadas = proyecto.actividades.filter(
                (a) => a.estado === "completed",
              ).length;
              const totalActividades = proyecto.actividades.length;
              const documentosRequeridos = proyecto.actividades.filter(
                (a) => a.documentRequired === 1,
              ).length;
              const documentosSubidos = proyecto.actividades.filter(
                (a) => a.tieneDocumento,
              ).length;

              return (
                <div key={proyecto.id} className="proyecto-card">
                  <div
                    className="proyecto-header"
                    onClick={() => toggleProyecto(proyecto.id)}
                  >
                    <div className="proyecto-header-left">
                      <button className="expand-button">
                        {proyectosExpandidos[proyecto.id] ? (
                          <FaChevronUp />
                        ) : (
                          <FaChevronDown />
                        )}
                      </button>
                      <div className="proyecto-info">
                        <h3 className="proyecto-nombre">{proyecto.nombre}</h3>
                        <p className="proyecto-descripcion">
                          {proyecto.descripcion}
                        </p>
                      </div>
                    </div>
                    <div className="proyecto-header-right">
                      <div className="proyecto-responsables">
                        <FaUsers className="responsables-icon" />
                        <span>
                          {proyecto.responsables.length > 0
                            ? proyecto.responsables.join(", ")
                            : "Sin responsables"}
                        </span>
                      </div>
                      <div className="proyecto-fechas">
                        <span>Inicio: {proyecto.fechaInicio}</span>
                        {proyecto.fechaFin !== "No definida" && (
                          <span>Fin: {proyecto.fechaFin}</span>
                        )}
                      </div>
                      <div className="proyecto-progreso">
                        <div className="progreso-label">Porcentaje total</div>
                        <div className="progreso-contenedor">
                          <div className="progreso-barra">
                            <div
                              className="progreso-llenado"
                              style={{ width: `${proyecto.progreso}%` }}
                            ></div>
                          </div>
                          <span className="progreso-texto">
                            {proyecto.progreso}%
                          </span>
                        </div>
                      </div>
                      <button
                        className="btn-ver-proyecto"
                        onClick={(e) => handleVerProyecto(e, proyecto.id)}
                        title="Ver detalles del proyecto"
                      >
                        <FaExternalLinkAlt className="btn-icon" />
                        <span>Ver Proyecto</span>
                      </button>
                    </div>
                  </div>

                  <div className="proyecto-counters">
                    <div className="proyecto-counter-item">
                      <FaTasks className="counter-item-icon" />
                      <span className="counter-item-label">Actividades:</span>
                      <span className="counter-item-value">
                        {actividadesCompletadas}/{totalActividades}
                      </span>
                      <div className="counter-item-bar">
                        <div
                          className="counter-item-fill"
                          style={{
                            width:
                              totalActividades > 0
                                ? `${(actividadesCompletadas / totalActividades) * 100}%`
                                : "0%",
                          }}
                        ></div>
                      </div>
                    </div>
                    <div className="proyecto-counter-item">
                      <FaFileAlt className="counter-item-icon" />
                      <span className="counter-item-label">Documentación:</span>
                      <span className="counter-item-value">
                        {documentosSubidos}/{documentosRequeridos}
                      </span>
                      <div className="counter-item-bar">
                        <div
                          className="counter-item-fill documentos-fill"
                          style={{
                            width:
                              documentosRequeridos > 0
                                ? `${(documentosSubidos / documentosRequeridos) * 100}%`
                                : "0%",
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {proyectosExpandidos[proyecto.id] && (
                    <div className="actividades-lista">
                      <h4 className="actividades-subtitulo">
                        <MdAssignment className="subtitulo-icon" />
                        Lista de Actividades
                      </h4>

                      <table className="actividades-tabla">
                        <thead>
                          <tr>
                            <th>Prioridad</th>
                            <th>Estado</th>
                            <th>Actividad</th>
                            <th>Responsable</th>
                            <th>Documento</th>
                          </tr>
                        </thead>
                        <tbody>
                          {proyecto.actividades.map((actividad) => {
                            const nombreResponsable =
                              actividad.responsable_nombre ||
                              getNombreResponsable(actividad);

                            return (
                              <tr key={actividad.id} className="actividad-fila">
                                <td>
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
                                <td>
                                  <div
                                    className={`estado-badge estado-${actividad.estado}`}
                                  >
                                    {getEstadoIcon(actividad.estado)}
                                    <span>
                                      {getEstadoTexto(actividad.estado)}
                                    </span>
                                  </div>
                                </td>
                                <td className="actividad-nombre">
                                  {actividad.nombre}
                                </td>
                                <td>{nombreResponsable}</td>
                                <td>
                                  {actividad.documentRequired === 1 ? (
                                    actividad.tieneDocumento ? (
                                      <span
                                        className="documento-status completo"
                                        title="Documento subido"
                                      >
                                        <FaCheckCircle /> Subido
                                      </span>
                                    ) : (
                                      <span
                                        className="documento-status pendiente"
                                        title="Documento requerido"
                                      >
                                        <FaExclamationCircle /> Requerido
                                      </span>
                                    )
                                  ) : (
                                    <span className="documento-status no-requerido">
                                      —
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {proyectosFinalizados.length > 0 && (
          <div className="proyectos-container finalizados-container">
            <div className="finalizados-header" onClick={toggleFinalizados}>
              <h2 className="proyectos-titulo finalizados-titulo">
                <FaFolderOpen className="section-icon" />
                Proyectos Finalizados ({proyectosFinalizados.length})
              </h2>
              <button className="expand-button finalizados-expand">
                {finalizadosExpandidos ? <FaChevronUp /> : <FaChevronDown />}
              </button>
            </div>

            {finalizadosExpandidos && (
              <div className="finalizados-content">
                {proyectosFinalizados.map((proyecto) => {
                  const actividadesCompletadas = proyecto.actividades.filter(
                    (a) => a.estado === "completed",
                  ).length;
                  const totalActividades = proyecto.actividades.length;
                  const documentosRequeridos = proyecto.actividades.filter(
                    (a) => a.documentRequired === 1,
                  ).length;
                  const documentosSubidos = proyecto.actividades.filter(
                    (a) => a.tieneDocumento,
                  ).length;

                  return (
                    <div
                      key={proyecto.id}
                      className="proyecto-card finalizado-card"
                    >
                      <div className="proyecto-header">
                        <div className="proyecto-header-left">
                          <div className="proyecto-info">
                            <h3 className="proyecto-nombre">
                              {proyecto.nombre}
                            </h3>
                            <p className="proyecto-descripcion">
                              {proyecto.descripcion}
                            </p>
                          </div>
                        </div>
                        <div className="proyecto-header-right">
                          <div className="proyecto-responsables">
                            <FaUsers className="responsables-icon" />
                            <span>
                              {proyecto.responsables.length > 0
                                ? proyecto.responsables.join(", ")
                                : "Sin responsables"}
                            </span>
                          </div>
                          <div className="proyecto-fechas">
                            <span>Inicio: {proyecto.fechaInicio}</span>
                            {proyecto.fechaFin !== "No definida" && (
                              <span>Fin: {proyecto.fechaFin}</span>
                            )}
                          </div>
                          <div className="proyecto-progreso">
                            <div className="progreso-label">
                            Porcentaje total
                            </div>
                            <div className="progreso-contenedor">
                              <div className="progreso-barra">
                                <div
                                  className="progreso-llenado"
                                  style={{ width: `${proyecto.progreso}%` }}
                                ></div>
                              </div>
                              <span className="progreso-texto">
                                {proyecto.progreso}%
                              </span>
                            </div>
                          </div>
                          <button
                            className="btn-ver-proyecto"
                            onClick={(e) => handleVerProyecto(e, proyecto.id)}
                            title="Ver detalles del proyecto"
                          >
                            <FaExternalLinkAlt className="btn-icon" />
                            <span>Ver Proyecto</span>
                          </button>
                        </div>
                      </div>

                      <div className="proyecto-counters">
                        <div className="proyecto-counter-item">
                          <FaTasks className="counter-item-icon" />
                          <span className="counter-item-label">
                            Actividades:
                          </span>
                          <span className="counter-item-value">
                            {actividadesCompletadas}/{totalActividades}
                          </span>
                          <div className="counter-item-bar">
                            <div
                              className="counter-item-fill completado"
                              style={{ width: "100%" }}
                            ></div>
                          </div>
                        </div>
                        <div className="proyecto-counter-item">
                          <FaFileAlt className="counter-item-icon" />
                          <span className="counter-item-label">
                            Documentación:
                          </span>
                          <span className="counter-item-value">
                            {documentosSubidos}/{documentosRequeridos}
                          </span>
                          <div className="counter-item-bar">
                            <div
                              className="counter-item-fill documentos-fill"
                              style={{
                                width:
                                  documentosRequeridos > 0
                                    ? `${(documentosSubidos / documentosRequeridos) * 100}%`
                                    : "0%",
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      {proyectosExpandidos[proyecto.id] && (
                        <div className="actividades-lista">
                          <h4 className="actividades-subtitulo">
                            <MdAssignment className="subtitulo-icon" />
                            Lista de Actividades
                          </h4>

                          <table className="actividades-tabla">
                            <thead>
                              <tr>
                                <th>Prioridad</th>
                                <th>Estado</th>
                                <th>Actividad</th>
                                <th>Responsable</th>
                                <th>Documento</th>
                              </tr>
                            </thead>
                            <tbody>
                              {proyecto.actividades.map((actividad) => {
                                const nombreResponsable =
                                  actividad.responsable_nombre ||
                                  getNombreResponsable(actividad);

                                return (
                                  <tr
                                    key={actividad.id}
                                    className="actividad-fila"
                                  >
                                    <td>
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
                                    <td>
                                      <div
                                        className={`estado-badge estado-${actividad.estado}`}
                                      >
                                        {getEstadoIcon(actividad.estado)}
                                        <span>
                                          {getEstadoTexto(actividad.estado)}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="actividad-nombre">
                                      {actividad.nombre}
                                    </td>
                                    <td>{nombreResponsable}</td>
                                    <td>
                                      {actividad.documentRequired === 1 ? (
                                        actividad.tieneDocumento ? (
                                          <span
                                            className="documento-status completo"
                                            title="Documento subido"
                                          >
                                            <FaCheckCircle /> Subido
                                          </span>
                                        ) : (
                                          <span
                                            className="documento-status pendiente"
                                            title="Documento requerido"
                                          >
                                            <FaExclamationCircle /> Requerido
                                          </span>
                                        )
                                      ) : (
                                        <span className="documento-status no-requerido">
                                          —
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default GeneralOverview;
