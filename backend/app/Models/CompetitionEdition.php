<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CompetitionEdition extends Model
{
    protected $fillable = ['year', 'name', 'status', 'is_active', 'registration_start_at', 'registration_end_at', 'registration_reopened_at', 'registration_reopen_reason'];

    protected function casts(): array
    {
        return ['year' => 'integer', 'is_active' => 'boolean', 'registration_start_at' => 'datetime', 'registration_end_at' => 'datetime', 'registration_reopened_at' => 'datetime'];
    }

    public function registrations(): HasMany
    {
        return $this->hasMany(ParticipantRegistration::class, 'edition_id');
    }

    public function registrationIsOpen(): bool
    {
        if ($this->status !== 'registration_open') return false;
        if ($this->registration_start_at && now()->isBefore($this->registration_start_at)) return false;
        if ($this->registration_end_at && now()->isAfter($this->registration_end_at)) return false;
        return true;
    }

    public static function active(): ?self
    {
        return static::query()->where('is_active', true)->first();
    }
}
