<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
/**
 * Eloquent model representing a domain entity.
 * Defines persistence rules, casting, and relationships for this resource.
 */

class PasswordResetOtp extends Model
{
    protected $fillable = [
        'user_id',
        'email',
        'otp_hash',
        'attempt_count',
        'resend_count',
        'last_sent_at',
        'expires_at',
        'used_at',
    ];

    protected function casts(): array
    {
        return [
            'last_sent_at' => 'datetime',
            'expires_at' => 'datetime',
            'used_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}

