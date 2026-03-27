<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmailVerificationOtp;
use App\Models\PasswordResetOtp;
use App\Models\User;
use Firebase\JWT\JWT;
use Illuminate\Support\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Throwable;

class AuthController extends Controller
{
    private function jwtSecret(): string
    {
        return config('app.key') ?: env('APP_KEY', 'laravel-jwt-secret');
    }

    private function tokenTtlMinutes(): int
    {
        return 60;
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

        $payload = [
            'iss' => config('app.url'),
            'sub' => $user->id,
            'email' => $user->email,
            'iat' => $now,
            'exp' => $now + ($this->tokenTtlMinutes() * 60),
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
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['required', 'string', 'max:30'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        try {
            [$user] = DB::transaction(function () use ($request) {
                $user = User::create([
                    'name' => $request->string('name')->toString(),
                    'email' => $request->string('email')->toString(),
                    'phone' => $request->string('phone')->toString(),
                    'password' => $request->string('password')->toString(),
                    'role' => 'participant',
                    'account_status' => 'pending_verification',
                ]);

                $this->createOrRefreshOtp($user);

                return [$user];
            });
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'Registrasi gagal karena email OTP tidak dapat dikirim. Periksa konfigurasi email lalu coba lagi.',
            ], 500);
        }

        $response = [
            'message' => 'Registrasi berhasil. Kode OTP telah dikirim ke email Anda.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'account_status' => $user->account_status,
            ],
            'otp_expires_in_minutes' => $this->otpTtlMinutes(),
            'resend_available_in_seconds' => $this->resendCooldownSeconds(),
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
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'account_status' => $user->account_status,
                'email_verified_at' => $user->email_verified_at,
            ],
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

        /** @var User|null $user */
        $user = User::query()->where('email', $request->string('email')->toString())->first();

        if (! $user || ! Hash::check($request->string('password')->toString(), $user->password)) {
            return response()->json([
                'message' => 'Email atau password salah.',
            ], 401);
        }

        if (! $user->email_verified_at || $user->account_status !== 'active') {
            return response()->json([
                'message' => 'Email belum diverifikasi. Silakan verifikasi OTP terlebih dahulu.',
                'account_status' => $user->account_status,
            ], 403);
        }

        $token = $this->makeToken($user);

        return response()->json([
            'message' => 'Login berhasil.',
            'access_token' => $token,
            'token_type' => 'Bearer',
            'expires_in_minutes' => $this->tokenTtlMinutes(),
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'account_status' => $user->account_status,
            ],
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

    public function resetPasswordWithOtp(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'email'],
            'otp' => ['required', 'digits:6'],
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

        $user->forceFill([
            'password' => $request->string('password')->toString(),
        ])->save();

        $record->used_at = Carbon::now();
        $record->save();

        return response()->json([
            'message' => 'Password berhasil diubah. Silakan login dengan password baru.',
        ]);
    }

    public function me(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->attributes->get('auth_user');

        return response()->json([
            'message' => 'Data user berhasil diambil.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone,
                'role' => $user->role,
                'account_status' => $user->account_status,
            ],
        ]);
    }

    public function logout(): JsonResponse
    {
        return response()->json([
            'message' => 'Logout berhasil. Untuk JWT stateless, token cukup dihapus dari sisi client.',
        ]);
    }
}
