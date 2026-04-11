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
            $table->json('participant_documents')->nullable()->after('public_speaking_experience');
            $table->boolean('submitted_to_admin')->default(false)->after('participant_documents');
            $table->timestamp('submitted_to_admin_at')->nullable()->after('submitted_to_admin');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'participant_documents',
                'submitted_to_admin',
                'submitted_to_admin_at',
            ]);
        });
    }
};

