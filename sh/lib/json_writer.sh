#!/bin/bash
# JSON writer library with atomic write support
set -Eeuo pipefail

# Write JSON data atomically
# Usage: write_json_atomic <output_file> <json_data>
write_json_atomic() {
    local output_file="$1"
    local json_data="$2"

    # Validate JSON
    if ! echo "$json_data" | jq empty 2>/dev/null; then
        echo "ERROR: Invalid JSON data" >&2
        return 1
    fi

    # Create directory if it doesn't exist
    local dir
    dir="$(dirname "$output_file")"
    mkdir -p "$dir"

    # Write to temporary file
    local temp_file="${output_file}.tmp.$$"
    trap 'rm -f "$temp_file"' EXIT INT TERM

    # Pretty print and write atomically
    echo "$json_data" | jq '.' > "$temp_file"

    # Atomic rename
    mv -f "$temp_file" "$output_file"

    trap - EXIT INT TERM
    return 0
}

# Create JSON object from key-value pairs
# Usage: create_json "key1" "value1" "key2" "value2" ...
create_json() {
    local json="{"
    local first=true

    while [[ $# -gt 1 ]]; do
        local key="$1"
        local value="$2"
        shift 2

        if [[ "$first" = true ]]; then
            first=false
        else
            json+=","
        fi

        # Escape value for JSON
        value="${value//\\/\\\\}"
        value="${value//\"/\\\"}"
        value="${value//$'\n'/\\n}"

        json+="\"$key\":\"$value\""
    done

    json+="}"
    echo "$json"
}

# Create JSON array from values
# Usage: create_json_array "value1" "value2" "value3"
create_json_array() {
    local json="["
    local first=true

    for value in "$@"; do
        if [[ "$first" = true ]]; then
            first=false
        else
            json+=","
        fi

        # Escape value for JSON
        value="${value//\\/\\\\}"
        value="${value//\"/\\\"}"
        value="${value//$'\n'/\\n}"

        json+="\"$value\""
    done

    json+="]"
    echo "$json"
}

# Add timestamp to JSON object
# Usage: add_timestamp <json_data>
add_timestamp() {
    local json="$1"
    local timestamp
    timestamp="$(date -u +%Y-%m-%dT%H:%M:%SZ)"

    echo "$json" | jq --arg ts "$timestamp" '. + {timestamp: $ts}'
}

# Merge JSON objects
# Usage: merge_json <json1> <json2>
merge_json() {
    local json1="$1"
    local json2="$2"

    echo "$json1" | jq --argjson j2 "$json2" '. + $j2'
}
