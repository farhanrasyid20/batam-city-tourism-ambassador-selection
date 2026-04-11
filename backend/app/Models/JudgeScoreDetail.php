<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
/**
 * Eloquent model representing a domain entity.
 * Defines persistence rules, casting, and relationships for this resource.
 */

class JudgeScoreDetail extends Model
{
    protected $fillable = [
        'judge_score_id',
        'participant_id',
        'judge_user_id',
        'stage',
        'score_type',
        'criterion_key',
        'criterion_weight',
        'criterion_value',
        'weighted_value',
        'submitted_at',
    ];

    protected $casts = [
        'criterion_weight' => 'decimal:2',
        'criterion_value' => 'decimal:2',
        'weighted_value' => 'decimal:2',
        'submitted_at' => 'datetime',
    ];

    public function judgeScore(): BelongsTo
    {
        return $this->belongsTo(JudgeScore::class, 'judge_score_id');
    }
}

