<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;

Route::get('/', function () {
    return view('welcome');
});

// If the storage symlink isn't working, this route will serve files directly 
Route::get('/storage/{path}', function ($path) {
    $fullPath = 'public/' . $path;
    
    if (!Storage::exists($fullPath)) {
        return response()->json(['error' => 'File not found'], 404);
    }
    
    $file = Storage::get($fullPath);
    $type = Storage::mimeType($fullPath);
    
    return response($file, 200)->header('Content-Type', $type);
})->where('path', '.*');
