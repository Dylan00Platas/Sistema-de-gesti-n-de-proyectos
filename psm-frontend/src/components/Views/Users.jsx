import { useEffect, useState } from "react";
import {
  FaEnvelope,
  FaKey,
  FaPlus,
  FaSave,
  FaSearch,
  FaTimes,
  FaToggleOff,
  FaToggleOn,
  FaUser,
  FaUserTag
} from "react-icons/fa";
import { MdAdminPanelSettings, MdWork } from "react-icons/md";
import { apiClient } from "../../api";
import { DIVISIONES, getZonasByDivision } from "../divisiones";
import Sidebar from "../sidebar";
import "./styles.css";
import "./users.css";


import "./styles.css";
import "./users.css";

function Users() {
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState("nuevo");
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [errores, setErrores] = useState({});
  const [zonasDisponibles, setZonasDisponibles] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const [nuevoUsuario, setNuevoUsuario] = useState({
    username: "",
    nombre: "",
    display_name: "",
    first_name: "",
    last_name: "",
    email: "",
    tipo: "editor",
    password: "",
    confirmPassword: ""
  });

  const roleMapping = {
    'administrator': 'Administrador',
    'editor': 'Desarrollador',
    'author': 'Autor',
    'contributor': 'Colaborador',
    'subscriber': 'Usuario'
  };

  const tiposUsuario = [
    { value: 'administrator', label: 'Administrador' },
    { value: 'editor', label: 'Desarrollador' }
  ];

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get('/users');

      let usuariosArray = [];

      if (Array.isArray(response)) {
        usuariosArray = response;
      } else if (response && typeof response === 'object') {
        usuariosArray = Object.values(response);
      }

      setUsuarios(usuariosArray);
    } catch (err) {
      console.error('Error al cargar usuarios:', err);
      setError('No se pudieron cargar los usuarios. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

const scrollToTop = () => {
  const contenidoPrincipal = document.querySelector('.contenido-principal');
  if (contenidoPrincipal) {
    contenidoPrincipal.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  } else {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }
};

useEffect(() => {
  if (showModal) {
    setTimeout(() => {
      const contenidoPrincipal = document.querySelector('.contenido-principal');
      if (contenidoPrincipal) {
        contenidoPrincipal.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }, 10);
  }
}, [showModal]);

  useEffect(() => {
    if (nuevoUsuario.division) {
      const zonas = getZonasByDivision(nuevoUsuario.division);
      setZonasDisponibles(zonas);

      if (!zonas.some(z => z.idZona === nuevoUsuario.zona)) {
        setNuevoUsuario(prev => ({ ...prev, zona: "" }));
      }
    } else {
      setZonasDisponibles([]);
      setNuevoUsuario(prev => ({ ...prev, zona: "" }));
    }
  }, [nuevoUsuario.division]);

  const usuariosFiltrados = usuarios.filter(usuario =>
    usuario.display_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    usuario.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (usuario.roles && usuario.roles.some(role =>
      roleMapping[role]?.toLowerCase().includes(searchTerm.toLowerCase())
    ))
  );

  const handleNuevoUsuario = () => {
    setModalMode("nuevo");
    scrollToTop();
    setNuevoUsuario({
      username: "",
      nombre: "",
      display_name: "",
      first_name: "",
      last_name: "",
      email: "",
      tipo: tiposUsuario[0].value,
      password: "",
      confirmPassword: ""
    });
    setErrores({});
    setShowModal(true);
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
  };

  const handleVerUsuario = (usuario) => {
   scrollToTop();

    setModalMode("editar");
    setUsuarioSeleccionado(usuario);

    const nombreParts = usuario.display_name?.split(' ') || [];
    const firstName = nombreParts[0] || '';
    const lastName = nombreParts.slice(1).join(' ') || '';

    setNuevoUsuario({
      username: usuario.username || '',
      nombre: usuario.display_name || '',
      display_name: usuario.display_name || '',
      first_name: usuario.first_name || firstName,
      last_name: usuario.last_name || lastName,
      email: usuario.email || '',
      tipo: usuario.roles?.[0] || 'subscriber',
      password: "",
      confirmPassword: "",
      rpe: usuario.rpe || '',
      division: usuario.section || '',
      zona: usuario.zone || ''
    });

    if (usuario.division) {
      const zonas = getZonasByDivision(usuario.division);
      setZonasDisponibles(zonas);
    }

    setErrores({});
    setShowModal(true);
    document.body.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setModalMode("nuevo");
    setUsuarioSeleccionado(null);
    setNuevoUsuario({
      username: "",
      nombre: "",
      display_name: "",
      first_name: "",
      last_name: "",
      email: "",
      tipo: "subscriber",
      password: "",
      confirmPassword: "",
      rpe: "",
      division: "",
      zona: ""
    });
    setZonasDisponibles([]);
    setErrores({});
    document.body.classList.remove('modal-open');
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;


    setNuevoUsuario(prev => {
      const updated = {
        ...prev,
        [name]: value
      };
      return updated;
    });

    if (name === 'nombre') {
      const nombreParts = value.split(' ');
      setNuevoUsuario(prev => ({
        ...prev,
        display_name: value,
        first_name: nombreParts[0] || '',
        last_name: nombreParts.slice(1).join(' ') || ''
      }));
    }

    if (errores[name]) {
      setErrores({
        ...errores,
        [name]: null
      });
    }
  };



  const validarFormulario = () => {
    const nuevosErrores = {};

    if (modalMode === "nuevo") {
      if (!nuevoUsuario.username?.trim()) {
        nuevosErrores.username = "El nombre de usuario es requerido";
      }
    }

    if (!nuevoUsuario.nombre?.trim()) {
      nuevosErrores.nombre = "El nombre completo es requerido";
    }

    if (nuevoUsuario.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nuevoUsuario.email)) {
      nuevosErrores.email = "Ingresa un correo electrónico válido";
    }

    if (!nuevoUsuario.tipo) {
      nuevosErrores.tipo = "El tipo de usuario es requerido";
    }

    if (modalMode === "nuevo") {
      if (!nuevoUsuario.password) {
        nuevosErrores.password = "La contraseña es requerida";
      } else if (nuevoUsuario.password.length < 6) {
        nuevosErrores.password = "La contraseña debe tener al menos 6 caracteres";
      }

      if (nuevoUsuario.password !== nuevoUsuario.confirmPassword) {
        nuevosErrores.confirmPassword = "Las contraseñas no coinciden";
      }
    }

    return nuevosErrores;
  };

  const handleGuardarUsuario = async () => {
    const nuevosErrores = validarFormulario();

    if (Object.keys(nuevosErrores).length > 0) {
      setErrores(nuevosErrores);
      return;
    }

    setSaving(true);
    setError(null);

    try {
      if (modalMode === "nuevo") {
        const userData = {
          username: nuevoUsuario.username,
          password: nuevoUsuario.password,
          display_name: nuevoUsuario.nombre,
          first_name: nuevoUsuario.first_name,
          last_name: nuevoUsuario.last_name,
          role: nuevoUsuario.tipo,
          rpe: nuevoUsuario.rpe || null,
          section: nuevoUsuario.division || null,
          zone: nuevoUsuario.zona || null
        };

        if (nuevoUsuario.email?.trim()) {
          userData.email = nuevoUsuario.email;
        }

        const response = await apiClient.post('/users', userData);

        if (response.success) {
          await cargarUsuarios();
          handleCloseModal();
        }
      } else {
        const userData = {
          display_name: nuevoUsuario.nombre,
          first_name: nuevoUsuario.first_name,
          last_name: nuevoUsuario.last_name,
          rpe: nuevoUsuario.rpe || null,
          section: nuevoUsuario.division || null,
          zone: nuevoUsuario.zona || null
        };

        if (nuevoUsuario.email?.trim() && nuevoUsuario.email !== usuarioSeleccionado.email) {
          userData.email = nuevoUsuario.email;
        }

        if (nuevoUsuario.password?.trim()) {
          userData.password = nuevoUsuario.password;
        }

        userData.role = nuevoUsuario.tipo;

        const response = await apiClient.put(`/users/${usuarioSeleccionado.ID}`, userData);

        if (response.success) {
          await cargarUsuarios();
          handleCloseModal();
        }
      }
    } catch (err) {
      console.error('Error al guardar usuario:', err);
      setError(err.message || 'Error al guardar el usuario');
    } finally {
      setSaving(false);
    }
  };
  const handleToggleActivo = async (usuario) => {
    try {
      const isActive = Number(usuario.status) === 0;

      if (isActive) {
        await apiClient.post(`/users/${usuario.ID}/deactivate`);
      } else {
        await apiClient.post(`/users/${usuario.ID}/activate`);
      }

      await cargarUsuarios();
    } catch (err) {
      console.error('Error al cambiar estado:', err);
      setError('Error al cambiar el estado del usuario');
    }
  };



  const getRolAmigable = (usuario) => {
    if (!usuario.roles || usuario.roles.length === 0) return 'Usuario';
    return roleMapping[usuario.roles[0]] || usuario.roles[0];
  };

  const getRolValue = (usuario) => {
    if (!usuario.roles || usuario.roles.length === 0) return 'subscriber';
    return usuario.roles[0];
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      handleCloseModal();
    }
  };

  return (
    <div className="panorama-container">
      <Sidebar tipoAcceso={1} />

      <main className="contenido-principal">
        <div className="project-header">
          <h1 className="titulo-proyecto">Administración de Usuarios</h1>
          <div className="header-buttons">

            <button
              className="btn-nueva-actividad"
              onClick={handleNuevoUsuario}
              disabled={loading}
            >
              <FaPlus className="btn-icon" />
              Nuevo Usuario
            </button>
          </div>
        </div>

        <div className="users-search-container">
          <div className="search-box">
            <FaSearch className="search-icon" />
            <input
              type="text"
              placeholder="Buscar usuarios por nombre, usuario, correo o tipo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              disabled={loading}
            />
          </div>
        </div>

        {error && (
          <div className="error-message-banner">
            {error}
            <button onClick={() => setError(null)} className="close-error">
              <FaTimes />
            </button>
          </div>
        )}

        <div className="users-table-container">
          {loading ? (
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p></p>
            </div>
          ) : (
            <table className="users-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Nombre de usuario</th>
                  <th>Correo Electrónico</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {usuariosFiltrados.length > 0 ? (
                  usuariosFiltrados.map((usuario) => (
                    <tr
                      key={usuario.ID}
                      onClick={() => handleVerUsuario(usuario)}
                      className="user-row"
                    >
                      <td>
                        <div className="user-name-cell">
                          <FaUser className="user-icon" />
                          {usuario.display_name || usuario.username}
                        </div>
                      </td>
                      <td>{usuario.username}</td>
                      <td>{usuario.email || '—'}</td>
                      <td>
                        <span className={`user-type-badge tipo-${getRolValue(usuario)}`}>
                          {usuario.roles?.includes('administrator') && <MdAdminPanelSettings className="type-icon" />}
                          {usuario.roles?.includes('editor') && <MdWork className="type-icon" />}

                          {getRolAmigable(usuario)}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${Number(usuario.status) === 0 ? 'activo' : 'inactivo'}`}>
                          {Number(usuario.status) === 0 ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="no-results">
                      No se encontraron usuarios
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {showModal && (
          <div className="modal-overlay-users" style={{ overflow: 'hidden' }} onClick={handleCloseModal}>
            <div
              className="modal-contenido-users modal-usuario"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={handleKeyDown}
              tabIndex={-1}
            >
              <div className="modal-header">
                <h2>
                  {modalMode === "nuevo" ? "Nuevo Usuario" : "Detalles del Usuario"}
                </h2>
                <button className="modal-close" onClick={handleCloseModal}>
                  <FaTimes />
                </button>
              </div>

              <div className="modal-body-users">
                {modalMode === "nuevo" && (
                  <div className="modal-form-group">
                    <label htmlFor="username">
                      <FaUser className="label-icon" />
                      Nombre de usuario *
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={nuevoUsuario.username}
                      onChange={handleInputChange}
                      placeholder="Ej: juan.perez"
                      className={errores.username ? "error" : ""}
                      autoFocus
                    />
                    {errores.username && <span className="error-message">{errores.username}</span>}
                  </div>
                )}

                <div className="modal-form-group">
                  <label htmlFor="nombre">
                    <FaUser className="label-icon" />
                    Nombre completo *
                  </label>
                  <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    value={nuevoUsuario.nombre}
                    onChange={handleInputChange}
                    placeholder="Ej: Juan Pérez García"
                    className={errores.nombre ? "error" : ""}
                    autoFocus={modalMode === "editar"}
                  />
                  {errores.nombre && <span className="error-message">{errores.nombre}</span>}
                </div>

                <div className="modal-form-group">
                  <label htmlFor="email">
                    <FaEnvelope className="label-icon" />
                    Correo electrónico <span className="opcional">(opcional)</span>
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={nuevoUsuario.email}
                    onChange={handleInputChange}
                    placeholder="ejemplo@cfe.mx"
                    className={errores.email ? "error" : ""}
                  />
                  {errores.email && <span className="error-message">{errores.email}</span>}
                </div>

                <div className="modal-form-group">
                  <label htmlFor="tipo">
                    <FaUserTag className="label-icon" />
                    Tipo de usuario *
                  </label>
                  <select
                    id="tipo"
                    name="tipo"
                    value={nuevoUsuario.tipo}
                    onChange={handleInputChange}
                    className={errores.tipo ? "error" : ""}
                  >
                    {tiposUsuario.map(tipo => (
                      <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
                    ))}
                  </select>
                  {errores.tipo && <span className="error-message">{errores.tipo}</span>}
                </div>

                <div className="modal-form-group">
                  <label htmlFor="rpe">
                    <FaKey className="label-icon" />
                    RPE
                  </label>
                  <input
                    type="text"
                    id="rpe"
                    name="rpe"
                    value={nuevoUsuario.rpe || ''}
                    onChange={handleInputChange}
                    placeholder="Ej: 12ASD34G56"
                    className={errores.rpe ? "error" : ""}
                  />
                  {errores.rpe && <span className="error-message">{errores.rpe}</span>}
                </div>

                <div className="modal-form-group">
                  <label htmlFor="division">
                    <FaUserTag className="label-icon" />
                    División
                  </label>
                  <select
                    id="division"
                    name="division"
                    value={nuevoUsuario.division || ''}
                    onChange={handleInputChange}
                    className={errores.division ? "error" : ""}
                  >
                    <option value="">Selecciona una división</option>
                    {Object.entries(DIVISIONES).map(([id, nombre]) => (
                      <option key={id} value={id}>
                        {id}: {nombre}
                      </option>
                    ))}
                  </select>
                  {errores.division && <span className="error-message">{errores.division}</span>}
                </div>

                {nuevoUsuario.division && (
                  <div className="modal-form-group">
                    <label htmlFor="zona">
                      <FaUserTag className="label-icon" />
                      Zona
                    </label>
                    <select
                      id="zona"
                      name="zona"
                      value={nuevoUsuario.zona || ''}
                      onChange={handleInputChange}
                      className={errores.zona ? "error" : ""}
                      disabled={zonasDisponibles.length === 0}
                    >
                      <option value="">Selecciona una zona</option>
                      {zonasDisponibles.map(zona => (
                        <option key={zona.idZona} value={zona.idZona}>
                          {zona.idZona}: {zona.nombre}
                        </option>
                      ))}
                    </select>
                    {errores.zona && <span className="error-message">{errores.zona}</span>}
                  </div>
                )}

                {modalMode === "nuevo" && (
                  <>
                    <div className="modal-form-group">
                      <label htmlFor="password">
                        <FaKey className="label-icon" />
                        Contraseña *
                      </label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={nuevoUsuario.password}
                        onChange={handleInputChange}
                        placeholder="Mínimo 6 caracteres"
                        className={errores.password ? "error" : ""}
                      />
                      {errores.password && <span className="error-message">{errores.password}</span>}
                    </div>

                    <div className="modal-form-group">
                      <label htmlFor="confirmPassword">
                        <FaKey className="label-icon" />
                        Confirmar contraseña *
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={nuevoUsuario.confirmPassword}
                        onChange={handleInputChange}
                        placeholder="Repite la contraseña"
                        className={errores.confirmPassword ? "error" : ""}
                      />
                      {errores.confirmPassword && <span className="error-message">{errores.confirmPassword}</span>}
                    </div>
                  </>
                )}

                {modalMode === "editar" && (
                  <div className="modal-form-group">
                    <label htmlFor="password">
                      <FaKey className="label-icon" />
                      Nueva contraseña <span className="opcional">(dejar vacío para no cambiar)</span>
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={nuevoUsuario.password}
                      onChange={handleInputChange}
                      placeholder="Nueva contraseña (opcional)"
                      className={errores.password ? "error" : ""}
                    />
                    {errores.password && <span className="error-message">{errores.password}</span>}
                  </div>
                )}

                {modalMode === "editar" && usuarioSeleccionado && (
                  <div className="usuario-info-adicional">
                    <div className="info-item">
                      <span className="info-label">Usuario:</span>
                      <span className="info-value">{usuarioSeleccionado.username}</span>
                    </div>
                    <div className="info-item">
                      <span className="info-label">Registrado:</span>
                      <span className="info-value">
                        {new Date(usuarioSeleccionado.registered).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                {modalMode === "editar" && (
                  <>

                    <button
                      className={`modal-btn-toggle ${Number(usuarioSeleccionado?.status) === 0 ? 'desactivar' : 'activar'}`}
                      onClick={() => handleToggleActivo(usuarioSeleccionado)}
                      disabled={saving}
                    >
                      {Number(usuarioSeleccionado?.status) === 0 ? (
                        <>
                          <FaToggleOff className="btn-icon" />
                          {saving ? 'Procesando...' : 'Desactivar'}
                        </>
                      ) : (
                        <>
                          <FaToggleOn className="btn-icon" />
                          {saving ? 'Procesando...' : 'Activar'}
                        </>
                      )}
                    </button>
                  </>
                )}
                <button className="modal-btn-cancelar" onClick={handleCloseModal}>
                  Cancelar
                </button>
                <button
                  className="modal-btn-guardar"
                  onClick={handleGuardarUsuario}
                  disabled={saving}
                >
                  <FaSave className="btn-icon" />
                  {saving ? 'Guardando...' : (modalMode === "nuevo" ? "Crear Usuario" : "Guardar Cambios")}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Users;