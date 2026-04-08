<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ParticipantResourceSetting extends Model
{
    protected $fillable = [
        'resources',
        'updated_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'resources' => 'array',
        ];
    }
}

