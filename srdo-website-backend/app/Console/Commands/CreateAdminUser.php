<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class CreateAdminUser extends Command
{
    protected $signature = 'admin:create';
    protected $description = 'Create or update the admin user';

    public function handle()
    {
        $this->info('Creating/Updating admin user...');

        // Get admin credentials from command line or use defaults
        $email = $this->ask('Admin email?', 'your-production-admin@example.com');
        $password = $this->secret('Admin password?');
        
        if (empty($password)) {
            $password = bin2hex(random_bytes(8)); // Generate secure random password if none provided
            $this->warn('No password provided. Generated a secure random password.');
        }

        $user = User::updateOrCreate(
            ['email' => $email],
            [
                'name' => 'Admin',
                'password' => Hash::make($password),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]
        );

        $this->info('Admin user created/updated successfully!');
        $this->info("Email: {$email}");
        
        if ($this->confirm('Display password? (Only do this in a secure environment)')) {
            $this->info("Password: {$password}");
        } else {
            $this->info('Password was set but not displayed for security reasons.');
        }
    }
} 