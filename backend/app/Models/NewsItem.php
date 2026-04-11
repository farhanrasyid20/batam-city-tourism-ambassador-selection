<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
/**
 * Eloquent model representing a domain entity.
 * Defines persistence rules, casting, and relationships for this resource.
 */

class NewsItem extends Model
{
    protected $fillable = [
        'title',
        'image',
        'date',
        'category',
        'excerpt',
        'content_html',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
        ];
    }
}
