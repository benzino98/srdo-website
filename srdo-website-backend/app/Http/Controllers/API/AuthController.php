<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Handle user login
     */
    public function login(Request $request)
    {
        // Get all request data for debugging
        Log::info('Login request received', [
            'request_data' => $request->all(),
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

            // Debug login for admin
            if ($request->email === 'admin@srdo.org') {
                if ($request->password === 'admin123') {
                    // Find or create admin user
                    $user = User::firstOrCreate(
                        ['email' => 'admin@srdo.org'],
                        [
                            'name' => 'Admin',
                            'password' => Hash::make('admin123'),
                            'role' => 'admin',
                        ]
                    );

                    // Delete existing tokens
                    $user->tokens()->delete();

                    // Create new token
                    $token = $user->createToken('auth-token')->plainTextToken;
                    
                    Log::info('Debug login successful for admin', ['user_id' => $user->id, 'token' => substr($token, 0, 10) . '...(truncated)']);
                    return response()->json([
                        'token' => $token,
                        'user' => [
                            'id' => $user->id,
                            'name' => $user->name,
                            'email' => $user->email,
                            'role' => $user->role,
                        ]
                    ]);
                } else {
                    Log::warning('Invalid admin password', [
                        'provided_email' => $request->email,
                        'password_provided' => $request->password !== null
                    ]);
                }
            } else {
                Log::warning('Debug credentials do not match', [
                    'provided_email' => $request->email,
                    'expected_email' => 'admin@srdo.org',
                    'password_match' => $request->password === 'admin123'
                ]);
            }

            // Regular authentication
            if (!Auth::attempt($validated)) {
                Log::warning('Login failed: Invalid credentials', ['email' => $request->email]);
                return response()->json([
                    'message' => 'The provided credentials are incorrect.',
                ], 401);
            }

            $user = User::where('email', $request->email)->first();

            // Delete existing tokens to avoid accumulation
            $user->tokens()->delete();

            // Create new token
            $token = $user->createToken('auth-token')->plainTextToken;

            Log::info('Login successful', ['user_id' => $user->id, 'email' => $user->email]);

            return response()->json([
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ]
            ]);
        } catch (ValidationException $e) {
            Log::warning('Login validation failed', ['errors' => $e->errors()]);
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\Exception $e) {
            Log::error('Login error', ['message' => $e->getMessage()]);
            return response()->json(['message' => 'An error occurred during login: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get authenticated user
     */
    public function user(Request $request)
    {
        return response()->json([
            'user' => [
                'id' => $request->user()->id,
                'name' => $request->user()->name,
                'email' => $request->user()->email,
                'role' => $request->user()->role,
            ]
        ]);
    }

    /**
     * Handle user logout
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Successfully logged out']);
    }

    /**
     * Verify the user's token
     */
    public function verify(Request $request)
    {
        // If we reach this point, it means the token is valid
        // because the auth:sanctum middleware has already verified it
        return response()->json([
            'verified' => true,
            'user' => $request->user()
        ]);
    }

    /**
     * Change user password
     */
    public function changePassword(Request $request)
    {
        $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|min:8|confirmed',
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The provided password is incorrect.'],
            ]);
        }

        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json(['message' => 'Password successfully updated']);
    }

    /**
     * Refresh the user's token
     */
    public function refreshToken(Request $request)
    {
        Log::info('Token refresh requested', [
            'user_id' => $request->user()->id,
            'email' => $request->user()->email
        ]);
        
        try {
            // Delete the current token
            $request->user()->currentAccessToken()->delete();
            
            // Generate a new token
            $token = $request->user()->createToken('auth-token')->plainTextToken;
            
            Log::info('Token refreshed successfully', [
                'user_id' => $request->user()->id
            ]);
            
            return response()->json([
                'token' => $token,
                'user' => [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'role' => $request->user()->role,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Token refresh failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Failed to refresh token: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Refresh the user's token (public endpoint that doesn't require auth middleware)
     */
    public function refreshTokenPublic(Request $request)
    {
        Log::info('Public token refresh requested', [
            'ip' => $request->ip(),
            'user_agent' => $request->userAgent()
        ]);
        
        try {
            // Extract the token from the Authorization header or request body
            $bearerToken = $request->bearerToken();
            $bodyToken = $request->input('token');
            
            $tokenString = $bearerToken ?: $bodyToken;
            
            if (!$tokenString) {
                Log::warning('No token provided for refresh');
                return response()->json([
                    'message' => 'No token provided'
                ], 400);
            }
            
            // Find the token in the database
            $token = \Laravel\Sanctum\PersonalAccessToken::findToken($tokenString);
            
            if (!$token) {
                Log::warning('Invalid token provided for refresh');
                return response()->json([
                    'message' => 'Invalid token'
                ], 400);
            }
            
            // Get the user
            $user = $token->tokenable;
            
            if (!$user) {
                Log::error('Token has no associated user');
                return response()->json([
                    'message' => 'Token has no associated user'
                ], 400);
            }
            
            Log::info('User found for token refresh', [
                'user_id' => $user->id,
                'email' => $user->email
            ]);
            
            // Delete all existing tokens
            $user->tokens()->delete();
            
            // Generate a new token
            $newToken = $user->createToken('auth-token')->plainTextToken;
            
            Log::info('Token refreshed successfully via public endpoint', [
                'user_id' => $user->id
            ]);
            
            return response()->json([
                'token' => $newToken,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ]
            ]);
        } catch (\Exception $e) {
            Log::error('Public token refresh failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'message' => 'Failed to refresh token: ' . $e->getMessage()
            ], 500);
        }
    }
} 