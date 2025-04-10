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
        Schema::table('comments', function (Blueprint $table) {
            // First drop the foreign key constraint
            $table->dropForeign(['user_id']);
            
            // Then modify the user_id column to be nullable
            $table->unsignedBigInteger('user_id')->nullable()->change();
            
            // Re-add the foreign key constraint with onDelete('cascade')
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            
            // Add guest_name column if it doesn't exist
            if (!Schema::hasColumn('comments', 'guest_name')) {
                $table->string('guest_name')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('comments', function (Blueprint $table) {
            // Drop the foreign key constraint
            $table->dropForeign(['user_id']);
            
            // Make user_id required again
            $table->unsignedBigInteger('user_id')->nullable(false)->change();
            
            // Re-add the foreign key constraint
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            
            // Drop guest_name column if it exists
            if (Schema::hasColumn('comments', 'guest_name')) {
                $table->dropColumn('guest_name');
            }
        });
    }
};
