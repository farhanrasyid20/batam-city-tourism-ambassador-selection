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
        Schema::table('users', function (Blueprint $table) {
            $table->string('participant_number', 40)->nullable()->after('account_status');
            $table->string('gender', 20)->nullable()->after('participant_number');
            $table->string('national_id', 30)->nullable()->after('gender');
            $table->string('birth_place', 120)->nullable()->after('national_id');
            $table->date('birth_date')->nullable()->after('birth_place');
            $table->unsignedSmallInteger('height_cm')->nullable()->after('birth_date');
            $table->string('instagram', 255)->nullable()->after('height_cm');
            $table->text('photo')->nullable()->after('instagram');

            $table->string('education_category', 30)->nullable()->after('photo');
            $table->string('education_institution', 255)->nullable()->after('education_category');
            $table->string('education_major', 255)->nullable()->after('education_institution');
            $table->string('education_degree', 30)->nullable()->after('education_major');

            $table->text('vision')->nullable()->after('education_degree');
            $table->text('mission')->nullable()->after('vision');
            $table->text('experience')->nullable()->after('mission');
            $table->text('achievement')->nullable()->after('experience');
            $table->string('intro_video_url', 500)->nullable()->after('achievement');

            $table->string('agreement_no_agency', 10)->nullable()->after('intro_video_url');
            $table->string('agency_name', 255)->nullable()->after('agreement_no_agency');
            $table->string('agreement_parent_permission', 10)->nullable()->after('agency_name');
            $table->string('agreement_all_stages', 10)->nullable()->after('agreement_parent_permission');
            $table->text('motivation_statement')->nullable()->after('agreement_all_stages');
            $table->text('contribution_idea')->nullable()->after('motivation_statement');
            $table->text('public_speaking_experience')->nullable()->after('contribution_idea');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
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
            ]);
        });
    }
};

