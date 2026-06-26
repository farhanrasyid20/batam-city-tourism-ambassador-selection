<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class JudgeScoreRevision extends Model
{
    protected $fillable = ['judge_score_id', 'edition_id', 'actor_user_id', 'old_score', 'old_total_score', 'old_note', 'reason', 'revised_at'];
    protected function casts(): array { return ['old_score' => 'array', 'old_total_score' => 'decimal:2', 'revised_at' => 'datetime']; }
}
