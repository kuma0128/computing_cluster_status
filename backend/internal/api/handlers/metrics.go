package handlers

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/taisei-ito/cluster-status-monitor/internal/models"
	"github.com/taisei-ito/cluster-status-monitor/internal/storage"
)

// MetricsHandler handles metrics API requests
type MetricsHandler struct {
	storage storage.Storage
}

// NewMetricsHandler creates a new metrics handler
func NewMetricsHandler(storage storage.Storage) *MetricsHandler {
	return &MetricsHandler{storage: storage}
}

// GetMetrics handles GET /api/metrics
func (h *MetricsHandler) GetMetrics(w http.ResponseWriter, r *http.Request) {
	metricType := r.URL.Query().Get("type")
	if metricType == "" {
		metricType = "current"
	}

	var response interface{}
	var err error

	switch metricType {
	case "current":
		response, err = h.getCurrentMetrics()
	case "load":
		response, err = h.getMetricsByKey("load_average")
	case "pbs":
		response, err = h.getMetricsByKey("pbs_usage")
	case "cpu":
		response, err = h.getMetricsByKey("cpu_usage")
	case "nodes":
		response, err = h.getNodeStatus()
	case "all":
		response, err = h.getAllMetrics()
	default:
		respondJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Invalid metric type",
		})
		return
	}

	if err != nil {
		respondJSON(w, http.StatusInternalServerError, map[string]string{
			"error":   "Internal server error",
			"message": err.Error(),
		})
		return
	}

	respondJSON(w, http.StatusOK, response)
}

// getCurrentMetrics returns current metrics
func (h *MetricsHandler) getCurrentMetrics() (*models.CurrentMetrics, error) {
	metadata, _ := h.storage.Get("metadata")
	timestamp := time.Now().Unix()
	if metadata != nil {
		if ts, ok := metadata["timestamp"].(float64); ok {
			timestamp = int64(ts)
		}
	}

	loadAvg, _ := h.parseMetrics("load_average")
	pbsUsage, _ := h.parseMetrics("pbs_usage")
	cpuUsage, _ := h.parseMetrics("cpu_usage")

	hasData := len(loadAvg) > 0

	return &models.CurrentMetrics{
		LoadAverage: loadAvg,
		PBSUsage:    pbsUsage,
		CPUUsage:    cpuUsage,
		Timestamp:   timestamp,
		HasData:     hasData,
	}, nil
}

// getMetricsByKey returns metrics for a specific key
func (h *MetricsHandler) getMetricsByKey(key string) (interface{}, error) {
	data, err := h.storage.Get(key)
	if err != nil || len(data) == 0 {
		return map[string]interface{}{
			"error":      "Data not found",
			"message":    "No data available for key: " + key,
			"dummy_data": h.generateDummyData(key),
		}, nil
	}

	return data, nil
}

// getNodeStatus returns node status information
func (h *MetricsHandler) getNodeStatus() (*models.NodeStatus, error) {
	aliveData, _ := h.storage.Get("nodes_alive")
	downData, _ := h.storage.Get("nodes_down")

	alive := extractStringArray(aliveData)
	down := extractStringArray(downData)

	hasData := len(alive) > 0 || len(down) > 0

	message := "OK"
	if !hasData {
		message = "データが取得できていません。ダミー値を表示しています。"
		alive = []string{"node1 (dummy)", "node2 (dummy)", "node3 (dummy)"}
		down = []string{"node4 (dummy)"}
	}

	return &models.NodeStatus{
		Alive:   alive,
		Down:    down,
		Total:   len(alive) + len(down),
		HasData: hasData,
		Message: message,
	}, nil
}

// getAllMetrics returns all available metrics
func (h *MetricsHandler) getAllMetrics() (map[string]interface{}, error) {
	keys, err := h.storage.List()
	if err != nil {
		return nil, err
	}

	result := make(map[string]interface{})
	for _, key := range keys {
		if data, err := h.storage.Get(key); err == nil {
			result[key] = data
		}
	}

	return result, nil
}

// parseMetrics converts storage data to ClusterMetric array
func (h *MetricsHandler) parseMetrics(key string) ([]models.ClusterMetric, error) {
	data, err := h.storage.Get(key)
	if err != nil {
		return []models.ClusterMetric{}, nil
	}

	// Try to parse as array
	if arr, ok := data["data"].([]interface{}); ok {
		metrics := make([]models.ClusterMetric, 0, len(arr))
		for _, item := range arr {
			if m, ok := item.(map[string]interface{}); ok {
				metric := models.ClusterMetric{
					Cluster: getStringValue(m, "cluster"),
					Value:   getFloatValue(m, "value"),
				}
				if ts, ok := m["timestamp"].(string); ok {
					if t, err := time.Parse(time.RFC3339, ts); err == nil {
						metric.Timestamp = t
					}
				}
				if isDummy, ok := m["is_dummy"].(bool); ok {
					metric.IsDummy = isDummy
				}
				metrics = append(metrics, metric)
			}
		}
		return metrics, nil
	}

	return []models.ClusterMetric{}, nil
}

// generateDummyData creates dummy data for testing
func (h *MetricsHandler) generateDummyData(key string) []map[string]interface{} {
	clusters := []string{"cluster1", "cluster2", "cluster3"}
	result := make([]map[string]interface{}, 0, len(clusters))

	for _, cluster := range clusters {
		var value interface{}
		switch key {
		case "load_average":
			value = 50.0 + float64(len(cluster)*10)
		case "pbs_usage":
			value = 30.0 + float64(len(cluster)*5)
		case "cpu_usage":
			value = "32/64"
		default:
			value = 0
		}

		result = append(result, map[string]interface{}{
			"cluster":   cluster,
			"value":     value,
			"timestamp": time.Now().Format(time.RFC3339),
			"is_dummy":  true,
		})
	}

	return result
}

// Helper functions

func respondJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(data)
}

func extractStringArray(data map[string]interface{}) []string {
	if data == nil {
		return []string{}
	}

	if arr, ok := data["data"].([]interface{}); ok {
		result := make([]string, 0, len(arr))
		for _, item := range arr {
			if s, ok := item.(string); ok {
				result = append(result, s)
			}
		}
		return result
	}

	return []string{}
}

func getStringValue(m map[string]interface{}, key string) string {
	if v, ok := m[key].(string); ok {
		return v
	}
	return ""
}

func getFloatValue(m map[string]interface{}, key string) float64 {
	if v, ok := m[key].(float64); ok {
		return v
	}
	if v, ok := m[key].(int); ok {
		return float64(v)
	}
	return 0
}
