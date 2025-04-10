<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Partner extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'logo_url',
        'website_url',
        'description',
    ];

    /**
     * Get the projects associated with the partner.
     */
    public function projects()
    {
        return $this->belongsToMany(Project::class, 'project_partner');
    }
} 