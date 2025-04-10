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

        $user = User::updateOrCreate(
            ['email' => 'admin@srdo.org'],
            [
                'name' => 'Admin',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]
        );

        $this->info('Admin user created/updated successfully!');
        $this->info('Email: admin@srdo.org');
        $this->info('Password: admin123');
    }
} 