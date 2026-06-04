const { useState } = React;

function App() {
    const [isLogged, setIsLogged] = useState(false);
    const [user, setUser] = useState(null);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        const data = new FormData(e.target);
        
        try {
            const response = await fetch(`${wpData.root}gestion/v1/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(Object.fromEntries(data))
            });

            const result = await response.json();

            if (result.success) {
                setIsLogged(true);
                setUser(result.user);
                setError('');
            } else {
                setError(result.message);
            }
        } catch (err) {
            setError('Error de conexión con el servidor');
        }
    };

    if (isLogged) {
        return (
            <div style={{padding: '50px', textAlign: 'center'}}>
                <h1>Bienvenido, {user} 👋</h1>
                <p>Ya puedes gestionar tus cronogramas.</p>
                <button onClick={() => setIsLogged(false)}>Cerrar Sesión</button>
            </div>
        );
    }

    return (
        <div style={{maxWidth: '400px', margin: '100px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '10px'}}>
            <h2>Login de Gestión</h2>
            <form onSubmit={handleLogin}>
                <input type="text" name="username" placeholder="Usuario" style={{width: '100%', marginBottom: '10px', padding: '8px'}} required />
                <input type="password" name="password" placeholder="Contraseña" style={{width: '100%', marginBottom: '10px', padding: '8px'}} required />
                <button type="submit" style={{width: '100%', padding: '10px', background: '#2271b1', color: 'white', border: 'none'}}>Entrar</button>
            </form>
            {error && <p style={{color: 'red', marginTop: '10px'}}>{error}</p>}
        </div>
    );
}


// 1. Referencias globales para que Babel no se pierda
const ReactDOM = window.ReactDOM;

// 2. El disparador que monta la App en tu <div id="root-react-app">
const rootElement = document.getElementById('root-react-app');
if (rootElement) {
    const root = ReactDOM.createRoot(rootElement);
    root.render(<App />);
}
