
use local;

-- Tabla de usuarios del proyecto (responsables)
CREATE TABLE wp_psm_project_users (
    project_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'member',
    assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, user_id),
    FOREIGN KEY (project_id) REFERENCES wp_psm_projects(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES wp_users(ID) ON DELETE CASCADE,
    INDEX idx_project (project_id),
    INDEX idx_user (user_id)
);

-- Tabla de actividades
CREATE TABLE wp_psm_activities (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT UNSIGNED NOT NULL,
    name NVARCHAR(255) NOT NULL,
    description TEXT,
    priority  NVARCHAR(255) NOT NULL,
    state NVARCHAR(255) NOT NULL,
    start_date DATE,
    end_date DATE,
    assigned_to BIGINT UNSIGNED,
    created_by BIGINT UNSIGNED NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES wp_psm_projects(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_to) REFERENCES wp_users(ID) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES wp_users(ID),
    INDEX idx_project (project_id),
    INDEX idx_assigned (assigned_to),
    INDEX idx_dates (start_date, end_date)
);

-- Tabla de documentos (archivos)
-- Tabla de documentos (simplificada, un archivo por actividad)
CREATE TABLE wp_psm_documents (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    activity_id BIGINT UNSIGNED NOT NULL UNIQUE,  -- UNIQUE asegura un documento por actividad
    name VARCHAR(255) NOT NULL,
    file_content LONGBLOB NOT NULL,  -- Contenido binario del archivo
    file_size INT UNSIGNED NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    uploaded_by BIGINT UNSIGNED NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (activity_id) REFERENCES wp_psm_activities(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES wp_users(ID),
    INDEX idx_activity (activity_id),
    INDEX idx_uploaded_by (uploaded_by)
);


--

