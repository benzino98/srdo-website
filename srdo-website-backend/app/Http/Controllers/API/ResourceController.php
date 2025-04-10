<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Resource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class ResourceController extends Controller
{
    /**
     * Display a listing of the resources.
     */
    public function index(Request $request)
    {
        $query = Resource::query();

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%");
            });
        }

        $resources = $query->orderBy('created_at', 'desc')
                         ->paginate(12);

        return response()->json($resources);
    }

    public function show($id)
    {
        $resource = Resource::findOrFail($id);
        return response()->json($resource);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category' => 'required|string|max:50',
            'file' => 'required|file|max:10240', // 10MB max
        ]);

        $resource = new Resource($request->except('file'));
        
        // Set published status if not provided
        if (!isset($resource->is_published)) {
            $resource->is_published = true;
        }
        if (!isset($resource->published)) {
            $resource->published = true;
        }
        
        // Set published_at for published resources
        if ($resource->is_published && !$resource->published_at) {
            $resource->published_at = now();
        }
        
        // Set download count to 0 if not set
        if (empty($resource->download_count)) {
            $resource->download_count = 0;
        }

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            
            // Get the original file extension and ensure it's lowercase
            $extension = strtolower($file->getClientOriginalExtension());
            
            // Create a clean, URL-safe version of the title
            $safeTitle = Str::slug($resource->title);
            
            // Get a clean category name
            $safeCategory = Str::slug($resource->category);
            
            // Create year and month folders for better organization
            $yearMonth = now()->format('Y/m');
            
            // Create the final filename: category/year/month/title-timestamp.extension
            $filename = $safeTitle . '-' . now()->format('YmdHis') . '.' . $extension;
            
            // Full path will be: resources/category/year/month/filename
            $fullPath = "resources/{$safeCategory}/{$yearMonth}/{$filename}";
            
            // Store the file
            $path = $file->storeAs(dirname($fullPath), $filename, 'public');
            
            // Update resource with file information
            $resource->file_url = Storage::url($path);
            $resource->file_type = $file->getClientMimeType();
            $resource->file_name = $file->getClientOriginalName();
            $resource->file_path = $path; // Store the relative path for easier management
            
            // Store file size in bytes for consistent handling
            $resource->file_size = $file->getSize();
        }

        $resource->save();

        return response()->json($resource, 201);
    }

    public function update(Request $request, $id)
    {
        $resource = Resource::findOrFail($id);

        $request->validate([
            'title' => 'string|max:255',
            'description' => 'string',
            'category' => 'string|max:50',
            'file' => 'nullable|file|max:10240', // 10MB max
            'is_published' => 'boolean',
        ]);

        $resource->fill($request->except('file'));
        
        // Update published_at if is_published status has changed
        if ($request->has('is_published') && $resource->is_published && !$resource->published_at) {
            $resource->published_at = now();
        }

        if ($request->hasFile('file')) {
            // Delete old file if it exists
            if ($resource->file_path) {
                Storage::disk('public')->delete($resource->file_path);
            }

            $file = $request->file('file');
            
            // Get the original file extension and ensure it's lowercase
            $extension = strtolower($file->getClientOriginalExtension());
            
            // Create a clean, URL-safe version of the title
            $safeTitle = Str::slug($resource->title);
            
            // Get a clean category name
            $safeCategory = Str::slug($resource->category);
            
            // Create year and month folders for better organization
            $yearMonth = now()->format('Y/m');
            
            // Create the final filename: category/year/month/title-timestamp.extension
            $filename = $safeTitle . '-' . now()->format('YmdHis') . '.' . $extension;
            
            // Full path will be: resources/category/year/month/filename
            $fullPath = "resources/{$safeCategory}/{$yearMonth}/{$filename}";
            
            // Store the file
            $path = $file->storeAs(dirname($fullPath), $filename, 'public');
            
            // Update resource with file information
            $resource->file_url = Storage::url($path);
            $resource->file_type = $file->getClientMimeType();
            $resource->file_name = $file->getClientOriginalName();
            $resource->file_path = $path; // Store the relative path for easier management
            
            // Store file size in bytes for consistent handling
            $resource->file_size = $file->getSize();
        }

        $resource->save();

        return response()->json($resource);
    }

    public function destroy($id)
    {
        $resource = Resource::findOrFail($id);

        // Delete the file using the stored file_path
        if ($resource->file_path) {
            Storage::disk('public')->delete($resource->file_path);
        }

        $resource->delete();

        return response()->json(['message' => 'Resource deleted successfully']);
    }

    /**
     * Download a file using a pre-generated token.
     * This endpoint should not be blocked by ad-blockers.
     */
    public function downloadWithToken(Request $request)
    {
        try {
            $token = $request->query('token');
            
            if (!$token) {
                return response()->json(['message' => 'No download token provided'], 400);
            }
            
            // Check if token exists in cache
            $downloadInfo = \Cache::get("download_token_{$token}");
            
            if (!$downloadInfo) {
                \Log::warning("Invalid or expired download token: {$token}");
                return response()->json(['message' => 'Invalid or expired download token'], 400);
            }
            
            $resourceId = $downloadInfo['resource_id'];
            $resource = Resource::find($resourceId);
            
            if (!$resource) {
                \Log::error("Resource not found for token {$token}");
                return response()->json(['message' => 'Resource not found'], 404);
            }
            
            // Increment download counter
            DB::transaction(function() use ($resource) {
                $resource->increment('download_count');
                $resource->save();
            });
            
            \Log::info("Download with token: count incremented to {$resource->download_count}");
            
            // Get file extension from the stored file
            $extension = pathinfo($downloadInfo['file_path'], PATHINFO_EXTENSION);
            
            // Create a clean filename for download
            $downloadFilename = $downloadInfo['file_name'] ?? 
                                (Str::slug($downloadInfo['title']) . '.' . $extension);
            
            // Invalidate the token to prevent reuse
            \Cache::forget("download_token_{$token}");
            
            // Add headers to prevent caching and improve compatibility with a broader variety of headers
            $headers = [
                'Content-Disposition' => 'attachment; filename="' . $downloadFilename . '"',
                'Content-Description' => 'File Transfer',
                'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
                'Pragma' => 'no-cache',
                'Expires' => '0',
                'Access-Control-Allow-Origin' => '*',
                'Access-Control-Allow-Methods' => 'GET, OPTIONS',
                'Access-Control-Allow-Headers' => 'Content-Type, Content-Disposition, Content-Description',
                'X-Content-Type-Options' => 'nosniff',
            ];
            
            return Storage::disk('public')->download(
                $downloadInfo['file_path'], 
                $downloadFilename,
                $headers
            );
            
        } catch (\Exception $e) {
            \Log::error("Error in token download: " . $e->getMessage());
            return response()->json(['message' => 'Download failed'], 500);
        }
    }

    /**
     * Prepare a download URL that will be less likely to be blocked by ad-blockers.
     * This method generates a signed URL that can be used for direct download without additional API calls.
     */
    public function prepareDownload(Request $request, $id)
    {
        try {
            \Log::info("Preparing download token for resource {$id}");
            $resource = Resource::findOrFail($id);
            
            if (!$resource->file_path || !Storage::disk('public')->exists($resource->file_path)) {
                \Log::error("File not found for resource {$id} when preparing token");
                return response()->json([
                    'success' => false,
                    'message' => 'File not found'
                ], 404);
            }
            
            // Generate a secure download token
            $token = hash('sha256', $resource->id . time() . Str::random(40));
            
            // Store the token in the cache with resource info (5 min expiry)
            \Cache::put("download_token_{$token}", [
                'resource_id' => $resource->id,
                'file_path' => $resource->file_path,
                'file_name' => $resource->file_name,
                'title' => $resource->title,
                'created_at' => now()->timestamp
            ], 300);
            
            \Log::info("Download token created for resource {$id}: {$token}");
            
            // Get the full URL to the file that we can redirect to
            $baseUrl = url('/');
            $downloadUrl = "{$baseUrl}/api/v1/resources/{$id}/download-file?token={$token}";
            
            // Return both token and direct URL to the client
            return response()->json([
                'success' => true,
                'token' => $token,
                'downloadUrl' => $downloadUrl,
                'message' => 'Download token created successfully'
            ]);
        } catch (\Exception $e) {
            \Log::error("Error creating download token: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Failed to prepare download'
            ], 500);
        }
    }

    /**
     * Download and increment counter.
     * Original method - kept for backward compatibility.
     */
    public function download($id)
    {
        \Log::info("Download requested for resource {$id}");
        $resource = Resource::findOrFail($id);
        
        \Log::info("Current download count: {$resource->download_count}");
        
        if (!$resource->file_path || !Storage::disk('public')->exists($resource->file_path)) {
            \Log::error("File not found for resource {$id}");
            return response()->json(['message' => 'File not found'], 404);
        }

        DB::transaction(function() use ($resource) {
            $resource->increment('download_count');
            $resource->save();
        });
        
        \Log::info("Download count incremented to: {$resource->download_count}");

        // Get file extension from the stored file
        $extension = pathinfo($resource->file_path, PATHINFO_EXTENSION);
        
        // Create a clean filename for download
        $downloadFilename = Str::slug($resource->title) . '.' . $extension;

        // Add headers to prevent caching and improve download compatibility
        $headers = [
            'Content-Disposition' => 'attachment; filename="' . $downloadFilename . '"',
            'Content-Description' => 'File Transfer',
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
            'Expires' => '0',
            'Access-Control-Allow-Origin' => '*',
            'Access-Control-Allow-Methods' => 'GET, OPTIONS',
            'Access-Control-Allow-Headers' => 'Content-Type, Content-Disposition, Content-Description',
            'X-Content-Type-Options' => 'nosniff',
        ];

        return Storage::disk('public')->download($resource->file_path, $downloadFilename, $headers);
    }
} 