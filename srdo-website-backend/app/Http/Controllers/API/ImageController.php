<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Response;

class ImageController extends Controller
{
    public function getNewsImage($filename)
    {
        $path = storage_path('app/public/news/' . $filename);

        if (!File::exists($path)) {
            return response()->json(['message' => 'Image not found'], 404);
        }

        $file = File::get($path);
        $type = File::mimeType($path);

        $response = Response::make($file, 200);
        $response->header("Content-Type", $type);

        return $response;
    }

    public function getProjectImage($filename)
    {
        $path = storage_path('app/public/projects/' . $filename);

        if (!File::exists($path)) {
            return response()->json(['message' => 'Image not found'], 404);
        }

        $file = File::get($path);
        $type = File::mimeType($path);

        $response = Response::make($file, 200);
        $response->header("Content-Type", $type);

        return $response;
    }

    public function getResourceFile($filename)
    {
        $path = storage_path('app/public/resources/' . $filename);

        if (!File::exists($path)) {
            return response()->json(['message' => 'File not found'], 404);
        }

        $file = File::get($path);
        $type = File::mimeType($path);

        $response = Response::make($file, 200);
        $response->header("Content-Type", $type);
        $response->header("Content-Disposition", "inline; filename=\"" . $filename . "\"");

        return $response;
    }
} 