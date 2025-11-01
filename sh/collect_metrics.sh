#!/bin/bash
# Collect cluster metrics and save to JSON
# This is a modernized, robust version of the original data collection scripts
set -Eeuo pipefail

# Configuration
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly DATA_DIR="${DATA_DIR:-${SCRIPT_DIR}/../data}"
readonly LOG_FILE="${LOG_FILE:-${DATA_DIR}/collector.log}"

# Source JSON writer library
# shellcheck source=lib/json_writer.sh
source "${SCRIPT_DIR}/lib/json_writer.sh"

# Logging function
log() {
    local level="$1"
    shift
    echo "[$(date -u +%Y-%m-%dT%H:%M:%SZ)] [$level] $*" | tee -a "$LOG_FILE"
}

# Error handler
error_handler() {
    local line_no=$1
    log "ERROR" "Script failed at line $line_no"
    exit 1
}

trap 'error_handler ${LINENO}' ERR

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Validate dependencies
validate_dependencies() {
    local missing=()

    for cmd in jq; do
        if ! command_exists "$cmd"; then
            missing+=("$cmd")
        fi
    done

    if [[ ${#missing[@]} -gt 0 ]]; then
        log "ERROR" "Missing required commands: ${missing[*]}"
        exit 1
    fi
}

# Collect mock metrics (replace with actual collection logic)
collect_cluster_metrics() {
    log "INFO" "Collecting cluster metrics"

    # This is a placeholder - replace with actual metric collection
    local clusters=("cluster1" "cluster2" "cluster3")
    local metrics=()

    for cluster in "${clusters[@]}"; do
        local load_avg
        load_avg="$(awk -v seed="$RANDOM" 'BEGIN { srand(seed); printf "%.2f", rand() * 100 }')"

        metrics+=("$(create_json \
            "cluster" "$cluster" \
            "load_average" "$load_avg" \
            "pbs_usage" "$(awk -v seed="$RANDOM" 'BEGIN { srand(seed); printf "%.2f", rand() * 80 }')" \
            "cpu_usage" "$(awk -v seed="$RANDOM" 'BEGIN { srand(seed); printf "%.2f", rand() * 90 }')")")
    done

    # Combine into array
    local json_array="["
    local first=true
    for metric in "${metrics[@]}"; do
        if [[ "$first" = true ]]; then
            first=false
        else
            json_array+=","
        fi
        json_array+="$metric"
    done
    json_array+="]"

    echo "$json_array"
}

# Collect node status (placeholder)
collect_node_status() {
    log "INFO" "Collecting node status"

    local alive
    alive="$(create_json_array "node1" "node2" "node3" "node4")"

    local down
    down="$(create_json_array "node5")"

    # Save alive nodes
    write_json_atomic "${DATA_DIR}/nodes_alive.json" "$alive"

    # Save down nodes
    write_json_atomic "${DATA_DIR}/nodes_down.json" "$down"
}

# Main collection function
collect_all_metrics() {
    log "INFO" "Starting metrics collection"

    # Create data directory
    mkdir -p "$DATA_DIR"

    # Collect cluster metrics
    local cluster_metrics
    cluster_metrics="$(collect_cluster_metrics)"

    # Add timestamp
    cluster_metrics="$(echo "$cluster_metrics" | jq --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        'map(. + {timestamp: $ts})')"

    # Split by metric type for compatibility
    local load_avg
    load_avg="$(echo "$cluster_metrics" | jq '[.[] | {cluster: .cluster, value: .load_average}]')"
    write_json_atomic "${DATA_DIR}/load_average.json" "$load_avg"

    local pbs_usage
    pbs_usage="$(echo "$cluster_metrics" | jq '[.[] | {cluster: .cluster, value: .pbs_usage}]')"
    write_json_atomic "${DATA_DIR}/pbs_usage.json" "$pbs_usage"

    local cpu_usage
    cpu_usage="$(echo "$cluster_metrics" | jq '[.[] | {cluster: .cluster, value: .cpu_usage}]')"
    write_json_atomic "${DATA_DIR}/cpu_usage.json" "$cpu_usage"

    # Collect node status
    collect_node_status

    # Save metadata
    local metadata
    metadata="$(create_json \
        "last_update" "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        "version" "2.0" \
        "collector" "collect_metrics.sh")"
    write_json_atomic "${DATA_DIR}/metadata.json" "$metadata"

    log "INFO" "Metrics collection completed successfully"
}

# Main execution
main() {
    validate_dependencies
    collect_all_metrics
}

# Run if executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
