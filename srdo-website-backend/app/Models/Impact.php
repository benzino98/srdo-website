<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Impact extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'project_id',
        'title',
        'description',
        'value',
        'icon',
    ];

    /**
     * Get the project that owns the impact.
     */
    public function project()
    {
        return $this->belongsTo(Project::class);
    }
} 