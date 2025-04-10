<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class LoginController extends Controller
{
    /**
     * Handle user login
     */
    public function login(Request $request)
    {
        // Log all request details for debugging
        Log::info('Login attempt', [
            'email' => $request->email,
            'headers' => $request->headers->all(),
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent()
        ]);

        try {
            // Validate request
            $validated = $request->validate([
                'email' => 'required|email',
                'password' => 'required',
            ]);
            
            Log::info('Validation passed', ['email' => $request->email]);

            // Attempt authentication
            if (!Auth::attempt($validated)) {
                Log::warning('Authentication failed', ['email' => $request->email]);
                
                return response()->json([
                    'message' => 'The provided credentials are incorrect.',
                ], 401);
            }
            
            Log::info('Authentication successful', ['email' => $request->email]);
            
            $user = User::where('email', $request->email)->first();
            
            if (!$user) {
                Log::error('User not found after authentication', ['email' => $request->email]);
                throw new \Exception('User not found after successful authentication');
            }

            // Delete existing tokens to avoid accumulation
            try {
                $user->tokens()->delete();
                Log::info('Previous tokens deleted', ['user_id' => $user->id]);
            } catch (\Exception $e) {
                Log::error('Error deleting tokens', [
                    'user_id' => $user->id,
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
            }

            // Create new token
            try {
                $token = $user->createToken('auth-token')->plainTextToken;
                Log::info('Token created successfully', ['user_id' => $user->id]);
            } catch (\Exception $e) {
                Log::error('Token creation failed', [
                    'user_id' => $user->id, 
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                throw $e;
            }

            return response()->json([
                'data' => [
                    'token' => $token,
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'role' => $user->role,
                    ]
                ],
                'message' => 'Logged in successfully',
                'status' => 200
            ]);

        } catch (ValidationException $e) {
            Log::warning('Login validation failed', ['errors' => $e->errors()]);
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            Log::error('Login error', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            return response()->json([
                'message' => 'An error occurred during login: ' . $e->getMessage()
            ], 500);
        }
    }
} 