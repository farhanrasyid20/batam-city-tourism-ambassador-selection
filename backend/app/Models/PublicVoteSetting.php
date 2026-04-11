<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
/**
 * Eloquent model representing a domain entity.
 * Defines persistence rules, casting, and relationships for this resource.
 */

class PublicVoteSetting extends Model
{
    protected $fillable = [
        'vote_top_published',
        'vote_ranking_published',
        'judge_encik_published',
        'judge_puan_published',
        'judge_pair_published',
        'judge_encik_display_mode',
        'judge_puan_display_mode',
        'judge_encik_winners',
        'judge_puan_winners',
        'judge_pair_rankings',
        'updated_by_user_id',
    ];

    protected function casts(): array
    {
        return [
            'vote_top_published' => 'boolean',
            'vote_ranking_published' => 'boolean',
            'judge_encik_published' => 'boolean',
            'judge_puan_published' => 'boolean',
            'judge_pair_published' => 'boolean',
            'judge_encik_winners' => 'array',
            'judge_puan_winners' => 'array',
            'judge_pair_rankings' => 'array',
        ];
    }
}
