-- MySQL initialization script for Cluster Status Monitor
-- This is a basic schema for development. Production should use proper migrations.

CREATE DATABASE IF NOT EXISTS cluster_status;
USE cluster_status;

-- Clusters table (example schema)
CREATE TABLE IF NOT EXISTS clusters (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    total_nodes INT DEFAULT 0,
    active_nodes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Metrics table (example schema)
CREATE TABLE IF NOT EXISTS metrics (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cluster_name VARCHAR(100) NOT NULL,
    metric_type ENUM('load_average', 'cpu_usage', 'pbs_usage', 'memory_usage') NOT NULL,
    metric_value DECIMAL(10, 2) NOT NULL,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_cluster_type_time (cluster_name, metric_type, timestamp),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nodes table
CREATE TABLE IF NOT EXISTS nodes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cluster_name VARCHAR(100) NOT NULL,
    node_name VARCHAR(100) NOT NULL,
    status ENUM('online', 'offline', 'maintenance') DEFAULT 'offline',
    cpu_usage DECIMAL(5, 2) DEFAULT 0.00,
    memory_usage DECIMAL(5, 2) DEFAULT 0.00,
    last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_cluster_node (cluster_name, node_name),
    INDEX idx_cluster (cluster_name),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User usage table
CREATE TABLE IF NOT EXISTS user_usage (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cluster_name VARCHAR(100) NOT NULL,
    username VARCHAR(100) NOT NULL,
    cpu_cores INT DEFAULT 0,
    memory_gb DECIMAL(10, 2) DEFAULT 0.00,
    jobs INT DEFAULT 0,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_cluster_user (cluster_name, username),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Disk usage table
CREATE TABLE IF NOT EXISTS disk_usage (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    cluster_name VARCHAR(100) NOT NULL,
    node_name VARCHAR(100) NOT NULL,
    mount_point VARCHAR(255) NOT NULL,
    used_gb DECIMAL(10, 2) DEFAULT 0.00,
    total_gb DECIMAL(10, 2) DEFAULT 0.00,
    usage_percent DECIMAL(5, 2) DEFAULT 0.00,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_cluster_node (cluster_name, node_name),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for development
INSERT INTO clusters (name, description, total_nodes, active_nodes) VALUES
    ('asuka', 'Asuka Cluster', 10, 8),
    ('naruko', 'Naruko Cluster', 12, 10),
    ('yoyogi', 'Yoyogi Cluster', 8, 7)
ON DUPLICATE KEY UPDATE name=name;

-- Sample metrics
INSERT INTO metrics (cluster_name, metric_type, metric_value) VALUES
    ('asuka', 'load_average', 45.23),
    ('asuka', 'cpu_usage', 67.5),
    ('asuka', 'pbs_usage', 78.2),
    ('naruko', 'load_average', 38.91),
    ('naruko', 'cpu_usage', 55.3),
    ('naruko', 'pbs_usage', 62.1);

-- Grant permissions (already handled by MYSQL_USER env var, but keeping for reference)
-- GRANT ALL PRIVILEGES ON cluster_status.* TO 'cluster_user'@'%';
-- FLUSH PRIVILEGES;

SELECT 'MySQL initialization completed successfully!' as status;
