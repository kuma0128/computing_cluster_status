package storage

import (
	"encoding/json"
	"errors"
)

var (
	ErrNotFound    = errors.New("key not found")
	ErrInvalidData = errors.New("invalid data format")
)

// Storage defines the interface for data storage
type Storage interface {
	Get(key string) (map[string]interface{}, error)
	Set(key string, data map[string]interface{}) error
	Has(key string) bool
	Delete(key string) error
	List() ([]string, error)
	Close() error
}

// Config holds storage configuration
type Config struct {
	Type     string            // "json" or "mysql"
	JSONPath string            // Path for JSON storage
	MySQL    *MySQLConfig      // MySQL configuration
	Options  map[string]string // Additional options
}

// MySQLConfig holds MySQL-specific configuration
type MySQLConfig struct {
	Host     string
	Port     string
	Database string
	User     string
	Password string
}

// Factory creates a storage instance based on configuration
func Factory(config Config) (Storage, error) {
	switch config.Type {
	case "mysql":
		if config.MySQL == nil {
			return nil, errors.New("MySQL configuration required")
		}
		return NewMySQLStorage(*config.MySQL)
	case "json":
		fallthrough
	default:
		path := config.JSONPath
		if path == "" {
			path = "./data"
		}
		return NewJSONStorage(path)
	}
}

// Helper function to convert map to struct
func UnmarshalData(data map[string]interface{}, v interface{}) error {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}
	return json.Unmarshal(jsonData, v)
}
