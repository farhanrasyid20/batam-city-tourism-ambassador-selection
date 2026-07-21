<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmailVerificationOtp;
use App\Models\PasswordResetOtp;
use App\Models\ParticipantProfile;
use App\Models\CompetitionEdition;
use App\Models\ParticipantRegistration;
use App\Models\User;
use Firebase\JWT\JWT;
use Illuminate\Support\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Throwable;
/**
 * Controller layer entrypoint.
 * Handles HTTP request/response orchestration for this module.
 */

class AuthController extends Controller
{
    private function jwtSecret(): string
    {
        return config('app.key') ?: env('APP_KEY', 'laravel-jwt-secret');
    }

    private function tokenTtlMinutes(User $user): int
    {
        return match ($user->role) {
            'participant' => 480, // 8 jam
            'admin', 'judge', 'super_admin' => 240, // 4 jam
            default => 240,
        };
    }

    private function otpTtlMinutes(): int
    {
        return 5;
    }

    private function resendCooldownSeconds(): int
    {
        return 60;
    }

    private function passwordResetOtpTtlMinutes(): int
    {
        return 10;
    }

    private function makeToken(User $user): string
    {
        $now = time();
        $ttlMinutes = $this->tokenTtlMinutes($user);

        $payload = [
            'iss' => config('app.url'),
            'sub' => $user->id,
            'email' => $user->email,
            'iat' => $now,
            'exp' => $now + ($ttlMinutes * 60),
        ];

        return JWT::encode($payload, $this->jwtSecret(), 'HS256');
    }

    private function generateOtpCode(): string
    {
        return str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
    }

    private function hashOtp(string $otp): string
    {
        return hash('sha256', $otp);
    }

    private function authUserPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'phone' => $user->phone,
            'role' => $user->role,
            'account_status' => $user->account_status,
            'email_verified_at' => $user->email_verified_at,
            'judge_assigned_stages' => $user->judge_assigned_stages,
            'judge_type' => $user->judge_type,
            'judge_title' => $user->judge_title,
            'judge_organization' => $user->judge_organization,
            'judge_avatar' => $this->resolveJudgeAvatar($user->judge_avatar),
        ];
    }

    private function resolveJudgeAvatar(?string $avatar): ?string
    {
        $value = is_string($avatar) ? trim($avatar) : '';
        if ($value === '') {
            return null;
        }

        if (! str_starts_with($value, '/storage/')) {
            return $value;
        }

        $storagePath = Str::after($value, '/storage/');
        if ($storagePath !== '' && Storage::disk('public')->exists($storagePath)) {
            return $value;
        }

        return null;
    }

    private function normalizeJudgeAvatar(?string $avatar, ?string $existingAvatar = null): ?string
    {
        if ($avatar === null) {
            return null;
        }

        $avatar = trim($avatar);
        if ($avatar === '') {
            return null;
        }

        if (! str_starts_with($avatar, 'data:image/')) {
            return $avatar;
        }

        if (! preg_match('/^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/', $avatar, $matches)) {
            throw ValidationException::withMessages([
                'judge_avatar' => ['Format foto profil juri tidak valid.'],
            ]);
        }

        $rawExt = strtolower($matches[1]);
        $extension = match ($rawExt) {
            'jpeg' => 'jpg',
            'jpg', 'png', 'webp' => $rawExt,
            default => null,
        };

        if (! $extension) {
            throw ValidationException::withMessages([
                'judge_avatar' => ['Format foto profil harus JPG, PNG, atau WEBP.'],
            ]);
        }

        $binary = base64_decode($matches[2], true);
        if ($binary === false) {
            throw ValidationException::withMessages([
                'judge_avatar' => ['Data foto profil tidak dapat diproses.'],
            ]);
        }

        if (strlen($binary) > 5 * 1024 * 1024) {
            throw ValidationException::withMessages([
                'judge_avatar' => ['Ukuran foto profil maksimal 5 MB.'],
            ]);
        }

        $path = 'judge-photos/'.Str::uuid().'.'.$extension;
        Storage::disk('public')->put($path, $binary);

        if ($existingAvatar && str_starts_with($existingAvatar, '/storage/judge-photos/')) {
            $oldPath = Str::after($existingAvatar, '/storage/');
            Storage::disk('public')->delete($oldPath);
        }

        return '/storage/'.$path;
    }

    private function sendOtpEmail(User $user, string $otp): void
    {
        $expiresText = $this->otpTtlMinutes().' menit';
        $html = view('emails.auth.otp', [
            'name' => $user->name,
            'otp' => $otp,
            'expiresText' => $expiresText,
        ])->render();
        $subject = 'Kode OTP Verifikasi Akun | Duta Wisata Kota Batam 2026';

        $mailtrapToken = env('MAILTRAP_API_TOKEN');
        $mailtrapInboxId = env('MAILTRAP_INBOX_ID');

        if ($mailtrapToken && $mailtrapInboxId) {
            $response = Http::withHeaders([
                'Api-Token' => $mailtrapToken,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ])->post("https://sandbox.api.mailtrap.io/api/send/{$mailtrapInboxId}", [
                'from' => [
                    'email' => env('MAIL_FROM_ADDRESS', 'noreply@dutawisatabatam.test'),
                    'name' => env('MAIL_FROM_NAME', 'Panitia Duta Wisata Kota Batam 2026'),
                ],
                'to' => [
                    [
                        'email' => $user->email,
                        'name' => $user->name,
                    ],
                ],
                'subject' => $subject,
                'text' => "Halo {$user->name},\n\nKode OTP Anda adalah {$otp}.\nKode berlaku selama {$expiresText}.\nJangan bagikan kode ini kepada siapa pun.",
                'html' => $html,
                'category' => 'otp-verification',
            ]);

            if (! $response->successful()) {
                throw new \RuntimeException('Mailtrap Sandbox API gagal mengirim email: '.$response->body());
            }

            return;
        }

        Mail::html(
            $html,
            function ($message) use ($user): void {
                $message
                    ->to($user->email, $user->name)
                    ->subject('Kode OTP Verifikasi Akun | Duta Wisata Kota Batam 2026');
            }
        );
    }

    private function sendPasswordResetOtpEmail(User $user, string $otp): void
    {
        $expiresText = $this->passwordResetOtpTtlMinutes().' menit';
        $html = view('emails.auth.password-reset-otp', [
            'name' => $user->name,
            'otp' => $otp,
            'expiresText' => $expiresText,
        ])->render();
        $subject = 'Kode OTP Reset Password | Duta Wisata Kota Batam 2026';

        $mailtrapToken = env('MAILTRAP_API_TOKEN');
        $mailtrapInboxId = env('MAILTRAP_INBOX_ID');

        if ($mailtrapToken && $mailtrapInboxId) {
            $response = Http::withHeaders([
                'Api-Token' => $mailtrapToken,
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ])->post("https://sandbox.api.mailtrap.io/api/send/{$mailtrapInboxId}", [
                'from' => [
                    'email' => env('MAIL_FROM_ADDRESS', 'noreply@dutawisatabatam.test'),
                    'name' => env('MAIL_FROM_NAME', 'Panitia Duta Wisata Kota Batam 2026'),
                ],
                'to' => [
                    [
                        'email' => $user->email,
                        'name' => $user->name,
                    ],
                ],
                'subject' => $subject,
                'text' => "Halo {$user->name},\n\nKode OTP reset password Anda adalah {$otp}.\nKode berlaku selama {$expiresText}.\nJika Anda tidak meminta reset password, abaikan email ini.",
                'html' => $html,
                'category' => 'password-reset-otp',
            ]);

            if (! $response->successful()) {
                throw new \RuntimeException('Mailtrap Sandbox API gagal mengirim email reset password: '.$response->body());
            }

            return;
        }

        Mail::html(
            $html,
            function ($message) use ($user): void {
                $message
                    ->to($user->email, $user->name)
                    ->subject('Kode OTP Reset Password | Duta Wisata Kota Batam 2026');
            }
        );
    }

    private function createOrRefreshOtp(User $user, bool $incrementResend = false): array
    {
        $otp = $this->generateOtpCode();
        $now = Carbon::now();

        $record = EmailVerificationOtp::query()
            ->where('user_id', $user->id)
            ->whereNull('verified_at')
            ->latest('id')
            ->first();

        if (! $record) {
            $record = new EmailVerificationOtp();
            $record->user_id = $user->id;
            $record->email = $user->email;
            $record->attempt_count = 0;
            $record->resend_count = 0;
        }

        if ($incrementResend) {
            $record->resend_count = $record->resend_count + 1;
        }

        $record->email = $user->email;
        $record->otp_hash = $this->hashOtp($otp);
        $record->last_sent_at = $now;
        $record->expires_at = $now->copy()->addMinutes($this->otpTtlMinutes());
        $record->verified_at = null;
        $record->save();

        $this->sendOtpEmail($user, $otp);

        return [$record, $otp];
    }

    private function createOrRefreshPasswordResetOtp(User $user, bool $incrementResend = false): array
    {
        $otp = $this->generateOtpCode();
        $now = Carbon::now();

        $record = PasswordResetOtp::query()
            ->where('user_id', $user->id)
            ->whereNull('used_at')
            ->latest('id')
            ->first();

        if (! $record) {
            $record = new PasswordResetOtp();
            $record->user_id = $user->id;
            $record->email = $user->email;
            $record->attempt_count = 0;
            $record->resend_count = 0;
        }

        if ($incrementResend) {
            $record->resend_count = $record->resend_count + 1;
        }

        $record->email = $user->email;
        $record->otp_hash = $this->hashOtp($otp);
        $record->last_sent_at = $now;
        $record->expires_at = $now->copy()->addMinutes($this->passwordResetOtpTtlMinutes());
        $record->used_at = null;
        $record->save();

        $this->sendPasswordResetOtpEmail($user, $otp);

        return [$record, $otp];
    }

    public function register(Request $request): JsonResponse
    {
        $activeEdition = CompetitionEdition::active();
        if (! $activeEdition || ! $activeEdition->registrationIsOpen()) {
            return response()->json([
                'message' => 'Pendaftaran peserta belum dibuka atau sudah ditutup oleh panitia.',
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:30'],
            'gender' => ['required', 'string', 'in:Encik,Puan,encik,puan'],
            'password' => ['required', 'string', 'confirmed'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = User::create([
            'name' => $request->string('name')->toString(),
            'email' => $request->string('email')->toString(),
            'phone' => $request->string('phone')->toString(),
            'password' => $request->string('password')->toString(),
            'role' => 'participant',
            'account_status' => 'active',
            'email_verified_at' => Carbon::now(),
        ]);

        ParticipantProfile::query()->firstOrCreate(
            ['user_id' => $user->id],
            ['gender' => strtolower($request->string('gender')->toString()) === 'puan' ? 'Puan' : 'Encik']
        );

        ParticipantRegistration::query()->firstOrCreate([
            'edition_id' => $activeEdition->id,
            'user_id' => $user->id,
        ], [
            'status' => 'draft',
            'gender' => strtolower($request->string('gender')->toString()) === 'puan' ? 'Puan' : 'Encik',
        ]);

        $response = [
            'message' => 'Registrasi berhasil. Akun peserta Anda sudah aktif dan siap digunakan.',
            'user' => $this->authUserPayload($user),
        ];

        return response()->json($response, 201);
    }

    public function verifyOtp(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'email'],
            'otp' => ['required', 'digits:6'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        /** @var User|null $user */
        $user = User::query()->where('email', $request->string('email')->toString())->first();

        if (! $user) {
            return response()->json([
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        /** @var EmailVerificationOtp|null $record */
        $record = EmailVerificationOtp::query()
            ->where('user_id', $user->id)
            ->whereNull('verified_at')
            ->latest('id')
            ->first();

        if (! $record) {
            return response()->json([
                'message' => 'OTP belum tersedia. Silakan kirim ulang OTP.',
            ], 404);
        }

        if ($record->expires_at->isPast()) {
            return response()->json([
                'message' => 'Kode OTP sudah kedaluwarsa. Silakan kirim ulang OTP.',
            ], 422);
        }

        if (! hash_equals($record->otp_hash, $this->hashOtp($request->string('otp')->toString()))) {
            $record->increment('attempt_count');

            return response()->json([
                'message' => 'Kode OTP tidak valid.',
                'attempt_count' => $record->fresh()->attempt_count,
            ], 422);
        }

        $record->verified_at = Carbon::now();
        $record->save();

        $user->forceFill([
            'email_verified_at' => Carbon::now(),
            'account_status' => 'active',
        ])->save();

        return response()->json([
            'message' => 'Email berhasil diverifikasi.',
            'user' => $this->authUserPayload($user),
        ]);
    }

    public function resendOtp(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'email'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        /** @var User|null $user */
        $user = User::query()->where('email', $request->string('email')->toString())->first();

        if (! $user) {
            return response()->json([
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        if ($user->email_verified_at) {
            return response()->json([
                'message' => 'Email sudah diverifikasi. Anda tidak perlu meminta OTP lagi.',
            ], 422);
        }

        /** @var EmailVerificationOtp|null $record */
        $record = EmailVerificationOtp::query()
            ->where('user_id', $user->id)
            ->whereNull('verified_at')
            ->latest('id')
            ->first();

        if ($record && $record->last_sent_at && $record->last_sent_at->diffInSeconds(Carbon::now()) < $this->resendCooldownSeconds()) {
            return response()->json([
                'message' => 'OTP baru bisa dikirim ulang setelah cooldown selesai.',
                'retry_after_seconds' => $this->resendCooldownSeconds() - $record->last_sent_at->diffInSeconds(Carbon::now()),
            ], 429);
        }

        try {
            DB::transaction(function () use ($user) {
                return $this->createOrRefreshOtp($user, true);
            });
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'OTP gagal dikirim ke email. Periksa konfigurasi email lalu coba lagi.',
            ], 500);
        }

        $response = [
            'message' => 'Kode OTP baru telah dikirim ke email Anda.',
            'otp_expires_in_minutes' => $this->otpTtlMinutes(),
            'resend_available_in_seconds' => $this->resendCooldownSeconds(),
        ];

        return response()->json($response);
    }

    public function login(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $inputEmail = strtolower(trim($request->string('email')->toString()));

        /** @var User|null $user */
        $user = User::query()->where('email', $inputEmail)->first();

        if (! $user) {
            return response()->json([
                'message' => "Email {$inputEmail} tidak terdaftar.",
            ], 404);
        }

        if (! Hash::check($request->string('password')->toString(), $user->password)) {
            return response()->json([
                'message' => 'Password salah.',
            ], 401);
        }

        if ($user->role === 'participant' && $user->account_status === 'pending_verification') {
            $user->forceFill([
                'account_status' => 'active',
                'email_verified_at' => $user->email_verified_at ?? Carbon::now(),
            ])->save();
        }

        if ($user->account_status !== 'active') {
            return response()->json([
                'message' => 'Akun belum aktif. Hubungi panitia untuk bantuan.',
                'account_status' => $user->account_status,
            ], 403);
        }

        $token = $this->makeToken($user);
        $ttlMinutes = $this->tokenTtlMinutes($user);

        return response()->json([
            'message' => 'Login berhasil.',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'expires_in_minutes' => $ttlMinutes,
            'user' => $this->authUserPayload($user),
        ]);
    }

    public function requestPasswordResetOtp(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'email'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $email = $request->string('email')->toString();

        /** @var User|null $user */
        $user = User::query()->where('email', $email)->first();

        if (! $user) {
            return response()->json([
                'message' => 'Jika email terdaftar, kode OTP reset password telah dikirim.',
                'otp_expires_in_minutes' => $this->passwordResetOtpTtlMinutes(),
                'resend_available_in_seconds' => $this->resendCooldownSeconds(),
            ]);
        }

        /** @var PasswordResetOtp|null $record */
        $record = PasswordResetOtp::query()
            ->where('user_id', $user->id)
            ->whereNull('used_at')
            ->latest('id')
            ->first();

        if ($record && $record->last_sent_at && $record->last_sent_at->diffInSeconds(Carbon::now()) < $this->resendCooldownSeconds()) {
            return response()->json([
                'message' => 'OTP baru bisa dikirim ulang setelah cooldown selesai.',
                'retry_after_seconds' => $this->resendCooldownSeconds() - $record->last_sent_at->diffInSeconds(Carbon::now()),
            ], 429);
        }

        try {
            DB::transaction(function () use ($user) {
                return $this->createOrRefreshPasswordResetOtp($user, true);
            });
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'OTP reset password gagal dikirim. Periksa konfigurasi email lalu coba lagi.',
            ], 500);
        }

        $response = [
            'message' => 'Jika email terdaftar, kode OTP reset password telah dikirim.',
            'otp_expires_in_minutes' => $this->passwordResetOtpTtlMinutes(),
            'resend_available_in_seconds' => $this->resendCooldownSeconds(),
        ];

        return response()->json($response);
    }

    public function verifyPasswordResetOtp(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'email'],
            'otp' => ['required', 'digits:6'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        /** @var User|null $user */
        $user = User::query()->where('email', $request->string('email')->toString())->first();

        if (! $user) {
            return response()->json([
                'message' => 'Email atau kode OTP tidak valid.',
            ], 422);
        }

        /** @var PasswordResetOtp|null $record */
        $record = PasswordResetOtp::query()
            ->where('user_id', $user->id)
            ->whereNull('used_at')
            ->latest('id')
            ->first();

        if (! $record) {
            return response()->json([
                'message' => 'OTP reset password belum tersedia. Silakan kirim OTP terlebih dahulu.',
            ], 404);
        }

        if ($record->expires_at->isPast()) {
            return response()->json([
                'message' => 'Kode OTP reset password sudah kedaluwarsa. Silakan kirim ulang OTP.',
            ], 422);
        }

        if (! hash_equals($record->otp_hash, $this->hashOtp($request->string('otp')->toString()))) {
            $record->increment('attempt_count');

            return response()->json([
                'message' => 'Kode OTP reset password tidak valid.',
                'attempt_count' => $record->fresh()->attempt_count,
            ], 422);
        }

        return response()->json([
            'message' => 'OTP valid. Silakan masukkan password baru.',
            'otp_expires_in_minutes' => $this->passwordResetOtpTtlMinutes(),
        ]);
    }

    public function resetPasswordDirect(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        /** @var User|null $user */
        $user = User::query()->where('email', $request->string('email')->toString())->first();

        if (! $user) {
            return response()->json([
                'message' => 'Email atau kode OTP tidak valid.',
            ], 422);
        }

        $user->forceFill([
            'password' => $request->string('password')->toString(),
        ])->save();

        return response()->json([
            'message' => 'Password berhasil diubah. Silakan login dengan password baru.',
        ]);
    }

    public function changePassword(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'current_password' => ['required', 'string'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        /** @var User|null $user */
        $user = $request->attributes->get('auth_user');

        if (! $user) {
            return response()->json([
                'message' => 'User tidak terautentikasi.',
            ], 401);
        }

        if (! Hash::check($request->string('current_password')->toString(), $user->password)) {
            return response()->json([
                'message' => 'Password saat ini tidak sesuai.',
            ], 422);
        }

        $user->forceFill([
            'password' => $request->string('password')->toString(),
        ])->save();

        return response()->json([
            'message' => 'Password berhasil diperbarui.',
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'email', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'judge_title' => ['sometimes', 'nullable', 'string', 'max:255'],
            'judge_organization' => ['sometimes', 'nullable', 'string', 'max:255'],
            'judge_avatar' => ['sometimes', 'nullable', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        /** @var User|null $user */
        $user = $request->attributes->get('auth_user');
        if (! $user) {
            return response()->json([
                'message' => 'User tidak terautentikasi.',
            ], 401);
        }

        $payload = $validator->validated();

        if (array_key_exists('name', $payload)) {
            $user->name = trim((string) $payload['name']);
        }
        if (array_key_exists('email', $payload)) {
            $normalizedEmail = strtolower(trim((string) $payload['email']));
            $emailExists = User::query()
                ->where('email', $normalizedEmail)
                ->whereKeyNot($user->id)
                ->exists();

            if ($emailExists) {
                return response()->json([
                    'message' => 'Validasi gagal.',
                    'errors' => [
                        'email' => ['Email sudah digunakan oleh akun lain.'],
                    ],
                ], 422);
            }
            $user->email = $normalizedEmail;
        }
        if (array_key_exists('phone', $payload)) {
            $user->phone = trim((string) $payload['phone']) ?: null;
        }

        if ($user->role === 'judge') {
            if (array_key_exists('judge_title', $payload)) {
                $user->judge_title = trim((string) $payload['judge_title']) ?: null;
            }
            if (array_key_exists('judge_organization', $payload)) {
                $user->judge_organization = trim((string) $payload['judge_organization']) ?: null;
            }
            if (array_key_exists('judge_avatar', $payload)) {
                $user->judge_avatar = $this->normalizeJudgeAvatar($payload['judge_avatar'], $user->judge_avatar);
            }
        }

        $user->save();

        return response()->json([
            'message' => 'Profil berhasil diperbarui.',
            'user' => $this->authUserPayload($user->fresh()),
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->attributes->get('auth_user');

        return response()->json([
            'message' => 'Data user berhasil diambil.',
            'user' => $this->authUserPayload($user),
        ]);
    }

    public function logout(): JsonResponse
    {
        return response()->json([
            'message' => 'Logout berhasil. Untuk JWT stateless, token cukup dihapus dari sisi client.',
        ]);
    }
}
