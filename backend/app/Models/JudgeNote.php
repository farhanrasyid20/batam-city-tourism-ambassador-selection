<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
/**
 * Eloquent model representing a domain entity.
 * Defines persistence rules, casting, and relationships for this resource.
 */

class JudgeNote extends Model
{
    protected $fillable = [
        'edition_id',
        'participant_id',
        'participant_name',
        'author_user_id',
        'author_name_override',
        'stage',
        'author_role',
        'content',
        'created_at_note',
    ];

    protected $casts = [
        'created_at_note' => 'datetime',
    ];

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_user_id');
    }
}
