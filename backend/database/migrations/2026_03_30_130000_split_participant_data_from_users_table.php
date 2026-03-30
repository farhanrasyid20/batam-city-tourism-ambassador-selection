<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('participant_profiles')) {
            Schema::create('participant_profiles', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
                $table->string('participant_number', 40)->nullable()->index();
                $table->string('gender', 20)->nullable();
                $table->string('national_id', 30)->nullable();
                $table->string('birth_place', 120)->nullable();
                $table->date('birth_date')->nullable();
                $table->unsignedSmallInteger('height_cm')->nullable();
                $table->string('instagram', 255)->nullable();
                $table->text('photo')->nullable();
                $table->string('education_category', 30)->nullable();
                $table->string('education_institution', 255)->nullable();
                $table->string('education_major', 255)->nullable();
                $table->string('education_degree', 30)->nullable();
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
                $table->boolean('submitted_to_admin')->default(false);
                $table->timestamp('submitted_to_admin_at')->nullable();
                $table->timestamps();
            });
        }

        if (! Schema::hasTable('participant_documents')) {
            Schema::create('participant_documents', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
                $table->string('document_key', 50);
                $table->string('label', 255);
                $table->boolean('is_required')->default(false);
                $table->string('status', 30)->default('submitted');
                $table->string('original_name', 255)->nullable();
                $table->unsignedBigInteger('size_bytes')->nullable();
                $table->string('mime_type', 120)->nullable();
                $table->string('path', 500)->nullable();
                $table->string('url', 500)->nullable();
                $table->text('note')->nullable();
                $table->timestamp('uploaded_at')->nullable();
                $table->timestamps();

                $table->unique(['user_id', 'document_key']);
                $table->index(['user_id', 'status']);
            });
        }

        $hasParticipantNumber = Schema::hasColumn('users', 'participant_number');
        $hasSubmittedToAdmin = Schema::hasColumn('users', 'submitted_to_admin');
        $hasSubmittedToAdminAt = Schema::hasColumn('users', 'submitted_to_admin_at');
        $hasParticipantDocuments = Schema::hasColumn('users', 'participant_documents');

        $userColumns = array_filter([
            'id',
            'role',
            'participant_number',
            'gender',
            'national_id',
            'birth_place',
            'birth_date',
            'height_cm',
            'instagram',
            'photo',
            'education_category',
            'education_institution',
            'education_major',
            'education_degree',
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
            $hasSubmittedToAdmin ? 'submitted_to_admin' : null,
            $hasSubmittedToAdminAt ? 'submitted_to_admin_at' : null,
            $hasParticipantDocuments ? 'participant_documents' : null,
            'created_at',
            'updated_at',
        ]);

        DB::table('users')
            ->select($userColumns)
            ->where('role', 'participant')
            ->orderBy('id')
            ->chunk(200, function ($users): void {
                foreach ($users as $user) {
                    DB::table('participant_profiles')->updateOrInsert(
                        ['user_id' => $user->id],
                        [
                            'participant_number' => $user->participant_number ?? null,
                            'gender' => $user->gender ?? null,
                            'national_id' => $user->national_id ?? null,
                            'birth_place' => $user->birth_place ?? null,
                            'birth_date' => $user->birth_date ?? null,
                            'height_cm' => $user->height_cm ?? null,
                            'instagram' => $user->instagram ?? null,
                            'photo' => $user->photo ?? null,
                            'education_category' => $user->education_category ?? null,
                            'education_institution' => $user->education_institution ?? null,
                            'education_major' => $user->education_major ?? null,
                            'education_degree' => $user->education_degree ?? null,
                            'vision' => $user->vision ?? null,
                            'mission' => $user->mission ?? null,
                            'experience' => $user->experience ?? null,
                            'achievement' => $user->achievement ?? null,
                            'intro_video_url' => $user->intro_video_url ?? null,
                            'agreement_no_agency' => $user->agreement_no_agency ?? null,
                            'agency_name' => $user->agency_name ?? null,
                            'agreement_parent_permission' => $user->agreement_parent_permission ?? null,
                            'agreement_all_stages' => $user->agreement_all_stages ?? null,
                            'motivation_statement' => $user->motivation_statement ?? null,
                            'contribution_idea' => $user->contribution_idea ?? null,
                            'public_speaking_experience' => $user->public_speaking_experience ?? null,
                            'submitted_to_admin' => (bool) ($user->submitted_to_admin ?? false),
                            'submitted_to_admin_at' => $user->submitted_to_admin_at ?? null,
                            'created_at' => $user->created_at ?? now(),
                            'updated_at' => $user->updated_at ?? now(),
                        ]
                    );

                    $documentsRaw = $user->participant_documents ?? null;
                    if (! $documentsRaw) {
                        continue;
                    }

                    $decoded = json_decode((string) $documentsRaw, true);
                    if (! is_array($decoded)) {
                        continue;
                    }

                    foreach ($decoded as $key => $doc) {
                        if (! is_array($doc)) {
                            continue;
                        }

                        $uploadedAt = null;
                        if (! empty($doc['uploaded_at'])) {
                            try {
                                $uploadedAt = Carbon::parse((string) $doc['uploaded_at'])->toDateTimeString();
                            } catch (\Throwable) {
                                $uploadedAt = null;
                            }
                        }

                        DB::table('participant_documents')->updateOrInsert(
                            [
                                'user_id' => $user->id,
                                'document_key' => (string) ($doc['key'] ?? $key),
                            ],
                            [
                                'label' => (string) ($doc['label'] ?? $key),
                                'is_required' => (bool) ($doc['required'] ?? false),
                                'status' => (string) ($doc['status'] ?? 'submitted'),
                                'original_name' => isset($doc['original_name']) ? (string) $doc['original_name'] : null,
                                'size_bytes' => isset($doc['size_bytes']) ? (int) $doc['size_bytes'] : null,
                                'mime_type' => isset($doc['mime_type']) ? (string) $doc['mime_type'] : null,
                                'path' => isset($doc['path']) ? (string) $doc['path'] : null,
                                'url' => isset($doc['url']) ? (string) $doc['url'] : null,
                                'note' => isset($doc['note']) ? (string) $doc['note'] : null,
                                'uploaded_at' => $uploadedAt,
                                'created_at' => $user->created_at ?? now(),
                                'updated_at' => $user->updated_at ?? now(),
                            ]
                        );
                    }
                }
            });

        $columnsToDrop = [
            'participant_number',
            'gender',
            'national_id',
            'birth_place',
            'birth_date',
            'height_cm',
            'instagram',
            'photo',
            'education_category',
            'education_institution',
            'education_major',
            'education_degree',
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
            'participant_documents',
            'submitted_to_admin',
            'submitted_to_admin_at',
        ];

        $existing = array_values(array_filter($columnsToDrop, fn ($column) => Schema::hasColumn('users', $column)));
        if (! empty($existing)) {
            Schema::table('users', function (Blueprint $table) use ($existing): void {
                $table->dropColumn($existing);
            });
        }
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (! Schema::hasColumn('users', 'participant_number')) {
                $table->string('participant_number', 40)->nullable()->after('account_status');
            }
            if (! Schema::hasColumn('users', 'gender')) {
                $table->string('gender', 20)->nullable()->after('participant_number');
            }
            if (! Schema::hasColumn('users', 'national_id')) {
                $table->string('national_id', 30)->nullable()->after('gender');
            }
            if (! Schema::hasColumn('users', 'birth_place')) {
                $table->string('birth_place', 120)->nullable()->after('national_id');
            }
            if (! Schema::hasColumn('users', 'birth_date')) {
                $table->date('birth_date')->nullable()->after('birth_place');
            }
            if (! Schema::hasColumn('users', 'height_cm')) {
                $table->unsignedSmallInteger('height_cm')->nullable()->after('birth_date');
            }
            if (! Schema::hasColumn('users', 'instagram')) {
                $table->string('instagram', 255)->nullable()->after('height_cm');
            }
            if (! Schema::hasColumn('users', 'photo')) {
                $table->text('photo')->nullable()->after('instagram');
            }
            if (! Schema::hasColumn('users', 'education_category')) {
                $table->string('education_category', 30)->nullable()->after('photo');
            }
            if (! Schema::hasColumn('users', 'education_institution')) {
                $table->string('education_institution', 255)->nullable()->after('education_category');
            }
            if (! Schema::hasColumn('users', 'education_major')) {
                $table->string('education_major', 255)->nullable()->after('education_institution');
            }
            if (! Schema::hasColumn('users', 'education_degree')) {
                $table->string('education_degree', 30)->nullable()->after('education_major');
            }
            if (! Schema::hasColumn('users', 'vision')) {
                $table->text('vision')->nullable()->after('education_degree');
            }
            if (! Schema::hasColumn('users', 'mission')) {
                $table->text('mission')->nullable()->after('vision');
            }
            if (! Schema::hasColumn('users', 'experience')) {
                $table->text('experience')->nullable()->after('mission');
            }
            if (! Schema::hasColumn('users', 'achievement')) {
                $table->text('achievement')->nullable()->after('experience');
            }
            if (! Schema::hasColumn('users', 'intro_video_url')) {
                $table->string('intro_video_url', 500)->nullable()->after('achievement');
            }
            if (! Schema::hasColumn('users', 'agreement_no_agency')) {
                $table->string('agreement_no_agency', 10)->nullable()->after('intro_video_url');
            }
            if (! Schema::hasColumn('users', 'agency_name')) {
                $table->string('agency_name', 255)->nullable()->after('agreement_no_agency');
            }
            if (! Schema::hasColumn('users', 'agreement_parent_permission')) {
                $table->string('agreement_parent_permission', 10)->nullable()->after('agency_name');
            }
            if (! Schema::hasColumn('users', 'agreement_all_stages')) {
                $table->string('agreement_all_stages', 10)->nullable()->after('agreement_parent_permission');
            }
            if (! Schema::hasColumn('users', 'motivation_statement')) {
                $table->text('motivation_statement')->nullable()->after('agreement_all_stages');
            }
            if (! Schema::hasColumn('users', 'contribution_idea')) {
                $table->text('contribution_idea')->nullable()->after('motivation_statement');
            }
            if (! Schema::hasColumn('users', 'public_speaking_experience')) {
                $table->text('public_speaking_experience')->nullable()->after('contribution_idea');
            }
            if (! Schema::hasColumn('users', 'participant_documents')) {
                $table->json('participant_documents')->nullable()->after('public_speaking_experience');
            }
            if (! Schema::hasColumn('users', 'submitted_to_admin')) {
                $table->boolean('submitted_to_admin')->default(false)->after('participant_documents');
            }
            if (! Schema::hasColumn('users', 'submitted_to_admin_at')) {
                $table->timestamp('submitted_to_admin_at')->nullable()->after('submitted_to_admin');
            }
        });

        Schema::dropIfExists('participant_documents');
        Schema::dropIfExists('participant_profiles');
    }
};
