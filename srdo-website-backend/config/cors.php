<?php

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [env('CORS_ALLOWED_ORIGINS', 'http://localhost:3000')],
    'allowed_origins_patterns' => [],
    'allowed_headers' => [
        'Content-Type',
        'X-XSRF-TOKEN',
        'X-Requested-With',
        'Accept',
        'Authorization',
        'X-CSRF-TOKEN',
        'Origin',
        'Cookie'
    ],
    'exposed_headers' => ['*'],
    'max_age' => 86400,
    'supports_credentials' => true,
]; 