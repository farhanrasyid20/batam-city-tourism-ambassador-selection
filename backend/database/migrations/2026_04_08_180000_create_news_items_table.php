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
        Schema::create('news_items', function (Blueprint $table): void {
            $table->id();
            $table->string('title', 500);
            $table->string('image', 1000)->nullable();
            $table->date('date')->index();
            $table->string('category', 100)->index();
            $table->text('excerpt')->nullable();
            $table->longText('content_html')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('news_items');
    }
};
