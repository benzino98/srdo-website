<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class HandleCors
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        // Handle preflight OPTIONS requests
        if ($request->isMethod('OPTIONS')) {
            $response = new Response('', 200);
        } else {
            // Get response for other request types
            $response = $next($request);
        }
        
        // Get allowed origin from env or use default
        $allowedOrigin = env('CORS_ALLOWED_ORIGINS', 'http://localhost:3000');
        
        // Set the requesting origin if it matches allowed origins
        $requestOrigin = $request->header('Origin');
        if ($requestOrigin === $allowedOrigin) {
            $response->headers->set('Access-Control-Allow-Origin', $requestOrigin);
        } else {
            $response->headers->set('Access-Control-Allow-Origin', $allowedOrigin);
        }
        
        // Add other CORS headers
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-XSRF-TOKEN, X-CSRF-TOKEN, Accept, Origin');
        $response->headers->set('Access-Control-Max-Age', '86400');
        $response->headers->set('Access-Control-Allow-Credentials', 'true');

        return $response;
    }
} 