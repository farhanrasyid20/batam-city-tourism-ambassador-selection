<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
/**
 * Eloquent model representing a domain entity.
 * Defines persistence rules, casting, and relationships for this resource.
 */

class PublicVoteCandidateSetting extends Model
{
    protected $fillable = [
        'edition_id',
        'participant_user_id',
        'publication_photo',
        'instagram_profile_url',
        'instagram_post_url',
        'official_like_count',
        'like_updated_at',
        'is_enabled',
        'updated_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'official_like_count' => 'integer',
            'is_enabled' => 'boolean',
            'like_updated_at' => 'datetime',
        ];
    }

    public function participant(): BelongsTo
    {
        return $this->belongsTo(User::class, 'participant_user_id');
    }
}
