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
        'audition_number',
        'participant_code',
        'gender',
        'nickname',
        'religion',
        'national_id',
        'current_status',
        'birth_place',
        'birth_date',
        'domicile_address',
        'ktp_address',
        'height_cm',
        'weight_kg',
        'shirt_size',
        'chest_circumference_cm',
        'waist_circumference_cm',
        'hip_circumference_cm',
        'pants_size',
        'shoe_size',
        'instagram',
        'tiktok',
        'parent_phone',
        'father_name',
        'mother_name',
        'photo',
        'education_category',
        'education_institution',
        'education_major',
        'education_degree',
        'occupation',
        'skills',
        'hobbies',
        'languages',
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
        'selection_status',
        'selection_status_note',
        'selection_status_updated_at',
        'eliminated_in_audition',
        'eliminated_at',
    ];

    protected function casts(): array
    {
        return [
            'birth_date' => 'date',
            'height_cm' => 'integer',
            'submitted_to_admin' => 'boolean',
            'submitted_to_admin_at' => 'datetime',
            'selection_status_updated_at' => 'datetime',
            'eliminated_in_audition' => 'boolean',
            'eliminated_at' => 'datetime',
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
