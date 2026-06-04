<?php
function conectar_mi_codigo_react() {
    $ruta_node = get_template_directory_uri() . '/node_modules/';

    wp_enqueue_script('react', $ruta_node . 'react/umd/react.development.js', array(), '18.2.0', true);
    wp_enqueue_script('react-dom', $ruta_node . 'react-dom/umd/react-dom.development.js', array('react'), '18.2.0', true);
    wp_enqueue_script('babel', $ruta_node . '@babel/standalone/babel.min.js', array(), '7.23.10', false);

    wp_enqueue_script('mi-logica-react', get_template_directory_uri() . '/js/app-react.js', array('react', 'react-dom', 'babel'), '2.0', true);
}
add_action('wp_enqueue_scripts', 'conectar_mi_codigo_react');

add_filter('script_loader_tag', function($tag, $handle, $src) {
    if ( 'mi-logica-react' !== $handle ) return $tag;
    return '<script type="text/babel" src="' . $src . '"></script>' . "\n";
}, 10, 3);


add_action('rest_api_init', function () {
    register_rest_route('gestion/v1', '/login', array(
        'methods' => 'POST',
        'callback' => 'login_usuario_react',
        'permission_callback' => '__return_true'
    ));
});

function login_usuario_react($request) {
    $creds = array(
        'user_login'    => $request['username'],
        'user_password' => $request['password'],
        'remember'      => true
    );

    $user = wp_signon($creds, false);

    if (is_wp_error($user)) {
        return new WP_Error('login_fallido', 'Usuario o contraseña incorrectos', array('status' => 403));
    }

    return array(
        'success' => true,
        'user' => $user->display_name,
        'role' => $user->roles[0]
    );


    
}

/**
 * Filtrar rutas de OpenAPI para mostrar solo las que contienen /psm/
 */
add_filter( 'wp-openapi-filter-paths', function( $paths, $args ) {
    $filtered_paths = [];
    
    foreach ( $paths as $route => $path_object ) {
        if ( strpos( $route, '/psm/' ) !== false ) {
            $filtered_paths[ $route ] = $path_object;
        }
    }
    
    return $filtered_paths;
}, 10, 2 );


/**
 * Redirigir la página de inicio al frontend React
 */
function psm_redirect_home_to_react() {
    if ( is_front_page() || is_home() ) {
        $react_url = 'http://localhost:5173/'; 
        wp_redirect( $react_url );
        exit;
    }
}
add_action( 'template_redirect', 'psm_redirect_home_to_react' );