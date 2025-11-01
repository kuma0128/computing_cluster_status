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
    $metadata = $storage->get('metadata');
    $timestamp = ($metadata && isset($metadata['timestamp'])) ? $metadata['timestamp'] : time();

    return [
        'load_average' => $storage->get('load_average') ?? [],
        'pbs_usage' => $storage->get('pbs_usage') ?? [],
        'cpu_usage' => $storage->get('cpu_usage') ?? [],
        'timestamp' => $timestamp,
        'has_data' => !empty($storage->get('load_average'))
    ];
}

function getMetricsByKey(StorageInterface $storage, string $key): array {
    $data = $storage->get($key);
    if ($data === null || empty($data)) {
        return [
            'error' => 'Data not found',
            'message' => "No data available for key: {$key}",
            'dummy_data' => generateDummyData($key)
        ];
    }
    return $data;
}

function generateDummyData(string $key): array {
    // Generate dummy data when real data is not available
    $dummyClusters = ['cluster1', 'cluster2', 'cluster3'];
    $result = [];

    foreach ($dummyClusters as $cluster) {
        $result[] = [
            'cluster' => $cluster,
            'value' => match($key) {
                'load_average' => round(rand(0, 10000) / 100, 2),
                'pbs_usage' => round(rand(0, 10000) / 100, 2),
                'cpu_usage' => rand(0, 64) . '/' . 64,
                default => 0
            },
            'timestamp' => date('c'),
            'is_dummy' => true
        ];
    }

    return $result;
}

function getNodeStatus(StorageInterface $storage): array {
    $alive = $storage->get('nodes_alive') ?? [];
    $down = $storage->get('nodes_down') ?? [];

    $hasData = !empty($alive) || !empty($down);

    if (!$hasData) {
        // Return dummy data with warning
        $alive = ['node1 (dummy)', 'node2 (dummy)', 'node3 (dummy)'];
        $down = ['node4 (dummy)'];
    }

    return [
        'alive' => $alive,
        'down' => $down,
        'total' => count($alive) + count($down),
        'has_data' => $hasData,
        'message' => $hasData ? 'OK' : 'データが取得できていません。ダミー値を表示しています。'
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
