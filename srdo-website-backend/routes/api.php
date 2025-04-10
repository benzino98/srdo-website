<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\NewsController;
use App\Http\Controllers\API\ProjectController;
use App\Http\Controllers\API\ResourceController;
use App\Http\Controllers\API\ContactController;
use App\Http\Controllers\API\FileUploadController;
use App\Http\Controllers\API\CommentController;
use App\Http\Controllers\API\LoginController;
use App\Http\Controllers\API\RegisterController;
use App\Http\Controllers\API\PasswordResetController;
use Illuminate\Support\Facades\Storage;

// Simple test endpoint to check connectivity
Route::get('/ping', function() {
    return response()->json([
        'message' => 'pong',
        'server_time' => now()->toDateTimeString(),
    ]);
});

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Test route to check CORS
Route::get('/test-cors', function() {
    return response()->json(['message' => 'CORS is working!']);
});

// Test route to check database and User model
Route::get('/test-db', function() {
    try {
        $userCount = \App\Models\User::count();
        $testUser = \App\Models\User::where('email', 'admin@srdo.org')->first();
        
        return response()->json([
            'status' => 'success',
            'connection' => 'Database connection working!',
            'total_users' => $userCount,
            'test_user_exists' => !is_null($testUser),
            'test_user_email' => $testUser ? $testUser->email : null,
            'sanctum_installed' => class_exists('Laravel\Sanctum\Sanctum')
        ]);
    } catch (\Exception $e) {
        return response()->json([
            'status' => 'error',
            'message' => 'Database connection failed: ' . $e->getMessage(),
            'file' => $e->getFile(),
            'line' => $e->getLine()
        ], 500);
    }
});

// Storage access route
Route::get('/storage/{folder}/{filename}', function ($folder, $filename) {
    $path = "public/{$folder}/{$filename}";
    
    if (!Storage::exists($path)) {
        return response()->json(['error' => 'File not found'], 404);
    }
    
    $file = Storage::get($path);
    $type = Storage::mimeType($path);
    
    return response($file, 200)->header('Content-Type', $type);
});

// Public routes
Route::prefix('v1')->group(function () {
    // Add ping endpoint inside v1 prefix as well for more reliable connectivity checks
    Route::get('/ping', function() {
        return response()->json([
            'message' => 'pong',
            'server_time' => now()->toDateTimeString(),
            'version' => 'v1'
        ]);
    });
    
    // Add simple test endpoints
    Route::get('/test-ping', function() {
        return response()->json([
            'message' => 'Test ping successful',
            'server_time' => now()->toDateTimeString(),
        ]);
    });
    
    Route::post('/test-post', function(Request $request) {
        return response()->json([
            'message' => 'Test POST successful',
            'data_received' => $request->all(),
            'server_time' => now()->toDateTimeString(),
        ]);
    });
    
    // Auth routes
    Route::post('/auth/login', [LoginController::class, 'login']);
    Route::post('/auth/register', [RegisterController::class, 'register']);
    Route::post('/auth/verify/resend', [RegisterController::class, 'resendVerification']);
    Route::post('/auth/forgot-password', [PasswordResetController::class, 'sendResetLink']);
    Route::post('/auth/reset-password', [PasswordResetController::class, 'reset']);
    Route::post('/auth/refresh-public', [AuthController::class, 'refreshTokenPublic']);
    
    // Add a simple route for testing CORS
    Route::get('/auth/test', function() {
        return response()->json(['message' => 'Auth API is reachable!']);
    });
    
    // Public resources
    Route::get('/news', [NewsController::class, 'index']);
    Route::get('/news/slug/{slug}', [NewsController::class, 'findBySlug']);
    Route::get('/news/{id}', [NewsController::class, 'show']);
    Route::get('/news/{id}/comments', [CommentController::class, 'getNewsComments']);
    Route::post('/news/{id}/comments', [CommentController::class, 'storeNewsComment']);
    
    Route::get('/projects', [ProjectController::class, 'index']);
    Route::get('/projects/{id}', [ProjectController::class, 'show']);
    
    Route::get('/resources', [ResourceController::class, 'index']);
    Route::get('/resources/{id}', [ResourceController::class, 'show']);
    Route::get('/resources/{id}/download', [ResourceController::class, 'download']);
    Route::post('/resources/{id}/prepare-download', [ResourceController::class, 'prepareDownload']);
    Route::get('/resources/{id}/download-file', [ResourceController::class, 'downloadWithToken']);
    
    Route::post('/contact', [ContactController::class, 'store']);
});

// Protected routes - allow access for all authenticated users without role check
Route::prefix('v1')->middleware(['auth:sanctum'])->group(function () {
    // Auth routes
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/verify', [AuthController::class, 'verify']);
    Route::post('/auth/refresh', [AuthController::class, 'refreshToken']);
    Route::get('/auth/user', [AuthController::class, 'user']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/auth/change-password', [PasswordResetController::class, 'changePassword']);
    
    // Dashboard stats endpoint for admin dashboard
    Route::get('/dashboard/stats', function() {
        return response()->json([
            'data' => [
                'projects_count' => \App\Models\Project::count(),
                'news_count' => \App\Models\News::count(),
                'resources_count' => \App\Models\Resource::count(),
                'contacts_count' => \App\Models\Contact::count(),
                'unread_contacts' => \App\Models\Contact::whereNull('read_at')->count(),
            ],
            'message' => 'Dashboard stats retrieved successfully',
            'status' => 200
        ]);
    });
    
    // Project management
    Route::post('/projects', [ProjectController::class, 'store']);
    Route::put('/projects/{id}', [ProjectController::class, 'update']);
    Route::delete('/projects/{id}', [ProjectController::class, 'destroy']);
    Route::post('/projects/draft', [ProjectController::class, 'storeDraft']);
    Route::put('/projects/{id}/draft', [ProjectController::class, 'updateDraft']);
    
    // News management
    Route::post('/news', [NewsController::class, 'store']);
    Route::put('/news/{id}', [NewsController::class, 'update']);
    Route::delete('/news/{id}', [NewsController::class, 'destroy']);
    Route::post('/news/draft', [NewsController::class, 'storeDraft']);
    Route::put('/news/{id}/draft', [NewsController::class, 'updateDraft']);
    
    // Resource management
    Route::post('/resources', [ResourceController::class, 'store']);
    Route::put('/resources/{id}', [ResourceController::class, 'update']);
    Route::delete('/resources/{id}', [ResourceController::class, 'destroy']);
    
    // Contact management
    Route::get('/contacts', [ContactController::class, 'index']);
    Route::put('/contacts/{id}/read', [ContactController::class, 'markAsRead']);
    
    // Comments management
    Route::get('/comments', [CommentController::class, 'index']);
    Route::put('/comments/{id}/approve', [CommentController::class, 'approve']);
    Route::delete('/comments/{id}', [CommentController::class, 'destroy']);

    // Email verification routes
    Route::post('/email/verification-notification', [RegisterController::class, 'resendVerification'])
        ->middleware(['throttle:6,1'])
        ->name('verification.send');
    
    // Verify email
    Route::get('/email/verify/{id}/{hash}', [RegisterController::class, 'verify'])
        ->middleware(['signed'])
        ->name('verification.verify');
}); 