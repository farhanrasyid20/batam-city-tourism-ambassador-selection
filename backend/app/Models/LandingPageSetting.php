<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LandingPageSetting extends Model
{
    protected $fillable = [
        'content',
        'updated_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'content' => 'array',
        ];
    }
}
