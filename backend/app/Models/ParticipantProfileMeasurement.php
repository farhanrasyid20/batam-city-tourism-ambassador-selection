<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
/**
 * Eloquent model representing a domain entity.
 * Defines persistence rules, casting, and relationships for this resource.
 */

class ParticipantProfileMeasurement extends Model
{
    protected $fillable = [
        'participant_profile_id',
        'height_cm',
        'weight_kg',
        'shirt_size',
        'chest_circumference_cm',
        'waist_circumference_cm',
        'hip_circumference_cm',
        'pants_size',
        'shoe_size',
    ];

    protected function casts(): array
    {
        return [
            'height_cm' => 'integer',
        ];
    }

    public function profile(): BelongsTo
    {
        return $this->belongsTo(ParticipantProfile::class, 'participant_profile_id');
    }
}
