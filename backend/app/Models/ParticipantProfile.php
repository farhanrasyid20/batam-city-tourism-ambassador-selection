<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
/**
 * Eloquent model representing a domain entity.
 * Defines persistence rules, casting, and relationships for this resource.
 */

class ParticipantProfile extends Model
{
    /**
     * @var array<string, array<int, string>>
     */
    private const SEGMENT_RELATION_FIELDS = [
        'identity' => [
            'nickname',
            'religion',
            'national_id',
            'current_status',
            'birth_place',
            'birth_date',
            'domicile_address',
            'ktp_address',
            'instagram',
            'tiktok',
            'parent_phone',
            'father_name',
            'mother_name',
            'photo',
        ],
        'measurement' => [
            'height_cm',
            'weight_kg',
            'shirt_size',
            'chest_circumference_cm',
            'waist_circumference_cm',
            'hip_circumference_cm',
            'pants_size',
            'shoe_size',
        ],
        'background' => [
            'education_category',
            'education_institution',
            'education_major',
            'education_degree',
            'occupation',
            'skills',
            'hobbies',
            'languages',
        ],
        'statement' => [
            'vision',
            'mission',
            'experience',
            'achievement',
            'agreement_no_agency',
            'agency_name',
            'agreement_parent_permission',
            'agreement_all_stages',
            'motivation_statement',
            'contribution_idea',
            'public_speaking_experience',
        ],
    ];

    /**
     * @var array<string, array<string, mixed>>
     */
    private array $segmentPending = [];

    protected $fillable = [
        'user_id',
        'participant_number',
        'audition_number',
        'participant_code',
        'gender',
        'submitted_to_admin',
        'submitted_to_admin_at',
        'selection_status',
        'selection_status_note',
        'selection_status_updated_at',
        'admin_score_adjustment',
        'admin_score_adjustment_note',
        'admin_score_adjustment_updated_at',
        'admin_score_adjustment_updated_by_user_id',
        'eliminated_in_audition',
        'eliminated_at',
        // Detail fields now live in segmented tables.
        'nickname',
        'religion',
        'national_id',
        'current_status',
        'birth_place',
        'birth_date',
        'domicile_address',
        'ktp_address',
        'instagram',
        'tiktok',
        'parent_phone',
        'father_name',
        'mother_name',
        'photo',
        'height_cm',
        'weight_kg',
        'shirt_size',
        'chest_circumference_cm',
        'waist_circumference_cm',
        'hip_circumference_cm',
        'pants_size',
        'shoe_size',
        'education_category',
        'education_institution',
        'education_major',
        'education_degree',
        'occupation',
        'skills',
        'hobbies',
        'languages',
        'vision',
        'mission',
        'experience',
        'achievement',
        'agreement_no_agency',
        'agency_name',
        'agreement_parent_permission',
        'agreement_all_stages',
        'motivation_statement',
        'contribution_idea',
        'public_speaking_experience',
    ];

    protected function casts(): array
    {
        return [
            'submitted_to_admin' => 'boolean',
            'submitted_to_admin_at' => 'datetime',
            'selection_status_updated_at' => 'datetime',
            'admin_score_adjustment' => 'decimal:2',
            'admin_score_adjustment_updated_at' => 'datetime',
            'eliminated_in_audition' => 'boolean',
            'eliminated_at' => 'datetime',
        ];
    }

    public function getAttribute($key)
    {
        $relation = $this->segmentRelationForField((string) $key);
        if ($relation !== null && ! array_key_exists((string) $key, $this->attributes)) {
            if (array_key_exists((string) $key, $this->segmentPending[$relation] ?? [])) {
                return $this->segmentPending[$relation][(string) $key];
            }

            if (! $this->relationLoaded($relation)) {
                $this->setRelation($relation, $this->{$relation}()->first());
            }

            $related = $this->getRelation($relation);

            return $related?->getAttribute((string) $key);
        }

        return parent::getAttribute($key);
    }

    public function setAttribute($key, $value)
    {
        $relation = $this->segmentRelationForField((string) $key);
        if ($relation !== null && ! array_key_exists((string) $key, $this->attributes)) {
            $this->segmentPending[$relation][(string) $key] = $value;

            if ($this->relationLoaded($relation) && $this->getRelation($relation)) {
                $this->getRelation($relation)->setAttribute((string) $key, $value);
            }

            return $this;
        }

        return parent::setAttribute($key, $value);
    }

    public function save(array $options = []): bool
    {
        $saved = parent::save($options);
        if ($saved) {
            $this->syncSegmentAttributes();
        }

        return $saved;
    }

    private function syncSegmentAttributes(): void
    {
        if (empty($this->segmentPending) || ! $this->id) {
            return;
        }

        foreach ($this->segmentPending as $relation => $values) {
            if (! is_array($values) || empty($values)) {
                continue;
            }

            $allowed = self::SEGMENT_RELATION_FIELDS[$relation] ?? [];
            if (empty($allowed)) {
                continue;
            }

            $filtered = array_filter(
                $values,
                static fn ($field): bool => in_array((string) $field, $allowed, true),
                ARRAY_FILTER_USE_KEY
            );

            if (empty($filtered)) {
                continue;
            }

            $related = $this->{$relation}()->firstOrNew([]);
            $related->participant_profile_id = $this->id;
            $related->fill($filtered);
            $related->save();
            $this->setRelation($relation, $related);
        }

        $this->segmentPending = [];
    }

    private function segmentRelationForField(string $field): ?string
    {
        foreach (self::SEGMENT_RELATION_FIELDS as $relation => $fields) {
            if (in_array($field, $fields, true)) {
                return $relation;
            }
        }

        return null;
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function identity(): HasOne
    {
        return $this->hasOne(ParticipantProfileIdentity::class, 'participant_profile_id');
    }

    public function measurement(): HasOne
    {
        return $this->hasOne(ParticipantProfileMeasurement::class, 'participant_profile_id');
    }

    public function background(): HasOne
    {
        return $this->hasOne(ParticipantProfileBackground::class, 'participant_profile_id');
    }

    public function statement(): HasOne
    {
        return $this->hasOne(ParticipantProfileStatement::class, 'participant_profile_id');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ParticipantDocument::class, 'user_id', 'user_id');
    }
}
