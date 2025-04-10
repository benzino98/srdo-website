<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\News;
use App\Models\Project;
use App\Models\Resource;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function index(Request $request)
    {
        $comments = Comment::with('user')
            ->when($request->type, function ($query, $type) {
                $query->where('commentable_type', $type);
            })
            ->when($request->approved !== null, function ($query) use ($request) {
                $query->where('is_approved', $request->approved);
            })
            ->latest()
            ->paginate(20);

        return response()->json($comments);
    }

    public function approve($id)
    {
        $comment = Comment::findOrFail($id);
        $comment->update(['is_approved' => true]);

        return response()->json([
            'message' => 'Comment approved successfully',
            'comment' => $comment,
        ]);
    }

    public function destroy($id)
    {
        $comment = Comment::findOrFail($id);
        $comment->delete();

        return response()->json([
            'message' => 'Comment deleted successfully',
        ]);
    }

    public function getNewsComments($id)
    {
        $news = News::findOrFail($id);
        return $this->getComments($news);
    }

    private function getComments($model)
    {
        try {
            $comments = $model->comments()
                ->with('user')
                ->where('is_approved', true)
                ->latest()
                ->get();

            // Transform comments to handle guest names properly
            $transformedComments = $comments->map(function ($comment) {
                $data = $comment->toArray();
                
                // If it's a guest comment (no user_id), ensure we format properly
                if (!$comment->user_id && $comment->guest_name) {
                    // Make sure we don't have a null user object
                    $data['user'] = null;
                }
                
                return $data;
            });

            // Ensure we always return an array
            return response()->json([
                'data' => $transformedComments
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching comments: ' . $e->getMessage());
            return response()->json([
                'data' => []
            ]);
        }
    }

    public function storeNewsComment(Request $request, $id)
    {
        $news = News::findOrFail($id);
        return $this->storeComment($request, $news);
    }

    private function storeComment(Request $request, $model)
    {
        try {
            \Log::info('Storing comment', [
                'content_length' => strlen($request->content),
                'model_type' => get_class($model),
                'model_id' => $model->id,
                'is_authenticated' => $request->user() ? 'yes' : 'no'
            ]);
            
            $request->validate([
                'content' => 'required|string|max:1000',
                'guest_name' => 'required_without:user_id|string|max:255',
            ]);

            // Create comment data array
            $commentData = [
                'content' => $request->content,
                'is_approved' => false, // All comments require approval by default
            ];

            // If user is authenticated, use their ID
            if ($request->user()) {
                $commentData['user_id'] = $request->user()->id;
                
                // Check if user has admin role (comments from admins are auto-approved)
                try {
                    if ($request->user()->hasRole('admin') || $request->user()->hasRole('editor')) {
                        $commentData['is_approved'] = true;
                    }
                } catch (\Exception $e) {
                    \Log::warning('Error checking role: ' . $e->getMessage());
                }
            } else {
                // For anonymous users, store their name
                $commentData['guest_name'] = $request->guest_name;
            }

            // Create the comment
            $comment = $model->comments()->create($commentData);

            \Log::info('Comment created successfully', [
                'comment_id' => $comment->id,
                'is_approved' => $comment->is_approved
            ]);

            return response()->json([
                'message' => 'Comment added successfully' . ($comment->is_approved ? '' : ' (pending approval)'),
                'comment' => $comment->load('user'),
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            \Log::warning('Validation error when creating comment: ' . $e->getMessage());
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Error creating comment: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Failed to create comment: ' . $e->getMessage(),
            ], 500);
        }
    }
} 