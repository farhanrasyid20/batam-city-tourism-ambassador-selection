<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('participant_profiles', function (Blueprint $table): void {
            if (! Schema::hasColumn('participant_profiles', 'admin_score_adjustment')) {
                $table->decimal('admin_score_adjustment', 6, 2)->default(0)->after('selection_status_updated_at');
            }
            if (! Schema::hasColumn('participant_profiles', 'admin_score_adjustment_note')) {
                $table->string('admin_score_adjustment_note', 500)->nullable()->after('admin_score_adjustment');
            }
            if (! Schema::hasColumn('participant_profiles', 'admin_score_adjustment_updated_at')) {
                $table->timestamp('admin_score_adjustment_updated_at')->nullable()->after('admin_score_adjustment_note');
            }
            if (! Schema::hasColumn('participant_profiles', 'admin_score_adjustment_updated_by_user_id')) {
                $table->foreignId('admin_score_adjustment_updated_by_user_id')
                    ->nullable()
                    ->after('admin_score_adjustment_updated_at');
                $table->foreign('admin_score_adjustment_updated_by_user_id', 'pp_admin_adj_uid_fk')
                    ->references('id')
                    ->on('users')
                    ->nullOnDelete();
            }
        });
    }

    public function down(): void
    {
        Schema::table('participant_profiles', function (Blueprint $table): void {
            if (Schema::hasColumn('participant_profiles', 'admin_score_adjustment_updated_by_user_id')) {
                $table->dropForeign('pp_admin_adj_uid_fk');
                $table->dropColumn('admin_score_adjustment_updated_by_user_id');
            }
            if (Schema::hasColumn('participant_profiles', 'admin_score_adjustment_updated_at')) {
                $table->dropColumn('admin_score_adjustment_updated_at');
            }
            if (Schema::hasColumn('participant_profiles', 'admin_score_adjustment_note')) {
                $table->dropColumn('admin_score_adjustment_note');
            }
            if (Schema::hasColumn('participant_profiles', 'admin_score_adjustment')) {
                $table->dropColumn('admin_score_adjustment');
            }
        });
    }
};
