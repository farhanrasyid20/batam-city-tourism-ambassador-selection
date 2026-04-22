<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
/**
 * Eloquent model representing a domain entity.
 * Defines persistence rules, casting, and relationships for this resource.
 */

class ParticipantProfileBackground extends Model
{
    protected $fillable = [
        'participant_profile_id',
        'education_category',
        'education_institution',
        'education_major',
        'education_degree',
        'occupation',
        'skills',
        'hobbies',
        'languages',
    ];

    public function profile(): BelongsTo
    {
        return $this->belongsTo(ParticipantProfile::class, 'participant_profile_id');
    }
}
