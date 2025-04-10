<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Contact;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ContactController extends Controller
{
    /**
     * Store a new contact message.
     */
    public function store(Request $request)
    {
        // Validate the incoming request
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'subject' => 'nullable|string|max:255',
            'message' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Create the contact message
        $contact = Contact::create([
            'name' => $request->name,
            'email' => $request->email,
            'subject' => $request->subject,
            'message' => $request->message,
            'read' => false,
        ]);

        return response()->json([
            'message' => 'Your message has been sent successfully.',
            'contact' => $contact
        ], 201);
    }

    /**
     * Display a listing of contact messages (admin only).
     */
    public function index(Request $request)
    {
        // This endpoint would be protected by auth middleware in routes
        $query = Contact::query();

        // Filter by read status
        if ($request->has('status')) {
            if ($request->status === 'read') {
                $query->where('read', true);
            } elseif ($request->status === 'unread') {
                $query->where('read', false);
            }
        }

        // Sort by newest first
        $query->orderBy('created_at', 'desc');

        // Get paginated results
        $contacts = $query->paginate(10);

        return response()->json([
            'data' => $contacts->items(),
            'meta' => [
                'current_page' => $contacts->currentPage(),
                'last_page' => $contacts->lastPage(),
                'per_page' => $contacts->perPage(),
                'total' => $contacts->total(),
            ]
        ]);
    }

    /**
     * Mark a contact message as read.
     */
    public function markAsRead($id)
    {
        $contact = Contact::findOrFail($id);
        $contact->update([
            'read' => true,
            'read_at' => now()
        ]);

        return response()->json([
            'message' => 'Contact message marked as read',
            'contact' => $contact
        ]);
    }

    /**
     * Get a specific contact message.
     */
    public function show($id)
    {
        $contact = Contact::findOrFail($id);
        return response()->json(['data' => $contact]);
    }
} 