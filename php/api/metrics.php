<?php
/**
 * API endpoint for cluster metrics
 * Returns metrics data from storage layer
 */

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

require_once __DIR__ . '/../lib/Storage.php';

try {
    $storage = StorageFactory::createFromEnv();

    // Get metric type from query parameter
    $type = $_GET['type'] ?? 'current';

    $response = match($type) {
        'current' => getCurrentMetrics($storage),
        'load' => getMetricsByKey($storage, 'load_average'),
        'pbs' => getMetricsByKey($storage, 'pbs_usage'),
        'cpu' => getMetricsByKey($storage, 'cpu_usage'),
        'nodes' => getNodeStatus($storage),
        'all' => getAllMetrics($storage),
        default => ['error' => 'Invalid metric type']
    };

    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Internal server error',
        'message' => $e->getMessage()
    ]);
}

function getCurrentMetrics(StorageInterface $storage): array {
    return [
        'load_average' => $storage->get('load_average') ?? [],
        'pbs_usage' => $storage->get('pbs_usage') ?? [],
        'cpu_usage' => $storage->get('cpu_usage') ?? [],
        'timestamp' => $storage->get('metadata')?['timestamp'] ?? time()
    ];
}

function getMetricsByKey(StorageInterface $storage, string $key): array {
    $data = $storage->get($key);
    return $data ?? ['error' => 'Data not found'];
}

function getNodeStatus(StorageInterface $storage): array {
    $alive = $storage->get('nodes_alive') ?? [];
    $down = $storage->get('nodes_down') ?? [];

    return [
        'alive' => $alive,
        'down' => $down,
        'total' => count($alive) + count($down)
    ];
}

function getAllMetrics(StorageInterface $storage): array {
    $keys = $storage->list();
    $data = [];

    foreach ($keys as $key) {
        $data[$key] = $storage->get($key);
    }

    return $data;
}
