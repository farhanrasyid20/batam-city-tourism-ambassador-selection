<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ParticipantRegistration extends Model
{
    protected $fillable = ['edition_id', 'user_id', 'status', 'participant_number', 'audition_number', 'participant_code', 'gender', 'selection_status', 'selection_status_note', 'selection_status_updated_at', 'admin_score_adjustment', 'admin_score_adjustment_note', 'admin_score_adjustment_updated_at', 'admin_score_adjustment_updated_by_user_id', 'eliminated_in_audition', 'eliminated_at', 'biodata_snapshot', 'submitted_at'];

    protected function casts(): array
    {
        return ['selection_status_updated_at' => 'datetime', 'admin_score_adjustment' => 'decimal:2', 'admin_score_adjustment_updated_at' => 'datetime', 'eliminated_in_audition' => 'boolean', 'eliminated_at' => 'datetime', 'biodata_snapshot' => 'array', 'submitted_at' => 'datetime'];
    }

    public function edition(): BelongsTo { return $this->belongsTo(CompetitionEdition::class, 'edition_id'); }
    public function user(): BelongsTo { return $this->belongsTo(User::class); }
}
