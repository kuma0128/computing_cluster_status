package models

import "time"

// ClusterMetric represents a cluster metric data point
type ClusterMetric struct {
	Cluster   string    `json:"cluster"`
	Value     float64   `json:"value"`
	Timestamp time.Time `json:"timestamp"`
	IsDummy   bool      `json:"is_dummy,omitempty"`
}

// NodeStatus represents the status of cluster nodes
type NodeStatus struct {
	Alive   []string `json:"alive"`
	Down    []string `json:"down"`
	Total   int      `json:"total"`
	HasData bool     `json:"has_data"`
	Message string   `json:"message,omitempty"`
}

// CurrentMetrics represents all current metrics
type CurrentMetrics struct {
	LoadAverage []ClusterMetric `json:"load_average"`
	PBSUsage    []ClusterMetric `json:"pbs_usage"`
	CPUUsage    []ClusterMetric `json:"cpu_usage"`
	Timestamp   int64           `json:"timestamp"`
	HasData     bool            `json:"has_data"`
}

// ClusterData represents general cluster data structure
type ClusterData struct {
	Cluster string                 `json:"cluster"`
	Data    map[string]interface{} `json:"data"`
}
