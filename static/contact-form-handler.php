<?php
/**
 * 钰弘源官网 — 联系我们表单处理
 * 部署位置: /www/wwwroot/www.yhytradehub.com/contact-form-handler.php
 * 
 * 功能: 接收表单 POST 请求 → 发送邮件到 yhy@yhytradehub.com
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://www.yhytradehub.com');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// 处理预检请求
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// 仅接受 POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => '无效请求方式']);
    exit();
}

// 获取 POST 数据（支持 FormData 和 JSON）
$contentType = $_SERVER['CONTENT_TYPE'] ?? '';
if (strpos($contentType, 'application/json') !== false) {
    $input = json_decode(file_get_contents('php://input'), true);
} else {
    $input = $_POST;
}

$name    = trim($input['name'] ?? '');
$email   = trim($input['email'] ?? '');
$phone   = trim($input['phone'] ?? '');
$message = trim($input['message'] ?? '');

// 验证必填字段
if (empty($name) || empty($email) || empty($message)) {
    echo json_encode(['success' => false, 'message' => '请填写所有必填项（姓名、邮箱、留言）']);
    exit();
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['success' => false, 'message' => '邮箱格式不正确']);
    exit();
}

// 收件人（修改为你自己的邮箱）
$to = 'yhy@yhytradehub.com';

// 邮件主题
$subject = "[钰弘源官网] 新的客户咨询 - {$name}";

// 邮件正文
$body = "您收到一条来自官网联系我们页面的新留言：\n\n";
$body .= "姓名: {$name}\n";
$body .= "邮箱: {$email}\n";
if (!empty($phone)) {
    $body .= "电话: {$phone}\n";
}
$body .= "留言:\n{$message}\n\n";
$body .= "---\n";
$body .= "提交时间: " . date('Y-m-d H:i:s') . "\n";
$body .= "IP 地址: " . ($_SERVER['REMOTE_ADDR'] ?? '未知') . "\n";

// 邮件头
$headers = [
    'From: 钰弘源官网 <noreply@yhytradehub.com>',
    'Reply-To: ' . $email,
    'Content-Type: text/plain; charset=utf-8',
];

// 发送邮件
$mailSent = mail($to, $subject, $body, implode("\r\n", $headers));

if ($mailSent) {
    // 同时给客户发送确认邮件（可选）
    $clientSubject = "Thank you for contacting Shandong Yuhongyuan";
    $clientBody = "Dear {$name},\n\n";
    $clientBody .= "Thank you for your message. We have received your inquiry and will respond within 24 hours.\n\n";
    $clientBody .= "Best regards,\nShandong Yuhongyuan International Trade Co., Ltd.\n";
    $clientBody .= "Email: yhy@yhytradehub.com\n";
    $clientHeaders = [
        'From: 钰弘源国际贸易 <noreply@yhytradehub.com>',
        'Content-Type: text/plain; charset=utf-8',
    ];
    @mail($email, $clientSubject, $clientBody, implode("\r\n", $clientHeaders));

    echo json_encode(['success' => true, 'message' => '提交成功！我们会尽快与您联系。']);
} else {
    echo json_encode(['success' => false, 'message' => '邮件发送失败，请稍后重试或直接发邮件到 yhy@yhytradehub.com']);
}
