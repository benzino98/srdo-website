<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class ProjectController extends Controller
{
    /**
     * Display a listing of the projects.
     */
    public function index(Request $request)
    {
        $query = Project::query();

        // Filter by status if provided
        if ($request->has('status') && in_array($request->status, ['ongoing', 'completed'])) {
            $query->where('status', $request->status);
        }

        // Order by start date (newest first)
        $query->orderBy('start_date', 'desc');

        // Pagination
        $perPage = $request->per_page ?? 12;
        
        $projects = $query->paginate($perPage);
        
        return response()->json([
            'data' => $projects,
            'message' => 'Projects retrieved successfully',
            'status' => 200
        ]);
    }

    /**
     * Display the specified project.
     */
    public function show($id)
    {
        $project = Project::findOrFail($id);
        
        // Force loading of certain attributes even if they might be null
        $project->makeVisible(['content', 'description']);
        
        // Ensure content is available 
        if (empty($project->content)) {
            $project->content = $project->description;
        }
        
        return response()->json([
            'data' => $project,
            'message' => 'Project retrieved successfully',
            'status' => 200
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'content' => 'nullable|string',
            'status' => 'required|in:ongoing,completed',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after:start_date',
            'location' => 'required|string|max:255',
            'budget' => 'nullable|numeric|min:0',
            'image' => 'nullable|image|max:2048'
        ]);

        $project = new Project($request->except(['image']));
        
        // Generate slug from title
        $project->slug = Str::slug($request->title);
        
        // Set default content if not provided
        if (empty($project->content)) {
            $project->content = $project->description;
        }

        if ($request->hasFile('image')) {
            // Get the image file
            $image = $request->file('image');
            
            // Get the original file extension
            $extension = $image->getClientOriginalExtension();
            
            // Create a descriptive filename: project-title-date.extension
            // Slugify the title to make it URL-safe, add timestamp for uniqueness
            $filename = Str::slug($project->title) . '-' . now()->format('Y-m-d-His') . '.' . $extension;
            
            // Store with the custom filename
            $path = $image->storeAs('projects', $filename, 'public');
            $project->image_url = Storage::url($path);
        }

        $project->save();

        return response()->json([
            'data' => $project,
            'message' => 'Project created successfully',
            'status' => 201
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $project = Project::findOrFail($id);

        $request->validate([
            'title' => 'string|max:255',
            'description' => 'string',
            'content' => 'nullable|string',
            'status' => 'in:ongoing,completed',
            'start_date' => 'date',
            'end_date' => 'nullable|date|after:start_date',
            'location' => 'string|max:255',
            'budget' => 'nullable|numeric|min:0',
            'image' => 'nullable|image|max:2048'
        ]);

        $project->fill($request->except(['image']));
        
        // Update slug if title has changed
        if ($request->has('title')) {
            $project->slug = Str::slug($request->title);
        }
        
        // Set default content if not provided
        if (empty($project->content)) {
            $project->content = $project->description;
        }

        if ($request->hasFile('image')) {
            // Delete the old image if it exists
            if ($project->image_url) {
                $oldPath = str_replace('/storage/', '', $project->image_url);
                if (Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->delete($oldPath);
                }
            }

            // Get the image file
            $image = $request->file('image');
            
            // Get the original file extension
            $extension = $image->getClientOriginalExtension();
            
            // Create a descriptive filename: project-title-date.extension
            // Slugify the title to make it URL-safe, add timestamp for uniqueness
            $filename = Str::slug($project->title) . '-' . now()->format('Y-m-d-His') . '.' . $extension;
            
            // Store with the custom filename
            $path = $image->storeAs('projects', $filename, 'public');
            $project->image_url = Storage::url($path);
        }

        $project->save();

        return response()->json([
            'data' => $project,
            'message' => 'Project updated successfully',
            'status' => 200
        ]);
    }

    public function destroy($id)
    {
        $project = Project::findOrFail($id);

        if ($project->image_url) {
            $path = Str::after($project->image_url, '/storage/');
            Storage::disk('public')->delete($path);
        }

        $project->delete();

        return response()->json([
            'data' => null,
            'message' => 'Project deleted successfully',
            'status' => 200
        ]);
    }

    public function storeDraft(Request $request)
    {
        $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'content' => 'nullable|string',
            'start_date' => 'required|date',
            'location' => 'required|string|max:255',
            'image' => 'nullable|image|max:2048'
        ]);

        $project = new Project($request->except('image'));
        
        // Generate slug from title
        $project->slug = Str::slug($request->title);
        
        // Set draft defaults
        $project->status = 'ongoing';
        if (empty($project->content)) {
            $project->content = $project->description;
        }

        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $extension = $image->getClientOriginalExtension();
            $filename = Str::slug($project->title) . '-draft-' . now()->format('Y-m-d-His') . '.' . $extension;
            $path = $image->storeAs('projects/drafts', $filename, 'public');
            $project->image_url = Storage::url($path);
        }

        $project->save();

        return response()->json([
            'data' => $project,
            'message' => 'Draft project created successfully',
            'status' => 201
        ], 201);
    }

    public function updateDraft(Request $request, $id)
    {
        $project = Project::findOrFail($id);

        $request->validate([
            'title' => 'string|max:255',
            'description' => 'string',
            'content' => 'nullable|string',
            'start_date' => 'date',
            'location' => 'string|max:255',
            'image' => 'nullable|image|max:2048'
        ]);

        $project->fill($request->except('image'));
        
        if ($request->has('title')) {
            $project->slug = Str::slug($request->title);
        }

        if ($request->hasFile('image')) {
            if ($project->image_url) {
                $oldPath = str_replace('/storage/', '', $project->image_url);
                if (Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->delete($oldPath);
                }
            }

            $image = $request->file('image');
            $extension = $image->getClientOriginalExtension();
            $filename = Str::slug($project->title) . '-draft-' . now()->format('Y-m-d-His') . '.' . $extension;
            $path = $image->storeAs('projects/drafts', $filename, 'public');
            $project->image_url = Storage::url($path);
        }

        $project->save();

        return response()->json([
            'data' => $project,
            'message' => 'Draft project updated successfully',
            'status' => 200
        ]);
    }
} 