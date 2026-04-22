<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
/**
 * Eloquent model representing a domain entity.
 * Defines persistence rules, casting, and relationships for this resource.
 */

class ParticipantProfileIdentity extends Model
{
    protected $fillable = [
        'participant_profile_id',
        'nickname',
        'religion',
        'national_id',
        'current_status',
        'birth_place',
        'birth_date',
        'domicile_address',
        'ktp_address',
        'instagram',
        'tiktok',
        'parent_phone',
        'father_name',
        'mother_name',
        'photo',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
        ];
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(ParticipantProfile::class, 'participant_profile_id');
    }
}
