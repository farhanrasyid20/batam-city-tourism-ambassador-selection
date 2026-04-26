<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
/**
 * Eloquent model representing a domain entity.
 * Defines persistence rules, casting, and relationships for this resource.
 */

class ParticipantProfileStatement extends Model
{
    protected $fillable = [
        'participant_profile_id',
        'vision',
        'mission',
        'experience',
        'achievement',
        'agreement_no_agency',
        'agency_name',
        'agreement_parent_permission',
        'agreement_all_stages',
        'motivation_statement',
        'contribution_idea',
        'public_speaking_experience',
    ];

    public function profile(): BelongsTo
    {
        return $this->belongsTo(ParticipantProfile::class, 'participant_profile_id');
    }
}
