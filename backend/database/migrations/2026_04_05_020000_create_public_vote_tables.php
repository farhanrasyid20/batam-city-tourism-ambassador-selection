<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration definition.
 * Applies and rolls back schema changes for this migration file.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('public_vote_settings', function (Blueprint $table): void {
            $table->id();
            $table->boolean('vote_top_published')->default(false);
            $table->unsignedBigInteger('updated_by_user_id')->nullable();
            $table->timestamps();
        });

        Schema::create('public_vote_candidate_settings', function (Blueprint $table): void {
            $table->id();
            $table->unsignedBigInteger('participant_user_id')->unique();
            $table->string('publication_photo', 500)->nullable();
            $table->string('instagram_profile_url', 500)->nullable();
            $table->string('instagram_post_url', 500)->nullable();
            $table->unsignedInteger('official_like_count')->default(0);
            $table->timestamp('like_updated_at')->nullable();
            $table->boolean('is_enabled')->default(true);
            $table->unsignedBigInteger('updated_by_user_id')->nullable();
            $table->timestamps();

            $table->index(['is_enabled', 'official_like_count'], 'pvcs_enabled_like_idx');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('public_vote_candidate_settings');
        Schema::dropIfExists('public_vote_settings');
    }
};
