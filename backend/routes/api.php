<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ParticipantBiodataController;
use App\Http\Controllers\Api\ParticipantDocumentController;
use App\Http\Controllers\Api\UserManagementController;
use Illuminate\Support\Facades\Route;

Route::prefix('auth')->group(function (): void {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
    Route::post('/resend-otp', [AuthController::class, 'resendOtp']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/me', [AuthController::class, 'me'])->middleware('jwt.auth');
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('jwt.auth');
    Route::post('/change-password', [AuthController::class, 'changePassword'])->middleware('jwt.auth');
});

Route::post('/register', [AuthController::class, 'register']);
Route::post('/verify-otp', [AuthController::class, 'verifyOtp']);
Route::post('/resend-otp', [AuthController::class, 'resendOtp']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password/request-otp', [AuthController::class, 'requestPasswordResetOtp']);
Route::post('/forgot-password/verify-otp', [AuthController::class, 'verifyPasswordResetOtp']);
Route::post('/forgot-password/reset', [AuthController::class, 'resetPasswordDirect']);

Route::prefix('participant')->middleware(['jwt.auth', 'role:participant'])->group(function (): void {
    Route::get('/biodata', [ParticipantBiodataController::class, 'show']);
    Route::put('/biodata', [ParticipantBiodataController::class, 'update']);
    Route::get('/documents', [ParticipantDocumentController::class, 'index']);
    Route::post('/documents/upload', [ParticipantDocumentController::class, 'upload']);
    Route::post('/documents/submit', [ParticipantDocumentController::class, 'submit']);
});

Route::prefix('super-admin')->middleware(['jwt.auth', 'role:super_admin,admin'])->group(function (): void {
    Route::get('/users', [UserManagementController::class, 'index']);
    Route::post('/users', [UserManagementController::class, 'store']);
    Route::patch('/users/{id}', [UserManagementController::class, 'update']);
    Route::patch('/users/{id}/suspend', [UserManagementController::class, 'suspend']);
    Route::patch('/users/{id}/activate', [UserManagementController::class, 'activate']);
    Route::delete('/users/{id}', [UserManagementController::class, 'destroy']);
    Route::patch('/participants/{id}/selection-status', [UserManagementController::class, 'updateParticipantSelectionStatus']);
});
