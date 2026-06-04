// Usamos type="text/babel" si no tienes un bundler, pero aquí lo haremos directo
const { useState, useEffect } = React;

function AppProyectos() {
    const [proyectos, setProyectos] = useState([]);

    useEffect(() => {
        // Llamada a la REST API de WordPress
        fetch(`${wpData.root}wp/v2/posts`) 
            .then(response => response.json())
            .then(data => {
                setProyectos(data);
            });
    }, []);

    return (
        <div style={{padding: '20px', fontFamily: 'sans-serif'}}>
            <h1>Mis Proyectos</h1>
            <div className="lista-proyectos">
                {proyectos.map(p => (
                    <div key={p.id} style={{border: '1px solid #ccc', margin: '10px', padding: '10px'}}>
                        <h2 dangerouslySetInnerHTML={{__html: p.title.rendered}} />
                        <div dangerouslySetInnerHTML={{__html: p.excerpt.rendered}} />
                        <button onClick={() => alert('Abrir cronograma')}>Ver Cronograma</button>
                    </div>
                ))}
            </div>
        </div>
    );
}

const root = ReactDOM.createRoot(document.getElementById('root-react-app'));
root.render(<AppProyectos />);
