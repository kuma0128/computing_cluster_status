<?php
/**
 * Storage abstraction layer
 * Supports JSON files and KyotoCabinet (when available)
 */

interface StorageInterface {
    /**
     * @return array<string, mixed>|null
     */
    public function get(string $key): ?array;

    /**
     * @param array<string, mixed> $data
     */
    public function set(string $key, array $data): bool;

    public function has(string $key): bool;
    public function delete(string $key): bool;

    /**
     * @return array<int, string>
     */
    public function list(): array;
}

/**
 * JSON file-based storage implementation
 */
class JsonStorage implements StorageInterface {
    private string $dataDir;

    public function __construct(string $dataDir = __DIR__ . '/../../data') {
        $this->dataDir = rtrim($dataDir, '/');
        if (!is_dir($this->dataDir)) {
            mkdir($this->dataDir, 0755, true);
        }
    }

    /**
     * @return array<string, mixed>|null
     */
    public function get(string $key): ?array {
        $file = $this->getFilePath($key);
        if (!file_exists($file)) {
            return null;
        }

        $content = file_get_contents($file);
        if ($content === false) {
            return null;
        }

        $data = json_decode($content, true);
        return is_array($data) ? $data : null;
    }

    /**
     * @param array<string, mixed> $data
     */
    public function set(string $key, array $data): bool {
        $file = $this->getFilePath($key);
        $json = json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

        // Atomic write: write to temp file then rename
        $tempFile = $file . '.' . uniqid('tmp', true);
        if (file_put_contents($tempFile, $json, LOCK_EX) === false) {
            return false;
        }

        return rename($tempFile, $file);
    }

    public function has(string $key): bool {
        return file_exists($this->getFilePath($key));
    }

    public function delete(string $key): bool {
        $file = $this->getFilePath($key);
        return file_exists($file) ? unlink($file) : false;
    }

    /**
     * @return array<int, string>
     */
    public function list(): array {
        $files = glob($this->dataDir . '/*.json');
        return array_map(function($file) {
            return basename($file, '.json');
        }, $files !== false ? $files : []);
    }

    private function getFilePath(string $key): string {
        // Sanitize key to prevent directory traversal
        $key = preg_replace('/[^a-zA-Z0-9_-]/', '_', $key);
        return $this->dataDir . '/' . $key . '.json';
    }
}

/**
 * KyotoCabinet storage implementation (optional)
 * @phpstan-ignore-next-line
 */
class KyotoCabinetStorage implements StorageInterface {
    /** @var mixed KyotoCabinet instance */
    private $db;

    public function __construct(string $dbPath = __DIR__ . '/../../data/cluster.kch') {
        if (!extension_loaded('kyotocabinet')) {
            throw new RuntimeException('KyotoCabinet extension not loaded');
        }

        /** @phpstan-ignore-next-line */
        $this->db = new KyotoCabinet();

        // Create directory if needed
        $dir = dirname($dbPath);
        if (!is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        /** @phpstan-ignore-next-line */
        if (!$this->db->open($dbPath, KyotoCabinet::OWRITER | KyotoCabinet::OCREATE)) {
            throw new RuntimeException('Failed to open KyotoCabinet database');
        }
    }

    /**
     * @return array<string, mixed>|null
     */
    public function get(string $key): ?array {
        $value = $this->db->get($key);
        if ($value === false) {
            return null;
        }

        $data = json_decode($value, true);
        return is_array($data) ? $data : null;
    }

    /**
     * @param array<string, mixed> $data
     */
    public function set(string $key, array $data): bool {
        $json = json_encode($data, JSON_UNESCAPED_UNICODE);
        return $this->db->set($key, $json);
    }

    public function has(string $key): bool {
        return $this->db->get($key) !== false;
    }

    public function delete(string $key): bool {
        return $this->db->remove($key);
    }

    /**
     * @return array<int, string>
     */
    public function list(): array {
        $keys = [];
        $this->db->iterate();
        while (($key = $this->db->step()) !== false) {
            $keys[] = $key;
        }
        return $keys;
    }

    public function __destruct() {
        if ($this->db) {
            $this->db->close();
        }
    }
}

/**
 * Storage factory
 */
class StorageFactory {
    /**
     * @param array<string, mixed> $config
     */
    public static function create(string $type = 'json', array $config = []): StorageInterface {
        switch (strtolower($type)) {
            case 'kyotocabinet':
            case 'kc':
                $dbPath = $config['path'] ?? __DIR__ . '/../../data/cluster.kch';
                return new KyotoCabinetStorage($dbPath);

            case 'json':
            default:
                $dataDir = $config['path'] ?? __DIR__ . '/../../data';
                return new JsonStorage($dataDir);
        }
    }

    public static function createFromEnv(): StorageInterface {
        $type = getenv('STORAGE_TYPE');
        $type = ($type !== false) ? $type : 'json';

        $path = getenv('STORAGE_PATH');
        $path = ($path !== false) ? $path : '';

        $config = [];
        if ($path !== '') {
            $config['path'] = $path;
        }

        return self::create($type, $config);
    }
}
