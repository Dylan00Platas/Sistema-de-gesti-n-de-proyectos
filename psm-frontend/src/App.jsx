// App.jsx
import { Route, BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import Login from './components/login';
import ProtectedRoute from './components/ProtectedRoute';
import Calendar from './components/Views/Calendar';
import GeneralOverview from './components/Views/GeneralOverview';
import NewProject from './components/Views/NewProject';
import Project from './components/Views/Project';
import ProjectForm from './components/Views/ProjectForm';
import Search from './components/Views/Search';
import Settings from './components/Views/Settings';
import Users from './components/Views/Users';
import { AuthProvider } from './context/AuthContext';

function App() {
    return ( 
        <Router>
            <AuthProvider>
                <Routes>
                    {/* Rutas públicas */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/" element={<Login />} />
                    <Route path="/proyecto/:id/formulario" element={<ProjectForm />} />
                    
                    {/* Rutas protegidas */}
                    <Route 
                        path="/panorama" 
                        element={
                            <ProtectedRoute>
                                <GeneralOverview />
                            </ProtectedRoute>
                        } 
                    />
                    
                    <Route 
                        path="/proyecto/:id" 
                        element={
                            <ProtectedRoute>
                                <Project />
                            </ProtectedRoute>
                        } 
                    />

                      <Route 
                        path="/calendario" 
                        element={
                            <ProtectedRoute>
                                <Calendar />
                            </ProtectedRoute>
                        } 
                    />
                    
                    
                    <Route 
                        path="/nuevo-proyecto" 
                        element={
                            <ProtectedRoute>
                                <NewProject />
                            </ProtectedRoute>
                        } 
                    />
                    
                    <Route 
                        path="/usuarios" 
                        element={
                            <ProtectedRoute>
                                <Users />
                            </ProtectedRoute>
                        } 
                    />
                    
                    <Route 
                        path="/busqueda" 
                        element={
                            <ProtectedRoute>
                                <Search />
                            </ProtectedRoute>
                        } 
                    />

<Route 
                        path="/ajustes" 
                        element={
                            <ProtectedRoute>
                                <Settings />
                            </ProtectedRoute>
                        } 
                    />

                </Routes>
            </AuthProvider>
        </Router>
    );
}




export default App;