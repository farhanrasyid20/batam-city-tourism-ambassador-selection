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
        Schema::create('feedback_entries', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 255);
            $table->string('email', 255)->index();
            $table->string('category', 30)->index();
            $table->text('message');
            $table->string('status', 30)->default('baru')->index();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('feedback_entries');
    }
};
