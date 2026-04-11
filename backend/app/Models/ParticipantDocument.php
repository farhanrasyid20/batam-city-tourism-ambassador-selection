<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
/**
 * Eloquent model representing a domain entity.
 * Defines persistence rules, casting, and relationships for this resource.
 */

class ParticipantDocument extends Model
{
    protected $fillable = [
        'user_id',
        'document_key',
        'label',
        'is_required',
        'status',
        'original_name',
        'size_bytes',
        'mime_type',
        'path',
        'url',
        'note',
        'uploaded_at',
    ];

    protected function casts(): array
    {
        return [
            'is_required' => 'boolean',
            'size_bytes' => 'integer',
            'uploaded_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

