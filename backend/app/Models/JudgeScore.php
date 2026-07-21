<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
/**
 * Eloquent model representing a domain entity.
 * Defines persistence rules, casting, and relationships for this resource.
 */

class JudgeScore extends Model
{
    protected $fillable = [
        'edition_id',
        'participant_id',
        'participant_name',
        'judge_user_id',
        'stage',
        'score_type',
        'score',
        'total_score',
        'note',
        'submitted_at',
    ];

    protected $casts = [
        'score' => 'array',
        'total_score' => 'decimal:2',
        'submitted_at' => 'datetime',
    ];

    public function judge(): BelongsTo
    {
        return $this->belongsTo(User::class, 'judge_user_id');
    }

    public function details(): HasMany
    {
        return $this->hasMany(JudgeScoreDetail::class, 'judge_score_id');
    }
}
