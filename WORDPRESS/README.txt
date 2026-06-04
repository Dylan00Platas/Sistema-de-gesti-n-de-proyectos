# Backend - Sistema de Gestión de Proyectos (WordPress Headless)

## Requisitos Previos
- WordPress 6.0+
- PHP 8.0+
- MySQL 8.0 / MariaDB 10.6
- Plugin JWT Authentication for WP REST API

## Instalación

### 1. Instalar WordPress
Configurar WordPress en el servidor local o remoto.

### 2.Añadir los plugins en el servidor
Se encuentran en WORDPRESS\app\public\wp-content\plugins 
El plugin con la funcionalidad principal es psm-backend 
El resto son plugins para manejar documentación API, jwt o cors
Activarlos

### 3. Seleccionar el tema gestionProyectos
WORDPRESS\app\public\wp-content\themes

### 4. Correr el script de la base de datos y conectarla
Los ajustes para conectarse a la BD vienen en wp-config.php (WORDPRESS\app\public)
asegurarse de tener define('JWT_AUTH_CORS_ENABLE', true); en wp-config.php
NOTA: No quitar el prefijo wp_ a ninguna tabla. 


