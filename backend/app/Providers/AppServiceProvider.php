<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

/**
 * Root service provider aplikasi.
 * Menjadi tempat registrasi dependency dan bootstrap konfigurasi global.
 */
class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
