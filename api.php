<?php
header("Content-Type: application/json");

// بيانات الاتصال بالداتابيز (غيّرها حسب إعدادات Supabase/Postgres بتاعتك)
$host = "db.your-supabase-host.supabase.co";
$db   = "postgres";
$user = "postgres";
$pass = "your_password";
$port = "5432";

// الاتصال
$conn = pg_connect("host=$host dbname=$db user=$user password=$pass port=$port");

if (!$conn) {
    echo json_encode(["error" => "Database connection failed"]);
    exit;
}

// اختيار نوع الداتا
$type = $_GET['type'] ?? '';

if ($type === 'top-viewers') {
    $result = pg_query($conn, "SELECT * FROM top_viewers LIMIT 5;");
    echo json_encode(pg_fetch_all($result));
} elseif ($type === 'recent-activity') {
    $result = pg_query($conn, "SELECT * FROM recent_activity LIMIT 20;");
    echo json_encode(pg_fetch_all($result));
} elseif ($type === 'stats') {
    $result = pg_query($conn, "SELECT COUNT(*) AS total FROM audit_log;");
    echo json_encode(pg_fetch_assoc($result));
} else {
    echo json_encode(["error" => "Invalid request"]);
}
