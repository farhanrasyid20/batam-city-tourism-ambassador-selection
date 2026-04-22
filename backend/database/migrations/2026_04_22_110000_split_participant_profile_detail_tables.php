<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('participant_profile_identities')) {
            Schema::create('participant_profile_identities', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('participant_profile_id')
                    ->unique()
                    ->constrained('participant_profiles')
                    ->cascadeOnDelete();
                $table->string('nickname', 120)->nullable();
                $table->string('religion', 80)->nullable();
                $table->string('national_id', 30)->nullable();
                $table->string('current_status', 50)->nullable();
                $table->string('birth_place', 120)->nullable();
                $table->date('birth_date')->nullable();
                $table->text('domicile_address')->nullable();
                $table->text('ktp_address')->nullable();
                $table->string('instagram', 255)->nullable();
                $table->string('tiktok', 255)->nullable();
                $table->string('parent_phone', 40)->nullable();
                $table->string('father_name', 255)->nullable();
                $table->string('mother_name', 255)->nullable();
                $table->text('photo')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('participant_profile_measurements')) {
            Schema::create('participant_profile_measurements', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('participant_profile_id')
                    ->unique()
                    ->constrained('participant_profiles')
                    ->cascadeOnDelete();
                $table->unsignedSmallInteger('height_cm')->nullable();
                $table->string('weight_kg', 30)->nullable();
                $table->string('shirt_size', 30)->nullable();
                $table->string('chest_circumference_cm', 30)->nullable();
                $table->string('waist_circumference_cm', 30)->nullable();
                $table->string('hip_circumference_cm', 30)->nullable();
                $table->string('pants_size', 30)->nullable();
                $table->string('shoe_size', 30)->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('participant_profile_backgrounds')) {
            Schema::create('participant_profile_backgrounds', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('participant_profile_id')
                    ->unique()
                    ->constrained('participant_profiles')
                    ->cascadeOnDelete();
                $table->string('education_category', 30)->nullable();
                $table->string('education_institution', 255)->nullable();
                $table->string('education_major', 255)->nullable();
                $table->string('education_degree', 30)->nullable();
                $table->string('occupation', 255)->nullable();
                $table->text('skills')->nullable();
                $table->text('hobbies')->nullable();
                $table->text('languages')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('participant_profile_statements')) {
            Schema::create('participant_profile_statements', function (Blueprint $table): void {
                $table->id();
                $table->foreignId('participant_profile_id')
                    ->unique()
                    ->constrained('participant_profiles')
                    ->cascadeOnDelete();
                $table->text('vision')->nullable();
                $table->text('mission')->nullable();
                $table->text('experience')->nullable();
                $table->text('achievement')->nullable();
                $table->string('intro_video_url', 500)->nullable();
                $table->string('agreement_no_agency', 10)->nullable();
                $table->string('agency_name', 255)->nullable();
                $table->string('agreement_parent_permission', 10)->nullable();
                $table->string('agreement_all_stages', 10)->nullable();
                $table->text('motivation_statement')->nullable();
                $table->text('contribution_idea')->nullable();
                $table->text('public_speaking_experience')->nullable();
                $table->timestamps();
            });
        }

        $detailColumns = [
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
            'intro_video_url',
            'agreement_no_agency',
            'agency_name',
            'agreement_parent_permission',
            'agreement_all_stages',
            'motivation_statement',
            'contribution_idea',
            'public_speaking_experience',
        ];

        if (Schema::hasTable('participant_profiles')) {
            $existingDetailColumns = array_values(array_filter(
                $detailColumns,
                static fn (string $column): bool => Schema::hasColumn('participant_profiles', $column)
            ));

            if (! empty($existingDetailColumns)) {
                DB::table('participant_profiles')
                    ->select(array_merge(['id', 'created_at', 'updated_at'], $existingDetailColumns))
                    ->orderBy('id')
                    ->chunkById(200, function ($profiles): void {
                        foreach ($profiles as $profile) {
                            $createdAt = $profile->created_at ?? now();
                            $updatedAt = $profile->updated_at ?? now();

                            DB::table('participant_profile_identities')->updateOrInsert(
                                ['participant_profile_id' => $profile->id],
                                [
                                    'nickname' => $profile->nickname ?? null,
                                    'religion' => $profile->religion ?? null,
                                    'national_id' => $profile->national_id ?? null,
                                    'current_status' => $profile->current_status ?? null,
                                    'birth_place' => $profile->birth_place ?? null,
                                    'birth_date' => $profile->birth_date ?? null,
                                    'domicile_address' => $profile->domicile_address ?? null,
                                    'ktp_address' => $profile->ktp_address ?? null,
                                    'instagram' => $profile->instagram ?? null,
                                    'tiktok' => $profile->tiktok ?? null,
                                    'parent_phone' => $profile->parent_phone ?? null,
                                    'father_name' => $profile->father_name ?? null,
                                    'mother_name' => $profile->mother_name ?? null,
                                    'photo' => $profile->photo ?? null,
                                    'created_at' => $createdAt,
                                    'updated_at' => $updatedAt,
                                ]
                            );

                            DB::table('participant_profile_measurements')->updateOrInsert(
                                ['participant_profile_id' => $profile->id],
                                [
                                    'height_cm' => $profile->height_cm ?? null,
                                    'weight_kg' => $profile->weight_kg ?? null,
                                    'shirt_size' => $profile->shirt_size ?? null,
                                    'chest_circumference_cm' => $profile->chest_circumference_cm ?? null,
                                    'waist_circumference_cm' => $profile->waist_circumference_cm ?? null,
                                    'hip_circumference_cm' => $profile->hip_circumference_cm ?? null,
                                    'pants_size' => $profile->pants_size ?? null,
                                    'shoe_size' => $profile->shoe_size ?? null,
                                    'created_at' => $createdAt,
                                    'updated_at' => $updatedAt,
                                ]
                            );

                            DB::table('participant_profile_backgrounds')->updateOrInsert(
                                ['participant_profile_id' => $profile->id],
                                [
                                    'education_category' => $profile->education_category ?? null,
                                    'education_institution' => $profile->education_institution ?? null,
                                    'education_major' => $profile->education_major ?? null,
                                    'education_degree' => $profile->education_degree ?? null,
                                    'occupation' => $profile->occupation ?? null,
                                    'skills' => $profile->skills ?? null,
                                    'hobbies' => $profile->hobbies ?? null,
                                    'languages' => $profile->languages ?? null,
                                    'created_at' => $createdAt,
                                    'updated_at' => $updatedAt,
                                ]
                            );

                            DB::table('participant_profile_statements')->updateOrInsert(
                                ['participant_profile_id' => $profile->id],
                                [
                                    'vision' => $profile->vision ?? null,
                                    'mission' => $profile->mission ?? null,
                                    'experience' => $profile->experience ?? null,
                                    'achievement' => $profile->achievement ?? null,
                                    'intro_video_url' => $profile->intro_video_url ?? null,
                                    'agreement_no_agency' => $profile->agreement_no_agency ?? null,
                                    'agency_name' => $profile->agency_name ?? null,
                                    'agreement_parent_permission' => $profile->agreement_parent_permission ?? null,
                                    'agreement_all_stages' => $profile->agreement_all_stages ?? null,
                                    'motivation_statement' => $profile->motivation_statement ?? null,
                                    'contribution_idea' => $profile->contribution_idea ?? null,
                                    'public_speaking_experience' => $profile->public_speaking_experience ?? null,
                                    'created_at' => $createdAt,
                                    'updated_at' => $updatedAt,
                                ]
                            );
                        }
                    }, 'id');

                Schema::table('participant_profiles', function (Blueprint $table) use ($existingDetailColumns): void {
                    $table->dropColumn($existingDetailColumns);
                });
            }
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('participant_profiles')) {
            Schema::table('participant_profiles', function (Blueprint $table): void {
                if (! Schema::hasColumn('participant_profiles', 'nickname')) {
                    $table->string('nickname', 120)->nullable()->after('gender');
                }
                if (! Schema::hasColumn('participant_profiles', 'religion')) {
                    $table->string('religion', 80)->nullable()->after('nickname');
                }
                if (! Schema::hasColumn('participant_profiles', 'national_id')) {
                    $table->string('national_id', 30)->nullable()->after('religion');
                }
                if (! Schema::hasColumn('participant_profiles', 'current_status')) {
                    $table->string('current_status', 50)->nullable()->after('national_id');
                }
                if (! Schema::hasColumn('participant_profiles', 'birth_place')) {
                    $table->string('birth_place', 120)->nullable()->after('current_status');
                }
                if (! Schema::hasColumn('participant_profiles', 'birth_date')) {
                    $table->date('birth_date')->nullable()->after('birth_place');
                }
                if (! Schema::hasColumn('participant_profiles', 'domicile_address')) {
                    $table->text('domicile_address')->nullable()->after('birth_date');
                }
                if (! Schema::hasColumn('participant_profiles', 'ktp_address')) {
                    $table->text('ktp_address')->nullable()->after('domicile_address');
                }
                if (! Schema::hasColumn('participant_profiles', 'height_cm')) {
                    $table->unsignedSmallInteger('height_cm')->nullable()->after('ktp_address');
                }
                if (! Schema::hasColumn('participant_profiles', 'weight_kg')) {
                    $table->string('weight_kg', 30)->nullable()->after('height_cm');
                }
                if (! Schema::hasColumn('participant_profiles', 'shirt_size')) {
                    $table->string('shirt_size', 30)->nullable()->after('weight_kg');
                }
                if (! Schema::hasColumn('participant_profiles', 'chest_circumference_cm')) {
                    $table->string('chest_circumference_cm', 30)->nullable()->after('shirt_size');
                }
                if (! Schema::hasColumn('participant_profiles', 'waist_circumference_cm')) {
                    $table->string('waist_circumference_cm', 30)->nullable()->after('chest_circumference_cm');
                }
                if (! Schema::hasColumn('participant_profiles', 'hip_circumference_cm')) {
                    $table->string('hip_circumference_cm', 30)->nullable()->after('waist_circumference_cm');
                }
                if (! Schema::hasColumn('participant_profiles', 'pants_size')) {
                    $table->string('pants_size', 30)->nullable()->after('hip_circumference_cm');
                }
                if (! Schema::hasColumn('participant_profiles', 'shoe_size')) {
                    $table->string('shoe_size', 30)->nullable()->after('pants_size');
                }
                if (! Schema::hasColumn('participant_profiles', 'instagram')) {
                    $table->string('instagram', 255)->nullable()->after('shoe_size');
                }
                if (! Schema::hasColumn('participant_profiles', 'tiktok')) {
                    $table->string('tiktok', 255)->nullable()->after('instagram');
                }
                if (! Schema::hasColumn('participant_profiles', 'parent_phone')) {
                    $table->string('parent_phone', 40)->nullable()->after('tiktok');
                }
                if (! Schema::hasColumn('participant_profiles', 'father_name')) {
                    $table->string('father_name', 255)->nullable()->after('parent_phone');
                }
                if (! Schema::hasColumn('participant_profiles', 'mother_name')) {
                    $table->string('mother_name', 255)->nullable()->after('father_name');
                }
                if (! Schema::hasColumn('participant_profiles', 'photo')) {
                    $table->text('photo')->nullable()->after('mother_name');
                }
                if (! Schema::hasColumn('participant_profiles', 'education_category')) {
                    $table->string('education_category', 30)->nullable()->after('photo');
                }
                if (! Schema::hasColumn('participant_profiles', 'education_institution')) {
                    $table->string('education_institution', 255)->nullable()->after('education_category');
                }
                if (! Schema::hasColumn('participant_profiles', 'education_major')) {
                    $table->string('education_major', 255)->nullable()->after('education_institution');
                }
                if (! Schema::hasColumn('participant_profiles', 'education_degree')) {
                    $table->string('education_degree', 30)->nullable()->after('education_major');
                }
                if (! Schema::hasColumn('participant_profiles', 'occupation')) {
                    $table->string('occupation', 255)->nullable()->after('education_degree');
                }
                if (! Schema::hasColumn('participant_profiles', 'skills')) {
                    $table->text('skills')->nullable()->after('occupation');
                }
                if (! Schema::hasColumn('participant_profiles', 'hobbies')) {
                    $table->text('hobbies')->nullable()->after('skills');
                }
                if (! Schema::hasColumn('participant_profiles', 'languages')) {
                    $table->text('languages')->nullable()->after('hobbies');
                }
                if (! Schema::hasColumn('participant_profiles', 'vision')) {
                    $table->text('vision')->nullable()->after('languages');
                }
                if (! Schema::hasColumn('participant_profiles', 'mission')) {
                    $table->text('mission')->nullable()->after('vision');
                }
                if (! Schema::hasColumn('participant_profiles', 'experience')) {
                    $table->text('experience')->nullable()->after('mission');
                }
                if (! Schema::hasColumn('participant_profiles', 'achievement')) {
                    $table->text('achievement')->nullable()->after('experience');
                }
                if (! Schema::hasColumn('participant_profiles', 'intro_video_url')) {
                    $table->string('intro_video_url', 500)->nullable()->after('achievement');
                }
                if (! Schema::hasColumn('participant_profiles', 'agreement_no_agency')) {
                    $table->string('agreement_no_agency', 10)->nullable()->after('intro_video_url');
                }
                if (! Schema::hasColumn('participant_profiles', 'agency_name')) {
                    $table->string('agency_name', 255)->nullable()->after('agreement_no_agency');
                }
                if (! Schema::hasColumn('participant_profiles', 'agreement_parent_permission')) {
                    $table->string('agreement_parent_permission', 10)->nullable()->after('agency_name');
                }
                if (! Schema::hasColumn('participant_profiles', 'agreement_all_stages')) {
                    $table->string('agreement_all_stages', 10)->nullable()->after('agreement_parent_permission');
                }
                if (! Schema::hasColumn('participant_profiles', 'motivation_statement')) {
                    $table->text('motivation_statement')->nullable()->after('agreement_all_stages');
                }
                if (! Schema::hasColumn('participant_profiles', 'contribution_idea')) {
                    $table->text('contribution_idea')->nullable()->after('motivation_statement');
                }
                if (! Schema::hasColumn('participant_profiles', 'public_speaking_experience')) {
                    $table->text('public_speaking_experience')->nullable()->after('contribution_idea');
                }
            });

            DB::table('participant_profiles')
                ->select('id')
                ->orderBy('id')
                ->chunkById(200, function ($profiles): void {
                    $profileIds = collect($profiles)->pluck('id')->all();
                    if (empty($profileIds)) {
                        return;
                    }

                    $identityMap = DB::table('participant_profile_identities')
                        ->whereIn('participant_profile_id', $profileIds)
                        ->get()
                        ->keyBy('participant_profile_id');

                    $measurementMap = DB::table('participant_profile_measurements')
                        ->whereIn('participant_profile_id', $profileIds)
                        ->get()
                        ->keyBy('participant_profile_id');

                    $backgroundMap = DB::table('participant_profile_backgrounds')
                        ->whereIn('participant_profile_id', $profileIds)
                        ->get()
                        ->keyBy('participant_profile_id');

                    $statementMap = DB::table('participant_profile_statements')
                        ->whereIn('participant_profile_id', $profileIds)
                        ->get()
                        ->keyBy('participant_profile_id');

                    foreach ($profileIds as $profileId) {
                        $identity = $identityMap->get($profileId);
                        $measurement = $measurementMap->get($profileId);
                        $background = $backgroundMap->get($profileId);
                        $statement = $statementMap->get($profileId);

                        DB::table('participant_profiles')
                            ->where('id', $profileId)
                            ->update([
                                'nickname' => $identity->nickname ?? null,
                                'religion' => $identity->religion ?? null,
                                'national_id' => $identity->national_id ?? null,
                                'current_status' => $identity->current_status ?? null,
                                'birth_place' => $identity->birth_place ?? null,
                                'birth_date' => $identity->birth_date ?? null,
                                'domicile_address' => $identity->domicile_address ?? null,
                                'ktp_address' => $identity->ktp_address ?? null,
                                'height_cm' => $measurement->height_cm ?? null,
                                'weight_kg' => $measurement->weight_kg ?? null,
                                'shirt_size' => $measurement->shirt_size ?? null,
                                'chest_circumference_cm' => $measurement->chest_circumference_cm ?? null,
                                'waist_circumference_cm' => $measurement->waist_circumference_cm ?? null,
                                'hip_circumference_cm' => $measurement->hip_circumference_cm ?? null,
                                'pants_size' => $measurement->pants_size ?? null,
                                'shoe_size' => $measurement->shoe_size ?? null,
                                'instagram' => $identity->instagram ?? null,
                                'tiktok' => $identity->tiktok ?? null,
                                'parent_phone' => $identity->parent_phone ?? null,
                                'father_name' => $identity->father_name ?? null,
                                'mother_name' => $identity->mother_name ?? null,
                                'photo' => $identity->photo ?? null,
                                'education_category' => $background->education_category ?? null,
                                'education_institution' => $background->education_institution ?? null,
                                'education_major' => $background->education_major ?? null,
                                'education_degree' => $background->education_degree ?? null,
                                'occupation' => $background->occupation ?? null,
                                'skills' => $background->skills ?? null,
                                'hobbies' => $background->hobbies ?? null,
                                'languages' => $background->languages ?? null,
                                'vision' => $statement->vision ?? null,
                                'mission' => $statement->mission ?? null,
                                'experience' => $statement->experience ?? null,
                                'achievement' => $statement->achievement ?? null,
                                'intro_video_url' => $statement->intro_video_url ?? null,
                                'agreement_no_agency' => $statement->agreement_no_agency ?? null,
                                'agency_name' => $statement->agency_name ?? null,
                                'agreement_parent_permission' => $statement->agreement_parent_permission ?? null,
                                'agreement_all_stages' => $statement->agreement_all_stages ?? null,
                                'motivation_statement' => $statement->motivation_statement ?? null,
                                'contribution_idea' => $statement->contribution_idea ?? null,
                                'public_speaking_experience' => $statement->public_speaking_experience ?? null,
                            ]);
                    }
                }, 'id');
        }

        Schema::dropIfExists('participant_profile_statements');
        Schema::dropIfExists('participant_profile_backgrounds');
        Schema::dropIfExists('participant_profile_measurements');
        Schema::dropIfExists('participant_profile_identities');
    }
};
