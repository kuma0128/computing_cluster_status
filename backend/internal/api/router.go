package api

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/taisei-ito/cluster-status-monitor/internal/api/handlers"
	"github.com/taisei-ito/cluster-status-monitor/internal/storage"
)

// NewRouter creates and configures the API router
func NewRouter(storage storage.Storage) *chi.Mux {
	r := chi.NewRouter()

	// Middleware
	r.Use(middleware.RequestID)
	r.Use(middleware.RealIP)
	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)
	r.Use(middleware.Timeout(60 * time.Second))

	// CORS configuration
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-CSRF-Token"},
		ExposedHeaders:   []string{"Link"},
		AllowCredentials: false,
		MaxAge:           300,
	}))

	// Health check
	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status":"ok"}`))
	})

	// API routes
	r.Route("/api", func(r chi.Router) {
		// Metrics endpoints
		metricsHandler := handlers.NewMetricsHandler(storage)
		r.Get("/metrics", metricsHandler.GetMetrics)
		r.Get("/metrics.php", metricsHandler.GetMetrics) // PHP compatibility

		// Cluster endpoints
		clusterHandler := handlers.NewClusterHandler(storage)
		r.Get("/cluster", clusterHandler.GetClusterInfo)
		r.Get("/cluster.php", clusterHandler.GetClusterInfo) // PHP compatibility
	})

	return r
}
