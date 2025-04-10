<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\News;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class NewsController extends Controller
{
    /**
     * Display a listing of the news articles.
     */
    public function index(Request $request)
    {
        $query = News::query();

        // For admin users, show all articles by default, otherwise only show published ones
        if (auth()->check() && auth()->user()->role === 'admin') {
            // If the admin specifically requests only published articles
            if ($request->has('published') && $request->published === 'true') {
                $query->where('is_published', true);
            }
            // If the admin specifically requests only draft articles
            elseif ($request->has('draft') && $request->draft === 'true') {
                $query->where('is_draft', true);
            }
            // Otherwise, show all articles to admins
        } else {
            // Non-admins only see published articles
            $query->where('is_published', true);
        }

        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('title', 'like', "%{$search}%")
                  ->orWhere('content', 'like', "%{$search}%");
            });
        }

        // Allow custom page size, default to 12
        $perPage = $request->input('per_page', 12);
        
        // Make sure per_page is reasonable
        if ($perPage <= 0 || $perPage > 100) {
            $perPage = 12;
        }

        $news = $query->orderBy('published_at', 'desc')
                     ->paginate($perPage);

        return response()->json([
            'data' => $news,
            'message' => 'News articles retrieved successfully',
            'status' => 200
        ]);
    }

    /**
     * Display the specified news article.
     */
    public function show($id)
    {
        $news = News::findOrFail($id);

        if (!$news->is_published && (!auth()->check() || auth()->user()->role !== 'admin')) {
            return response()->json([
                'data' => null,
                'message' => 'News article not found or not published',
                'status' => 404
            ], 404);
        }

        return response()->json([
            'data' => $news,
            'message' => 'News article retrieved successfully',
            'status' => 200
        ]);
    }

    public function store(Request $request)
    {
        // Dump the request data for debugging
        \Log::info('News creation request data:', $request->all());
        
        // Explicitly convert string values to booleans before validation
        if ($request->has('is_published')) {
            // Handle various formats: "1", "0", "true", "false", 1, 0
            $isPublished = filter_var($request->is_published, FILTER_VALIDATE_BOOLEAN);
            $request->merge(['is_published' => $isPublished]);
        }
        
        if ($request->has('is_draft')) {
            $isDraft = filter_var($request->is_draft, FILTER_VALIDATE_BOOLEAN);
            $request->merge(['is_draft' => $isDraft]);
        }
        
        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'category' => 'required|string|max:50',
            'image' => 'nullable|image|max:2048',
            'is_published' => 'required|boolean',
            'is_draft' => 'nullable|boolean',
            'published_at' => 'nullable|date',
        ]);

        $news = new News($request->except(['image', 'is_published', 'is_draft']));
        
        // Explicitly convert is_published and is_draft to booleans
        $news->is_published = filter_var($request->is_published, FILTER_VALIDATE_BOOLEAN);
        $news->is_draft = filter_var($request->is_draft, FILTER_VALIDATE_BOOLEAN);
        
        // Generate slug from title
        $news->slug = Str::slug($request->title);
        
        // Set excerpt if not provided
        if (empty($news->excerpt)) {
            $news->excerpt = Str::limit(strip_tags($news->content), 150);
        }

        // Set author to current user's name if not provided
        if (empty($news->author)) {
            $news->author = auth()->user()->name ?? 'Admin';
        }

        // Set published_at if article is being published
        if ($news->is_published) {
            $news->published_at = now();
            $news->is_draft = false;
        }

        if ($request->hasFile('image')) {
            // Get the image file
            $image = $request->file('image');
            
            // Get the original file extension
            $extension = $image->getClientOriginalExtension();
            
            // Create a descriptive filename: news-title-date.extension
            // Slugify the title to make it URL-safe, add timestamp for uniqueness
            $filename = Str::slug($news->title) . '-' . now()->format('Y-m-d-His') . '.' . $extension;
            
            // Store with the custom filename
            $path = $image->storeAs('news', $filename, 'public');
            $news->image_url = Storage::url($path);
        }

        $news->save();

        return response()->json([
            'data' => $news,
            'message' => 'News article created successfully',
            'status' => 201
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $news = News::findOrFail($id);

        // Dump the request data for debugging
        \Log::info('News update request data:', $request->all());
        
        // Explicitly convert string values to booleans before validation
        if ($request->has('is_published')) {
            // Handle various formats: "1", "0", "true", "false", 1, 0
            $isPublished = filter_var($request->is_published, FILTER_VALIDATE_BOOLEAN);
            $request->merge(['is_published' => $isPublished]);
        }
        
        if ($request->has('is_draft')) {
            $isDraft = filter_var($request->is_draft, FILTER_VALIDATE_BOOLEAN);
            $request->merge(['is_draft' => $isDraft]);
        }

        $request->validate([
            'title' => 'string|max:255',
            'content' => 'string',
            'category' => 'string|max:50',
            'image' => 'nullable|image|max:2048',
            'is_published' => 'required|boolean',
            'is_draft' => 'nullable|boolean',
            'published_at' => 'nullable|date',
        ]);

        $news->fill($request->except(['image', 'is_published', 'is_draft']));
        
        // Explicitly convert is_published and is_draft to booleans
        $news->is_published = filter_var($request->is_published, FILTER_VALIDATE_BOOLEAN);
        $news->is_draft = filter_var($request->is_draft, FILTER_VALIDATE_BOOLEAN);
        
        // Update slug if title has changed
        if ($request->has('title')) {
            $news->slug = Str::slug($request->title);
        }
        
        // Update excerpt if content has changed
        if ($request->has('content') && empty($news->excerpt)) {
            $news->excerpt = Str::limit(strip_tags($news->content), 150);
        }

        // Update published_at if article is being published for the first time
        if ($request->has('is_published') && $request->is_published && !$news->published_at) {
            $news->published_at = now();
            $news->is_draft = false;
        }

        if ($request->hasFile('image')) {
            // Delete old image if it exists
            if ($news->image_url) {
                $oldPath = Str::after($news->image_url, '/storage/');
                Storage::disk('public')->delete($oldPath);
            }

            // Get the image file
            $image = $request->file('image');
            
            // Get the original file extension
            $extension = $image->getClientOriginalExtension();
            
            // Create a descriptive filename: news-title-date.extension
            // Slugify the title to make it URL-safe, add timestamp for uniqueness
            $filename = Str::slug($news->title) . '-' . now()->format('Y-m-d-His') . '.' . $extension;
            
            // Store with the custom filename
            $path = $image->storeAs('news', $filename, 'public');
            $news->image_url = Storage::url($path);
        }

        $news->save();

        return response()->json([
            'data' => $news,
            'message' => 'News article updated successfully',
            'status' => 200
        ]);
    }

    public function destroy($id)
    {
        $news = News::findOrFail($id);

        if ($news->image_url) {
            $path = Str::after($news->image_url, '/storage/');
            Storage::disk('public')->delete($path);
        }

        $news->delete();

        return response()->json([
            'data' => null,
            'message' => 'News article deleted successfully',
            'status' => 200
        ]);
    }

    public function storeDraft(Request $request)
    {
        // Dump the request data for debugging
        \Log::info('News draft creation request data:', $request->all());
        
        // Explicitly convert string values to booleans before validation
        if ($request->has('is_published')) {
            // Handle various formats: "1", "0", "true", "false", 1, 0
            $isPublished = filter_var($request->is_published, FILTER_VALIDATE_BOOLEAN);
            $request->merge(['is_published' => $isPublished]);
        }
        
        if ($request->has('is_draft')) {
            $isDraft = filter_var($request->is_draft, FILTER_VALIDATE_BOOLEAN);
            $request->merge(['is_draft' => $isDraft]);
        }

        $request->validate([
            'title' => 'required|string|max:255',
            'content' => 'required|string',
            'category' => 'required|string|max:50',
            'image' => 'nullable|image|max:2048',
            'is_published' => 'nullable|boolean',
            'is_draft' => 'nullable|boolean',
        ]);

        // Create the news item from the request data except image and boolean fields
        $news = new News($request->except(['image', 'is_published', 'is_draft']));
        
        // Explicitly set boolean values
        $news->is_published = false;
        $news->is_draft = true;
        
        // Generate slug from title
        $news->slug = Str::slug($request->title);
        
        // Generate excerpt from content
        if (empty($news->excerpt)) {
            $news->excerpt = Str::limit(strip_tags($news->content), 150);
        }
        
        // Set author to current user's name if not provided
        if (empty($news->author)) {
            $news->author = auth()->user()->name ?? 'Admin';
        }

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('news', 'public');
            $news->image_url = Storage::url($path);
        }

        $news->save();

        return response()->json([
            'data' => $news,
            'message' => 'Draft news article created successfully',
            'status' => 201
        ], 201);
    }

    public function updateDraft(Request $request, $id)
    {
        $news = News::findOrFail($id);

        if ($news->is_published) {
            return response()->json([
                'data' => null,
                'message' => 'Cannot update a published article as draft',
                'status' => 400
            ], 400);
        }

        // Dump the request data for debugging
        \Log::info('News draft update request data:', $request->all());
        
        // Explicitly convert string values to booleans before validation
        if ($request->has('is_published')) {
            // Handle various formats: "1", "0", "true", "false", 1, 0
            $isPublished = filter_var($request->is_published, FILTER_VALIDATE_BOOLEAN);
            $request->merge(['is_published' => $isPublished]);
        }
        
        if ($request->has('is_draft')) {
            $isDraft = filter_var($request->is_draft, FILTER_VALIDATE_BOOLEAN);
            $request->merge(['is_draft' => $isDraft]);
        }

        $request->validate([
            'title' => 'string|max:255',
            'content' => 'string',
            'category' => 'string|max:50',
            'image' => 'nullable|image|max:2048',
            'is_published' => 'nullable|boolean',
            'is_draft' => 'nullable|boolean',
        ]);

        // Fill the model with data except for image and boolean fields
        $news->fill($request->except(['image', 'is_published', 'is_draft']));
        
        // Explicitly set boolean values
        $news->is_published = false;
        $news->is_draft = true;
        
        // Update slug if title has changed
        if ($request->has('title')) {
            $news->slug = Str::slug($request->title);
        }
        
        // Update excerpt if content has changed
        if ($request->has('content')) {
            $news->excerpt = Str::limit(strip_tags($news->content), 150);
        }

        if ($request->hasFile('image')) {
            if ($news->image_url) {
                $oldPath = Str::after($news->image_url, '/storage/');
                Storage::disk('public')->delete($oldPath);
            }

            $path = $request->file('image')->store('news', 'public');
            $news->image_url = Storage::url($path);
        }

        $news->save();

        return response()->json([
            'data' => $news,
            'message' => 'Draft news article updated successfully',
            'status' => 200
        ]);
    }

    /**
     * Display the specified news article by slug.
     */
    public function findBySlug($slug)
    {
        $news = News::where('slug', $slug)->firstOrFail();

        if (!$news->is_published && (!auth()->check() || auth()->user()->role !== 'admin')) {
            return response()->json([
                'data' => null,
                'message' => 'News article not found or not published',
                'status' => 404
            ], 404);
        }

        return response()->json([
            'data' => $news,
            'message' => 'News article retrieved successfully',
            'status' => 200
        ]);
    }
} 