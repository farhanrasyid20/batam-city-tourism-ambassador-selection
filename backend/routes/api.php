<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AuditionPromotionController;
use App\Http\Controllers\Api\ExportReportController;
use App\Http\Controllers\Api\FaqController;
use App\Http\Controllers\Api\FeedbackController;
use App\Http\Controllers\Api\JudgeNoteController;
use App\Http\Controllers\Api\JudgeParticipantController;
use App\Http\Controllers\Api\JudgeScoreController;
use App\Http\Controllers\Api\JudgeScoreRecapController;
use App\Http\Controllers\Api\LandingPageController;
use App\Http\Controllers\Api\NewsController;
use App\Http\Controllers\Api\ParticipantBiodataController;
use App\Http\Controllers\Api\ParticipantDocumentController;
use App\Http\Controllers\Api\ParticipantPdfController;
use App\Http\Controllers\Api\ParticipantResourceController;
use App\Http\Controllers\Api\PublicFinalistController;
use App\Http\Controllers\Api\PublicVoteAdminController;
use App\Http\Controllers\Api\SiteSettingController;
use App\Http\Controllers\Api\UserManagementController;
use Illuminate\Support\Facades\Route;

/**
 * Kelompok endpoint autentikasi utama.
 * Mencakup registrasi, login, profil akun, logout, dan ubah password.
 */
Route::prefix('auth')->group(function (): void {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
    Route::get('/me', [AuthController::class, 'me'])->middleware('jwt.auth');
    Route::patch('/profile', [AuthController::class, 'updateProfile'])->middleware('jwt.auth');
    Route::post('/logout', [AuthController::class, 'logout'])->middleware('jwt.auth');
    Route::post('/change-password', [AuthController::class, 'changePassword'])->middleware('jwt.auth');
});

/**
 * Endpoint publik dan endpoint kompatibilitas lama.
 * Digunakan untuk akses tanpa autentikasi seperti feedback, FAQ, berita, dan finalis.
 */
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);
Route::post('/forgot-password/reset', [AuthController::class, 'resetPasswordDirect']);
Route::post('/feedback', [FeedbackController::class, 'store']);
Route::get('/public/faqs', [FaqController::class, 'index']);
Route::get('/public/landing-page', [LandingPageController::class, 'showPublic']);
Route::get('/public/site-settings/branding', [SiteSettingController::class, 'showBrandingPublic']);
Route::get('/public/news', [NewsController::class, 'index']);
Route::get('/public/finalists', [PublicFinalistController::class, 'index']);
Route::get('/public/participant-resources', [ParticipantResourceController::class, 'showPublic']);

/**
 * Endpoint khusus peserta terautentikasi.
 * Mengelola biodata dan dokumen pendaftaran peserta.
 */
Route::prefix('participant')->middleware(['jwt.auth', 'role:participant'])->group(function (): void {
    Route::get('/biodata', [ParticipantBiodataController::class, 'show']);
    Route::put('/biodata', [ParticipantBiodataController::class, 'update']);
    Route::get('/documents', [ParticipantDocumentController::class, 'index']);
    Route::post('/documents/upload', [ParticipantDocumentController::class, 'upload']);
    Route::post('/documents/submit', [ParticipantDocumentController::class, 'submit']);
});

/**
 * Endpoint panel super admin/admin.
 * Mencakup manajemen konten, user internal, seleksi peserta, vote, scoring, export, dan resource.
 */
Route::prefix('super-admin')->middleware(['jwt.auth', 'role:super_admin,admin'])->group(function (): void {
    Route::get('/news', [NewsController::class, 'index']);
    Route::post('/news', [NewsController::class, 'store']);
    Route::patch('/news/{id}', [NewsController::class, 'update']);
    Route::delete('/news/{id}', [NewsController::class, 'destroy']);
    Route::get('/faqs', [FaqController::class, 'index']);
    Route::post('/faqs', [FaqController::class, 'store']);
    Route::patch('/faqs/{id}', [FaqController::class, 'update']);
    Route::delete('/faqs/{id}', [FaqController::class, 'destroy']);
    Route::get('/feedback', [FeedbackController::class, 'index']);
    Route::patch('/feedback/{id}/status', [FeedbackController::class, 'updateStatus']);
    Route::get('/landing-page', [LandingPageController::class, 'showPublic']);
    Route::post('/landing-page', [LandingPageController::class, 'update']);
    Route::post('/landing-page/guide-pdf-upload', [LandingPageController::class, 'uploadGuidePdf']);
    Route::get('/site-settings/branding', [SiteSettingController::class, 'showBrandingAdmin']);
    Route::post('/site-settings/branding', [SiteSettingController::class, 'updateBranding']);
    Route::get('/users', [UserManagementController::class, 'index']);
    Route::post('/users', [UserManagementController::class, 'store']);
    Route::patch('/users/{id}', [UserManagementController::class, 'update']);
    Route::patch('/users/{id}/suspend', [UserManagementController::class, 'suspend']);
    Route::patch('/users/{id}/activate', [UserManagementController::class, 'activate']);
    Route::delete('/users/{id}', [UserManagementController::class, 'destroy']);
    Route::patch('/participants/{id}/selection-status', [UserManagementController::class, 'updateParticipantSelectionStatus']);
    Route::patch('/participants/{id}/document-reviews', [UserManagementController::class, 'updateParticipantDocumentReviews']);
    Route::post('/participants/pdf', [ParticipantPdfController::class, 'store']);
    Route::post('/participants/pdf-bulk', [ParticipantPdfController::class, 'storeBulk']);
    Route::patch('/vote/publication', [PublicVoteAdminController::class, 'updatePublication']);
    Route::post('/vote/candidates/{participantUserId}', [PublicVoteAdminController::class, 'updateCandidate']);
    Route::patch('/vote/jury', [PublicVoteAdminController::class, 'updateJuryWinners']);
    Route::patch('/scoring/final-adjustment', [JudgeScoreRecapController::class, 'updateAdjustment']);
    Route::get('/scoring/audition/top20-preview', [AuditionPromotionController::class, 'preview']);
    Route::post('/scoring/audition/top20-apply', [AuditionPromotionController::class, 'apply']);
    Route::post('/exports/upload', [ExportReportController::class, 'upload']);
    Route::post('/participant-resources', [ParticipantResourceController::class, 'update']);
});

/**
 * Endpoint baca data untuk juri.
 * Mencakup daftar peserta, catatan, skor, dan rekap skor.
 */
Route::prefix('judge')->middleware(['jwt.auth', 'role:judge,admin,super_admin'])->group(function (): void {
    Route::get('/participants', [JudgeParticipantController::class, 'index']);
    Route::get('/notes', [JudgeNoteController::class, 'index']);
    Route::get('/scores', [JudgeScoreController::class, 'index']);
    Route::get('/scores/recap', [JudgeScoreRecapController::class, 'index']);
});

/**
 * Endpoint tulis catatan juri.
 */
Route::prefix('judge')->middleware(['jwt.auth', 'role:judge,admin,super_admin'])->group(function (): void {
    Route::post('/notes', [JudgeNoteController::class, 'store']);
});

/**
 * Endpoint input nilai juri.
 */
Route::prefix('judge')->middleware(['jwt.auth', 'role:judge,admin,super_admin'])->group(function (): void {
    Route::post('/scores', [JudgeScoreController::class, 'store']);
});
