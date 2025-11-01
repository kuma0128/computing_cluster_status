package storage

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sync"
)

// JSONStorage implements file-based JSON storage
type JSONStorage struct {
	dataDir string
	mu      sync.RWMutex
}

// NewJSONStorage creates a new JSON storage instance
func NewJSONStorage(dataDir string) (*JSONStorage, error) {
	// Create directory if it doesn't exist
	if err := os.MkdirAll(dataDir, 0755); err != nil {
		return nil, fmt.Errorf("failed to create data directory: %w", err)
	}

	return &JSONStorage{
		dataDir: dataDir,
	}, nil
}

// Get retrieves data for a given key
func (s *JSONStorage) Get(key string) (map[string]interface{}, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	filePath := s.getFilePath(key)

	// Check if file exists
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return nil, ErrNotFound
	}

	// Read file
	data, err := os.ReadFile(filePath)
	if err != nil {
		return nil, fmt.Errorf("failed to read file: %w", err)
	}

	// Parse JSON
	var result map[string]interface{}
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, fmt.Errorf("failed to parse JSON: %w", err)
	}

	return result, nil
}

// Set stores data for a given key
func (s *JSONStorage) Set(key string, data map[string]interface{}) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	filePath := s.getFilePath(key)

	// Marshal to JSON with pretty printing
	jsonData, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal JSON: %w", err)
	}

	// Atomic write: write to temp file then rename
	tempFile := filePath + ".tmp"
	if err := os.WriteFile(tempFile, jsonData, 0644); err != nil {
		return fmt.Errorf("failed to write temp file: %w", err)
	}

	if err := os.Rename(tempFile, filePath); err != nil {
		os.Remove(tempFile) // Cleanup temp file
		return fmt.Errorf("failed to rename file: %w", err)
	}

	return nil
}

// Has checks if a key exists
func (s *JSONStorage) Has(key string) bool {
	s.mu.RLock()
	defer s.mu.RUnlock()

	filePath := s.getFilePath(key)
	_, err := os.Stat(filePath)
	return err == nil
}

// Delete removes data for a given key
func (s *JSONStorage) Delete(key string) error {
	s.mu.Lock()
	defer s.mu.Unlock()

	filePath := s.getFilePath(key)

	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return ErrNotFound
	}

	if err := os.Remove(filePath); err != nil {
		return fmt.Errorf("failed to delete file: %w", err)
	}

	return nil
}

// List returns all available keys
func (s *JSONStorage) List() ([]string, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	pattern := filepath.Join(s.dataDir, "*.json")
	files, err := filepath.Glob(pattern)
	if err != nil {
		return nil, fmt.Errorf("failed to list files: %w", err)
	}

	keys := make([]string, 0, len(files))
	for _, file := range files {
		base := filepath.Base(file)
		key := base[:len(base)-5] // Remove .json extension
		keys = append(keys, key)
	}

	return keys, nil
}

// Close cleans up resources (no-op for JSON storage)
func (s *JSONStorage) Close() error {
	return nil
}

// getFilePath returns the file path for a given key
func (s *JSONStorage) getFilePath(key string) string {
	// Sanitize key to prevent directory traversal
	safeKey := sanitizeKey(key)
	return filepath.Join(s.dataDir, safeKey+".json")
}

// sanitizeKey removes potentially dangerous characters from keys
func sanitizeKey(key string) string {
	// Replace any character that's not alphanumeric, underscore, or hyphen
	reg := regexp.MustCompile(`[^a-zA-Z0-9_-]`)
	return reg.ReplaceAllString(key, "_")
}
