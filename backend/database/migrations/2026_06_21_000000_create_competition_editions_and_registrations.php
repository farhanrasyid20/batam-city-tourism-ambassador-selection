<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('competition_editions', function (Blueprint $table): void {
            $table->id();
            $table->unsignedSmallInteger('year')->unique();
            $table->string('name', 150);
            $table->string('status', 30)->default('draft')->index();
            $table->boolean('is_active')->default(false)->index();
            $table->timestamp('registration_start_at')->nullable();
            $table->timestamp('registration_end_at')->nullable();
            $table->timestamp('registration_reopened_at')->nullable();
            $table->text('registration_reopen_reason')->nullable();
            $table->timestamps();
        });

        Schema::create('participant_registrations', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('edition_id')->constrained('competition_editions')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('status', 30)->default('draft')->index();
            $table->string('participant_number', 40)->nullable()->index();
            $table->string('audition_number', 40)->nullable()->index();
            $table->string('participant_code', 40)->nullable()->index();
            $table->string('gender', 20)->nullable();
            $table->string('selection_status', 40)->nullable()->index();
            $table->text('selection_status_note')->nullable();
            $table->timestamp('selection_status_updated_at')->nullable();
            $table->decimal('admin_score_adjustment', 8, 2)->nullable();
            $table->text('admin_score_adjustment_note')->nullable();
            $table->timestamp('admin_score_adjustment_updated_at')->nullable();
            $table->unsignedBigInteger('admin_score_adjustment_updated_by_user_id')->nullable();
            $table->foreign('admin_score_adjustment_updated_by_user_id', 'participant_registrations_adjusted_by_fk')
                ->references('id')->on('users')->nullOnDelete();
            $table->boolean('eliminated_in_audition')->default(false);
            $table->timestamp('eliminated_at')->nullable();
            $table->json('biodata_snapshot')->nullable();
            $table->timestamp('submitted_at')->nullable();
            $table->timestamps();

            $table->unique(['edition_id', 'user_id']);
        });

        $editionId = DB::table('competition_editions')->insertGetId([
            'year' => 2026,
            'name' => 'Pemilihan Duta Wisata Kota Batam 2026',
            'status' => 'registration_open',
            'is_active' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        DB::table('users')
            ->where('role', 'participant')
            ->leftJoin('participant_profiles', 'participant_profiles.user_id', '=', 'users.id')
            ->select('users.id as account_user_id', 'participant_profiles.*')
            ->orderBy('users.id')
            ->chunk(200, function ($rows) use ($editionId): void {
                $inserts = [];
                foreach ($rows as $row) {
                    $inserts[] = [
                        'edition_id' => $editionId,
                        'user_id' => $row->account_user_id,
                        'status' => $row->submitted_to_admin ? 'submitted' : 'draft',
                        'participant_number' => $row->participant_number,
                        'audition_number' => $row->audition_number,
                        'participant_code' => $row->participant_code,
                        'gender' => $row->gender,
                        'selection_status' => $row->selection_status,
                        'selection_status_note' => $row->selection_status_note,
                        'selection_status_updated_at' => $row->selection_status_updated_at,
                        'admin_score_adjustment' => $row->admin_score_adjustment,
                        'admin_score_adjustment_note' => $row->admin_score_adjustment_note,
                        'admin_score_adjustment_updated_at' => $row->admin_score_adjustment_updated_at,
                        'admin_score_adjustment_updated_by_user_id' => $row->admin_score_adjustment_updated_by_user_id,
                        'eliminated_in_audition' => (bool) $row->eliminated_in_audition,
                        'eliminated_at' => $row->eliminated_at,
                        'submitted_at' => $row->submitted_to_admin_at,
                        'created_at' => $row->created_at ?? now(),
                        'updated_at' => now(),
                    ];
                }
                if ($inserts) DB::table('participant_registrations')->insert($inserts);
            });

        Schema::table('participant_documents', function (Blueprint $table): void {
            $table->dropUnique('participant_documents_user_id_document_key_unique');
            $table->foreignId('edition_id')->nullable()->after('user_id')->constrained('competition_editions')->cascadeOnDelete();
            $table->unique(['edition_id', 'user_id', 'document_key'], 'participant_documents_edition_user_key_unique');
        });
        DB::table('participant_documents')->whereNull('edition_id')->update(['edition_id' => $editionId]);

        Schema::table('judge_scores', function (Blueprint $table): void {
            $table->dropUnique('judge_scores_unique_submission');
            $table->foreignId('edition_id')->nullable()->after('id')->constrained('competition_editions')->cascadeOnDelete();
            $table->unique(['edition_id', 'participant_id', 'judge_user_id', 'stage', 'score_type'], 'judge_scores_edition_unique_submission');
        });
        DB::table('judge_scores')->whereNull('edition_id')->update(['edition_id' => $editionId]);

        Schema::table('judge_notes', function (Blueprint $table): void {
            $table->foreignId('edition_id')->nullable()->after('id')->constrained('competition_editions')->cascadeOnDelete();
        });
        DB::table('judge_notes')->whereNull('edition_id')->update(['edition_id' => $editionId]);
    }

    public function down(): void
    {
        Schema::table('judge_notes', fn (Blueprint $table) => $table->dropConstrainedForeignId('edition_id'));
        Schema::table('judge_scores', function (Blueprint $table): void {
            $table->dropUnique('judge_scores_edition_unique_submission');
            $table->dropConstrainedForeignId('edition_id');
            $table->unique(['participant_id', 'judge_user_id', 'stage', 'score_type'], 'judge_scores_unique_submission');
        });
        Schema::table('participant_documents', function (Blueprint $table): void {
            $table->dropUnique('participant_documents_edition_user_key_unique');
            $table->dropConstrainedForeignId('edition_id');
            $table->unique(['user_id', 'document_key']);
        });
        Schema::dropIfExists('participant_registrations');
        Schema::dropIfExists('competition_editions');
    }
};
