<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ParticipantProfile extends Model
{
    protected $fillable = [
        'user_id',
        'participant_number',
        'gender',
        'national_id',
        'birth_place',
        'birth_date',
        'height_cm',
        'instagram',
        'photo',
        'education_category',
        'education_institution',
        'education_major',
        'education_degree',
        'vision',
        'mission',
        'experience',
        'achievement',
        'intro_video_url',
        'agreement_no_agency',
        'agency_name',
        'agreement_parent_permission',
        'agreement_all_stages',
        'motivation_statement',
        'contribution_idea',
        'public_speaking_experience',
        'submitted_to_admin',
        'submitted_to_admin_at',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'height_cm' => 'integer',
            'submitted_to_admin' => 'boolean',
            'submitted_to_admin_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ParticipantDocument::class, 'user_id', 'user_id');
    }
}

