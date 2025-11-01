package handlers

import (
	"net/http"

	"github.com/taisei-ito/cluster-status-monitor/internal/storage"
)

// ClusterHandler handles cluster API requests
type ClusterHandler struct {
	storage storage.Storage
}

// NewClusterHandler creates a new cluster handler
func NewClusterHandler(storage storage.Storage) *ClusterHandler {
	return &ClusterHandler{storage: storage}
}

// GetClusterInfo handles GET /api/cluster
func (h *ClusterHandler) GetClusterInfo(w http.ResponseWriter, r *http.Request) {
	clusterName := r.URL.Query().Get("name")
	dataType := r.URL.Query().Get("type")

	if clusterName == "" {
		respondJSON(w, http.StatusBadRequest, map[string]string{
			"error": "Cluster name is required",
		})
		return
	}

	var response interface{}
	var err error

	switch dataType {
	case "users":
		response, err = h.getClusterUsers(clusterName)
	case "disk":
		response, err = h.getClusterDisk(clusterName)
	case "history":
		response, err = h.getClusterHistory(clusterName)
	default:
		response, err = h.getClusterSummary(clusterName)
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

// getClusterSummary returns summary information for a cluster
func (h *ClusterHandler) getClusterSummary(clusterName string) (map[string]interface{}, error) {
	loadKey := "cluster_" + clusterName + "_load"
	pbsKey := "cluster_" + clusterName + "_pbs"
	cpuKey := "cluster_" + clusterName + "_cpu"

	loadData, _ := h.storage.Get(loadKey)
	pbsData, _ := h.storage.Get(pbsKey)
	cpuData, _ := h.storage.Get(cpuKey)

	hasData := (loadData != nil && len(loadData) > 0) ||
		(pbsData != nil && len(pbsData) > 0) ||
		(cpuData != nil && len(cpuData) > 0)

	result := map[string]interface{}{
		"cluster":      clusterName,
		"load_average": loadData,
		"pbs_usage":    pbsData,
		"cpu_usage":    cpuData,
		"has_data":     hasData,
	}

	if !hasData {
		result["message"] = "データが取得できていません"
	}

	return result, nil
}

// getClusterUsers returns user information for a cluster
func (h *ClusterHandler) getClusterUsers(clusterName string) (map[string]interface{}, error) {
	key := "cluster_" + clusterName + "_users"
	userData, err := h.storage.Get(key)

	if err != nil || len(userData) == 0 {
		return map[string]interface{}{
			"cluster": clusterName,
			"users":   []interface{}{},
			"message": "ユーザーデータが取得できていません",
		}, nil
	}

	return map[string]interface{}{
		"cluster": clusterName,
		"users":   userData,
	}, nil
}

// getClusterDisk returns disk usage information for a cluster
func (h *ClusterHandler) getClusterDisk(clusterName string) (map[string]interface{}, error) {
	key := "cluster_" + clusterName + "_disk"
	diskData, err := h.storage.Get(key)

	if err != nil || len(diskData) == 0 {
		return map[string]interface{}{
			"cluster": clusterName,
			"disk":    map[string]interface{}{},
			"message": "ディスクデータが取得できていません",
		}, nil
	}

	return map[string]interface{}{
		"cluster": clusterName,
		"disk":    diskData,
	}, nil
}

// getClusterHistory returns historical data for a cluster
func (h *ClusterHandler) getClusterHistory(clusterName string) (map[string]interface{}, error) {
	key := "cluster_" + clusterName + "_history"
	historyData, err := h.storage.Get(key)

	if err != nil || len(historyData) == 0 {
		return map[string]interface{}{
			"cluster": clusterName,
			"history": []interface{}{},
			"message": "履歴データが取得できていません",
		}, nil
	}

	return map[string]interface{}{
		"cluster": clusterName,
		"history": historyData,
	}, nil
}
