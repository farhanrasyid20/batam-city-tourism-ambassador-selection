<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

/**
 * Controller layer entrypoint.
 * Handles HTTP request/response orchestration for this module.
 */
class SiteSettingController extends Controller
{
    private const BRANDING_KEY = 'branding';

    public function showBrandingPublic(): JsonResponse
    {
        $setting = SiteSetting::query()->where('key', self::BRANDING_KEY)->first();

        return response()->json([
            'message' => 'Pengaturan branding berhasil diambil.',
            'data' => $this->normalizeBranding($setting?->value),
            'updated_at' => $setting?->updated_at?->toIso8601String(),
        ]);
    }

    public function showBrandingAdmin(): JsonResponse
    {
        $setting = SiteSetting::query()->where('key', self::BRANDING_KEY)->first();

        return response()->json([
            'message' => 'Pengaturan branding admin berhasil diambil.',
            'data' => $this->normalizeBranding($setting?->value),
            'updated_at' => $setting?->updated_at?->toIso8601String(),
        ]);
    }

    public function updateBranding(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'logoMain' => ['required', 'string'],
            'logoLoader' => ['required', 'string'],
            'favicon' => ['required', 'string'],
            'siteNameLine1' => ['required', 'string'],
            'siteNameLine2' => ['required', 'string'],
            'tagline' => ['required', 'string'],
            'footerDescription' => ['required', 'string'],
            'contactOrganization' => ['required', 'string'],
            'contactAddress' => ['required', 'string'],
            'contactPhone' => ['required', 'string'],
            'contactEmail' => ['required', 'string'],
            'contactInstagram' => ['required', 'string'],
            'contactInstagramUrl' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $authUser = $request->attributes->get('auth_user');
        $validated = $validator->validated();
        $validated['logoMain'] = $this->storeImageDataUri($validated['logoMain'], 'logo-main');
        $validated['logoLoader'] = $this->storeImageDataUri($validated['logoLoader'], 'logo-loader');
        $validated['favicon'] = $this->storeImageDataUri($validated['favicon'], 'favicon');

        if ($validated['logoMain'] === null || $validated['logoLoader'] === null || $validated['favicon'] === null) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => [
                    'image' => ['Ukuran gambar terlalu besar atau format data gambar tidak valid. Maksimal 5MB.'],
                ],
            ], 422);
        }

        $payload = $this->normalizeBranding($validated);

        $setting = SiteSetting::query()->updateOrCreate(
            ['key' => self::BRANDING_KEY],
            [
                'value' => $payload,
                'updated_by_user_id' => $authUser?->id,
            ]
        );

        return response()->json([
            'message' => 'Pengaturan branding berhasil diperbarui.',
            'data' => $this->normalizeBranding($setting->value),
            'updated_at' => $setting->updated_at?->toIso8601String(),
        ]);
    }

    private function normalizeBranding(?array $source): array
    {
        $source = is_array($source) ? $source : [];

        return [
            'logoMain' => $this->normalizeImagePath(Arr::get($source, 'logoMain'), '/logo1.png'),
            'logoLoader' => $this->normalizeImagePath(Arr::get($source, 'logoLoader'), '/logo1.png'),
            'favicon' => $this->normalizeImagePath(Arr::get($source, 'favicon'), '/logo1.png'),
            'siteNameLine1' => $this->toText(Arr::get($source, 'siteNameLine1'), 'DUTA WISATA'),
            'siteNameLine2' => $this->toText(Arr::get($source, 'siteNameLine2'), 'KOTA BATAM 2026'),
            'tagline' => $this->toText(Arr::get($source, 'tagline'), 'Platform Digital Pemilihan Encik & Puan Kota Batam'),
            'footerDescription' => $this->toText(Arr::get($source, 'footerDescription'), 'Platform digital resmi Pemilihan Encik dan Puan Duta Wisata Kota Batam 2026.'),
            'contactOrganization' => $this->toText(Arr::get($source, 'contactOrganization'), 'Dinas Kebudayaan dan Pariwisata Kota Batam'),
            'contactAddress' => $this->toText(Arr::get($source, 'contactAddress'), 'Jl. Engku Putri No.1, Batam Centre, Kota Batam'),
            'contactPhone' => $this->toText(Arr::get($source, 'contactPhone'), '(0778) 469000'),
            'contactEmail' => $this->toText(Arr::get($source, 'contactEmail'), 'dutawisata@batam.go.id'),
            'contactInstagram' => $this->toText(Arr::get($source, 'contactInstagram'), '@dutawisatakotabatam'),
            'contactInstagramUrl' => $this->toText(Arr::get($source, 'contactInstagramUrl'), 'https://www.instagram.com/dutawisatakotabatam/'),
            'themeColor' => $this->toText(Arr::get($source, 'themeColor'), '#C8A24D'),
        ];
    }

    private function toText(mixed $value, string $default = ''): string
    {
        $text = is_string($value) ? trim($value) : '';

        return $text !== '' ? $text : $default;
    }

    private function storeImageDataUri(string $value, string $prefix): ?string
    {
        $trimmed = trim($value);
        if (! str_starts_with($trimmed, 'data:image/')) {
            return $trimmed;
        }

        if (! preg_match('/^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/s', $trimmed, $matches)) {
            return null;
        }

        $encoded = str_replace(' ', '+', $matches[2] ?? '');
        $binary = base64_decode($encoded, true);
        if ($binary === false) {
            return null;
        }

        if (strlen($binary) > 5 * 1024 * 1024) {
            return null;
        }

        $extension = strtolower($matches[1] ?? 'png');
        $extension = match ($extension) {
            'jpeg' => 'jpg',
            'svg+xml' => 'svg',
            'x-icon' => 'ico',
            default => $extension,
        };

        $path = sprintf('site-branding/%s-%s.%s', $prefix, Str::uuid(), $extension);
        Storage::disk('public')->put($path, $binary);

        return '/storage/'.$path;
    }

    private function normalizeImagePath(mixed $value, string $default): string
    {
        $text = $this->toText($value, $default);
        if ($text === '') {
            return $default;
        }

        if ($text === $default) {
            return $default;
        }

        if (str_starts_with($text, '/storage/')) {
            $relative = ltrim(substr($text, strlen('/storage/')), '/');
            return Storage::disk('public')->exists($relative) ? $text : $default;
        }

        if (str_starts_with($text, 'storage/')) {
            $relative = ltrim(substr($text, strlen('storage/')), '/');
            return Storage::disk('public')->exists($relative) ? '/'.$text : $default;
        }

        return $text;
    }
}

