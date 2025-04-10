<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('resources', function (Blueprint $table) {
            // Add file_path column
            $table->string('file_path')->nullable()->after('file_url');
            
            // Modify file_size to store bytes as bigInteger
            $table->dropColumn('file_size');
            $table->bigInteger('file_size')->nullable()->after('file_type');
            
            // Add file_name column if it doesn't exist
            if (!Schema::hasColumn('resources', 'file_name')) {
                $table->string('file_name')->nullable()->after('file_path');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('resources', function (Blueprint $table) {
            // Revert file_size back to string
            $table->dropColumn('file_size');
            $table->string('file_size')->nullable();
            
            // Remove the new columns
            $table->dropColumn('file_path');
            if (Schema::hasColumn('resources', 'file_name')) {
                $table->dropColumn('file_name');
            }
        });
    }
};
