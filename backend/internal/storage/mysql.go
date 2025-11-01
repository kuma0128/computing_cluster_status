package storage

import (
	"database/sql"
	"encoding/json"
	"fmt"

	_ "github.com/go-sql-driver/mysql"
)

// MySQLStorage implements MySQL-based storage
type MySQLStorage struct {
	db *sql.DB
}

// NewMySQLStorage creates a new MySQL storage instance
func NewMySQLStorage(config MySQLConfig) (*MySQLStorage, error) {
	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true",
		config.User,
		config.Password,
		config.Host,
		config.Port,
		config.Database,
	)

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Test connection
	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	// Create table if not exists
	if err := createTable(db); err != nil {
		return nil, fmt.Errorf("failed to create table: %w", err)
	}

	return &MySQLStorage{db: db}, nil
}

// createTable creates the storage table if it doesn't exist
func createTable(db *sql.DB) error {
	query := `
		CREATE TABLE IF NOT EXISTS cluster_storage (
			key_name VARCHAR(255) PRIMARY KEY,
			data JSON NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
	`
	_, err := db.Exec(query)
	return err
}

// Get retrieves data for a given key
func (s *MySQLStorage) Get(key string) (map[string]interface{}, error) {
	var jsonData []byte
	query := "SELECT data FROM cluster_storage WHERE key_name = ?"

	err := s.db.QueryRow(query, key).Scan(&jsonData)
	if err == sql.ErrNoRows {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("failed to query database: %w", err)
	}

	var result map[string]interface{}
	if err := json.Unmarshal(jsonData, &result); err != nil {
		return nil, fmt.Errorf("failed to unmarshal JSON: %w", err)
	}

	return result, nil
}

// Set stores data for a given key
func (s *MySQLStorage) Set(key string, data map[string]interface{}) error {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal JSON: %w", err)
	}

	query := `
		INSERT INTO cluster_storage (key_name, data)
		VALUES (?, ?)
		ON DUPLICATE KEY UPDATE data = VALUES(data)
	`

	_, err = s.db.Exec(query, key, jsonData)
	if err != nil {
		return fmt.Errorf("failed to insert/update data: %w", err)
	}

	return nil
}

// Has checks if a key exists
func (s *MySQLStorage) Has(key string) bool {
	var exists bool
	query := "SELECT EXISTS(SELECT 1 FROM cluster_storage WHERE key_name = ?)"

	err := s.db.QueryRow(query, key).Scan(&exists)
	return err == nil && exists
}

// Delete removes data for a given key
func (s *MySQLStorage) Delete(key string) error {
	result, err := s.db.Exec("DELETE FROM cluster_storage WHERE key_name = ?", key)
	if err != nil {
		return fmt.Errorf("failed to delete data: %w", err)
	}

	rows, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get affected rows: %w", err)
	}

	if rows == 0 {
		return ErrNotFound
	}

	return nil
}

// List returns all available keys
func (s *MySQLStorage) List() ([]string, error) {
	query := "SELECT key_name FROM cluster_storage ORDER BY key_name"

	rows, err := s.db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query keys: %w", err)
	}
	defer rows.Close()

	var keys []string
	for rows.Next() {
		var key string
		if err := rows.Scan(&key); err != nil {
			return nil, fmt.Errorf("failed to scan key: %w", err)
		}
		keys = append(keys, key)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating rows: %w", err)
	}

	return keys, nil
}

// Close closes the database connection
func (s *MySQLStorage) Close() error {
	return s.db.Close()
}
