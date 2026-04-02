<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        $columns = [
            'nickname' => fn (Blueprint $table) => $table->string('nickname', 120)->nullable()->after('gender'),
            'domicile_address' => fn (Blueprint $table) => $table->text('domicile_address')->nullable()->after('birth_date'),
            'ktp_address' => fn (Blueprint $table) => $table->text('ktp_address')->nullable()->after('domicile_address'),
            'parent_phone' => fn (Blueprint $table) => $table->string('parent_phone', 40)->nullable()->after('instagram'),
            'tiktok' => fn (Blueprint $table) => $table->string('tiktok', 255)->nullable()->after('instagram'),
            'occupation' => fn (Blueprint $table) => $table->string('occupation', 255)->nullable()->after('education_degree'),
            'skills' => fn (Blueprint $table) => $table->text('skills')->nullable()->after('occupation'),
            'hobbies' => fn (Blueprint $table) => $table->text('hobbies')->nullable()->after('skills'),
            'languages' => fn (Blueprint $table) => $table->text('languages')->nullable()->after('hobbies'),
            'weight_kg' => fn (Blueprint $table) => $table->string('weight_kg', 30)->nullable()->after('height_cm'),
            'shirt_size' => fn (Blueprint $table) => $table->string('shirt_size', 30)->nullable()->after('weight_kg'),
            'chest_circumference_cm' => fn (Blueprint $table) => $table->string('chest_circumference_cm', 30)->nullable()->after('shirt_size'),
            'waist_circumference_cm' => fn (Blueprint $table) => $table->string('waist_circumference_cm', 30)->nullable()->after('chest_circumference_cm'),
            'hip_circumference_cm' => fn (Blueprint $table) => $table->string('hip_circumference_cm', 30)->nullable()->after('waist_circumference_cm'),
            'pants_size' => fn (Blueprint $table) => $table->string('pants_size', 30)->nullable()->after('hip_circumference_cm'),
            'shoe_size' => fn (Blueprint $table) => $table->string('shoe_size', 30)->nullable()->after('pants_size'),
        ];

        foreach ($columns as $column => $definition) {
            if (Schema::hasColumn('participant_profiles', $column)) {
                continue;
            }

            Schema::table('participant_profiles', function (Blueprint $table) use ($definition): void {
                $definition($table);
            });
        }
    }

    public function down(): void
    {
        $columns = [
            'nickname',
            'domicile_address',
            'ktp_address',
            'parent_phone',
            'tiktok',
            'occupation',
            'skills',
            'hobbies',
            'languages',
            'weight_kg',
            'shirt_size',
            'chest_circumference_cm',
            'waist_circumference_cm',
            'hip_circumference_cm',
            'pants_size',
            'shoe_size',
        ];

        $existing = array_values(array_filter(
            $columns,
            fn (string $column): bool => Schema::hasColumn('participant_profiles', $column)
        ));

        if (! empty($existing)) {
            Schema::table('participant_profiles', function (Blueprint $table) use ($existing): void {
                $table->dropColumn($existing);
            });
        }
    }
};
