<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // First, add the is_published column
        Schema::table('news', function (Blueprint $table) {
            $table->boolean('is_published')->default(false);
        });
        
        // Then, copy data from published to is_published
        if (Schema::hasColumn('news', 'published')) {
            DB::statement('UPDATE news SET is_published = published');
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('news', function (Blueprint $table) {
            $table->dropColumn('is_published');
        });
    }
}; 