<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Resource extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'title',
        'description',
        'file_url',
        'file_type',
        'file_size',
        'category',
        'is_published',
        'published',
        'published_at',
        'download_count',
        'user_id',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'published' => 'boolean',
        'is_published' => 'boolean',
        'download_count' => 'integer',
        'published_at' => 'datetime',
        'file_size' => 'integer',
    ];

    /**
     * Get the user that uploaded the resource.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
} 