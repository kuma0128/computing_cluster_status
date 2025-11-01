package config

import (
	"fmt"
	"os"

	"github.com/joho/godotenv"
	"github.com/taisei-ito/cluster-status-monitor/internal/storage"
)

// Config holds application configuration
type Config struct {
	ServerPort string
	Storage    storage.Config
}

// Load loads configuration from environment variables
func Load() (*Config, error) {
	// Load .env file if exists
	_ = godotenv.Load()

	config := &Config{
		ServerPort: getEnv("PORT", "8080"),
		Storage: storage.Config{
			Type:     getEnv("STORAGE_TYPE", "json"),
			JSONPath: getEnv("STORAGE_PATH", "./data"),
		},
	}

	// MySQL configuration if storage type is MySQL
	if config.Storage.Type == "mysql" {
		config.Storage.MySQL = &storage.MySQLConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "3306"),
			Database: getEnv("DB_NAME", "cluster_status"),
			User:     getEnv("DB_USER", "cluster_user"),
			Password: getEnv("DB_PASSWORD", "cluster_pass"),
		}
	}

	return config, nil
}

// Validate validates the configuration
func (c *Config) Validate() error {
	if c.ServerPort == "" {
		return fmt.Errorf("server port is required")
	}

	if c.Storage.Type == "mysql" && c.Storage.MySQL == nil {
		return fmt.Errorf("MySQL configuration is required when storage type is mysql")
	}

	return nil
}

// getEnv gets an environment variable or returns a default value
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}
