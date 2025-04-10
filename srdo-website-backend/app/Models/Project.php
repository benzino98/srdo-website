<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Project extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'title',
        'slug',
        'description',
        'content',
        'status',
        'image_url',
        'start_date',
        'end_date',
        'location',
        'budget',
    ];

    /**
     * The attributes that should be visible in arrays.
     *
     * @var array<int, string>
     */
    protected $visible = [
        'id',
        'title',
        'slug',
        'description',
        'content',
        'status',
        'image_url',
        'start_date',
        'end_date',
        'location',
        'budget',
        'created_at',
        'updated_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'budget' => 'decimal:2',
    ];

    /**
     * Ensure content is never null
     */
    public function getContentAttribute($value)
    {
        // If content is empty, fall back to description
        return $value ?: $this->description;
    }
} 