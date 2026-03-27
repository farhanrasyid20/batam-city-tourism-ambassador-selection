<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $email = strtolower((string) env('SUPER_ADMIN_EMAIL', 'superadmin@dutawisatabatam.id'));

        User::query()->updateOrCreate(
            ['email' => $email],
            [
                'name' => (string) env('SUPER_ADMIN_NAME', 'Super Admin'),
                'phone' => (string) env('SUPER_ADMIN_PHONE', '081200000000'),
                'password' => (string) env('SUPER_ADMIN_PASSWORD', 'SuperAdmin123!'),
                'role' => 'super_admin',
                'account_status' => 'active',
                'email_verified_at' => Carbon::now(),
            ]
        );
    }
}

