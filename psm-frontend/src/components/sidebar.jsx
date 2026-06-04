import { useEffect, useState } from "react";
import {
  FaCog,
  FaPlus,
  FaSearch,
  FaUserCircle,
  FaUsers
} from "react-icons/fa";
import { FaCalendar } from "react-icons/fa6";
import { IoLogOutOutline, IoMenuOutline } from "react-icons/io5";
import { MdDashboard } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { apiClient } from "../api";
import "./sidebar.css";

function Sidebar() {
  const navigate = useNavigate();
  const [colapsada, setColapsada] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [userData, setUserData] = useState({
    nombre: "Invitado",
    rol: "Invitado",
    isAdmin: false,
    loading: true
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem('auth_token');
      console.log('Token en localStorage:', token);
      
      if (!token) {
        setUserData({
          nombre: "Invitado",
          rol: "Invitado",
          isAdmin: false,
          loading: false
        });
        return;
      }

      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const decoded = JSON.parse(jsonPayload);
        console.log('Token decodificado:', decoded);
        
        const userId = decoded.id || decoded.user_id;
        const username = decoded.username || decoded.user_nicename || 'Usuario';
        
        if (userId) {
          const userResponse = await apiClient.get(`/users/${userId}`);
          console.log('Datos del usuario desde backend:', userResponse);
          
          const isAdmin = userResponse.roles && userResponse.roles.includes('administrator');
          
          setUserData({
            nombre: userResponse.display_name || username,
            userId: userId,
            isAdmin: isAdmin,
            rol: isAdmin ? 'Administrador' : 'Usuario',
            loading: false
          });
        } else {
          setUserData({
            nombre: username,
            isAdmin: false,
            rol: 'Usuario',
            loading: false
          });
        }
      } catch (error) {
        console.error('Error al obtener datos del usuario:', error);
        setUserData({
          nombre: "Usuario",
          rol: "Usuario",
          isAdmin: false,
          loading: false
        });
      }
    };

    fetchUserData();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
    window.location.reload();
  };

  const toggleSidebar = () => {
    setColapsada(!colapsada);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      navigate(`/busqueda?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const handleSearchClick = () => {
    if (searchTerm.trim()) {
      navigate(`/busqueda?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const baseMenuItems = [
    { icon: <MdDashboard />, texto: "Panorama", ruta: "/panorama", id: "panorama" },
    { icon: <FaPlus />, texto: "Nuevo Proyecto", ruta: "/nuevo-proyecto", id: "proyecto" },
    { icon: <FaCalendar />, texto: "Calendario" , ruta: "/calendario" , id: "calendario"}
  ];

  const usuariosMenuItem = { 
    icon: <FaUsers />, 
    texto: "Usuarios", 
    ruta: "/usuarios", 
    id: "usuarios" 
  };

    const ajustesMenuItem = { 
    icon: <FaCog  />, 
    texto: "Ajustes", 
    ruta: "/ajustes", 
    id: "ajustes" 
  };

  const menuItems = userData.isAdmin 
    ? [...baseMenuItems, usuariosMenuItem,ajustesMenuItem] 
    : baseMenuItems;

  const handleNavigation = (ruta) => {
    navigate(ruta);
  };

  if (userData.loading) {
    return (
      <aside className={`sidebar ${colapsada ? "colapsada" : ""}`}>
        <div className="sidebar-header">
          <div className="logo-container">
            <h2 className="titulo-sidebar">CFE</h2>
          </div>
          <button className="toggle-btn" onClick={toggleSidebar}>
            <IoMenuOutline />
          </button>
        </div>
        <div className="user-profile">
          <div className="avatar">
            <FaUserCircle />
          </div>
          <div className="user-info">
            <span className="user-name">Cargando...</span>
            <span className="user-rol">...</span>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className={`sidebar ${colapsada ? "colapsada" : ""}`}>
      <div className="sidebar-header">
        <div className="logo-container" onClick={() => navigate("/")}>
            <img src="/resources/logo verde.svg" alt="CFE" className="logo-image" />
                    </div>
        <button className="toggle-btn" onClick={toggleSidebar}>
          <IoMenuOutline />
        </button>
      </div>

      <div className="user-profile">
        <div className="avatar">
          <FaUserCircle />
        </div>
        <div className="user-info">
          <span className="user-name">{userData.nombre}</span>
          <span className="user-rol">{userData.rol}</span>
        </div>
      </div>

      <div className="search-container">
        <input 
          type="text" 
          placeholder="Buscar proyectos..." 
          className="search-input"
          value={searchTerm}
          onChange={handleSearchChange}
          onKeyDown={handleSearchKeyDown}
        />
        <FaSearch 
          className="search-icon clickable" 
          onClick={handleSearchClick}
          title="Buscar"
        />
      </div>

      <nav className="sidebar-nav">
        <ul>
          {menuItems.map((item, index) => (
            <li 
              key={item.id}
              onClick={() => handleNavigation(item.ruta)}
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <span className="icon-container">{item.icon}</span>
              <span className="texto">{item.texto}</span>
            </li>
          ))}
        </ul>
      </nav>

      <button className="logout-btn" onClick={handleLogout}>
        <IoLogOutOutline />
        <span>Cerrar Sesión</span>
      </button>

      <div className="version-info">
        <span> Oficina de TICs Xalapa </span>
      </div>
    </aside>
  );
}

export default Sidebar;