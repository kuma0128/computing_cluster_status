<?php
/**
 * Cluster API Endpoint
 * Provides cluster-specific information
 *
 * @api
 */

declare(strict_types=1);

header('Content-Type: application/json; charset=UTF-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');

require_once __DIR__ . '/../lib/Storage.php';

try {
    $storage = StorageFactory::createFromEnv();

    // Get cluster name from query parameter
    $clusterName = $_GET['name'] ?? null;
    $type = $_GET['type'] ?? 'overview';

    if (!$clusterName) {
        http_response_code(400);
        echo json_encode([
            'error' => 'Bad Request',
            'message' => 'Cluster name is required'
        ]);
        exit;
    }

    // Sanitize cluster name
    $clusterName = preg_replace('/[^a-zA-Z0-9_-]/', '', $clusterName);

    $response = match($type) {
        'overview' => getClusterOverview($storage, $clusterName),
        'users' => getClusterUsers($storage, $clusterName),
        'disk' => getClusterDisk($storage, $clusterName),
        'history' => getClusterHistory($storage, $clusterName),
        default => ['error' => 'Invalid type parameter']
    };

    // Add metadata
    $response['meta'] = [
        'timestamp' => date('c'),
        'cluster' => $clusterName,
        'type' => $type
    ];

    // Add HATEOAS links
    $response['links'] = [
        'self' => "/api/cluster.php?name={$clusterName}&type={$type}",
        'overview' => "/api/cluster.php?name={$clusterName}&type=overview",
        'users' => "/api/cluster.php?name={$clusterName}&type=users",
        'disk' => "/api/cluster.php?name={$clusterName}&type=disk",
        'history' => "/api/cluster.php?name={$clusterName}&type=history"
    ];

    echo json_encode($response, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'error' => 'Internal server error',
        'message' => $e->getMessage()
    ]);
}

/**
 * Get cluster overview
 *
 * @param StorageInterface $storage
 * @param string $clusterName
 * @return array<string, mixed>
 */
function getClusterOverview(StorageInterface $storage, string $clusterName): array
{
    $loadData = $storage->get('load_average') ?? [];
    $pbsData = $storage->get('pbs_usage') ?? [];
    $cpuData = $storage->get('cpu_usage') ?? [];

    $clusterLoad = array_values(array_filter($loadData, fn($item) => $item['cluster'] === $clusterName));
    $clusterPbs = array_values(array_filter($pbsData, fn($item) => $item['cluster'] === $clusterName));
    $clusterCpu = array_values(array_filter($cpuData, fn($item) => $item['cluster'] === $clusterName));

    $hasData = (count($clusterLoad) > 0) || (count($clusterPbs) > 0) || (count($clusterCpu) > 0);

    return [
        'name' => $clusterName,
        'load_average' => (count($clusterLoad) > 0) ? $clusterLoad[0]['value'] : 0,
        'pbs_usage' => (count($clusterPbs) > 0) ? $clusterPbs[0]['value'] : 0,
        'cpu_usage' => (count($clusterCpu) > 0) ? $clusterCpu[0]['value'] : '0/0',
        'has_data' => $hasData,
        'message' => $hasData ? 'OK' : 'データが取得できていません'
    ];
}

/**
 * Get cluster user breakdown
 *
 * @param StorageInterface $storage
 * @param string $clusterName
 * @return array<string, mixed>
 */
function getClusterUsers(StorageInterface $storage, string $clusterName): array
{
    $userData = $storage->get("users_{$clusterName}");

    if ($userData === null || count($userData) === 0) {
        // Generate dummy data for demonstration
        $userData = generateDummyUserData($clusterName);
        $hasData = false;
    } else {
        $hasData = true;
    }

    return [
        'users' => $userData,
        'has_data' => $hasData,
        'message' => $hasData ? 'OK' : 'ダミーデータを表示しています'
    ];
}

/**
 * Get cluster disk usage
 *
 * @param StorageInterface $storage
 * @param string $clusterName
 * @return array<string, mixed>
 */
function getClusterDisk(StorageInterface $storage, string $clusterName): array
{
    $diskData = $storage->get("disk_{$clusterName}");

    if ($diskData === null || count($diskData) === 0) {
        // Generate dummy data for demonstration
        $diskData = generateDummyDiskData($clusterName);
        $hasData = false;
    } else {
        $hasData = true;
    }

    return [
        'nodes' => $diskData,
        'has_data' => $hasData,
        'message' => $hasData ? 'OK' : 'ダミーデータを表示しています'
    ];
}

/**
 * Get cluster history
 *
 * @param StorageInterface $storage
 * @param string $clusterName
 * @return array<string, mixed>
 */
function getClusterHistory(StorageInterface $storage, string $clusterName): array
{
    $days = isset($_GET['days']) ? (int)$_GET['days'] : 7;
    $days = max(1, min($days, 90)); // Limit between 1 and 90 days

    $historyData = $storage->get("history_{$clusterName}_{$days}d");

    if ($historyData === null || count($historyData) === 0) {
        return [
            'history' => [],
            'days' => $days,
            'has_data' => false,
            'message' => '履歴データが見つかりません'
        ];
    }

    return [
        'history' => $historyData,
        'days' => $days,
        'has_data' => true,
        'message' => 'OK'
    ];
}

/**
 * Generate dummy user data
 *
 * @param string $clusterName
 * @return array<int, array<string, mixed>>
 */
function generateDummyUserData(string $clusterName): array
{
    $users = ['alice', 'bob', 'charlie', 'david', 'eve', 'frank', 'grace', 'henry'];
    $result = [];

    foreach ($users as $user) {
        $result[] = [
            'username' => $user,
            'usage' => round(rand(100, 10000) / 10, 2),
            'jobs' => rand(5, 100),
            'last_job' => date('Y-m-d H:i:s', time() - rand(3600, 86400)),
            'is_dummy' => true
        ];
    }

    return $result;
}

/**
 * Generate dummy disk data
 *
 * @param string $clusterName
 * @return array<int, array<string, mixed>>
 */
function generateDummyDiskData(string $clusterName): array
{
    $result = [];
    $mounts = ['/', '/home', '/scratch', '/data'];

    for ($i = 1; $i <= 8; $i++) {
        $disks = [];
        foreach ($mounts as $mount) {
            $total = rand(500, 2000) * 1024 * 1024 * 1024; // GB in bytes
            $used = rand(100, (int)($total * 0.9));

            $disks[] = [
                'mount' => $mount,
                'total' => $total,
                'used' => $used,
                'available' => $total - $used,
                'usage_percent' => round(($used / $total) * 100, 1)
            ];
        }

        $result[] = [
            'name' => "{$clusterName}" . str_pad((string)$i, 2, '0', STR_PAD_LEFT),
            'disks' => $disks,
            'is_dummy' => true
        ];
    }

    return $result;
}
