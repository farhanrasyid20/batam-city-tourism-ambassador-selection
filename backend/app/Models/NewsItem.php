<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
