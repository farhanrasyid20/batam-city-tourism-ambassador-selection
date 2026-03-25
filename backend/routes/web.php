<?php

use App\Models\User;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/users', function () {
    return response()->json([
        'message' => 'Daftar user berhasil diambil.',
        'total' => User::query()->count(),
        'data' => User::query()
            ->select('id', 'name', 'email', 'email_verified_at', 'created_at')
            ->orderByDesc('id')
            ->get(),
    ]);
});
