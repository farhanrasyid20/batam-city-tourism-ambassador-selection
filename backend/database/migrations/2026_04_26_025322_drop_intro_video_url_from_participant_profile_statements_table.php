<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('participant_profile_statements', 'intro_video_url')) {
            return;
        }

        Schema::table('participant_profile_statements', function (Blueprint $table): void {
            $table->dropColumn('intro_video_url');
        });
    }

    public function down(): void
    {
        if (Schema::hasColumn('participant_profile_statements', 'intro_video_url')) {
            return;
        }

        Schema::table('participant_profile_statements', function (Blueprint $table): void {
            $table->string('intro_video_url', 500)->nullable()->after('achievement');
        });
    }
};
