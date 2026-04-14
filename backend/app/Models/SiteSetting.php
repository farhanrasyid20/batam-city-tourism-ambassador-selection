<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Eloquent model representing a domain entity.
 * Defines persistence rules, casting, and relationships for this resource.
 */
class SiteSetting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'updated_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'array',
        ];
    }
}

