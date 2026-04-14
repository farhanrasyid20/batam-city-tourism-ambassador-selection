<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Throwable;

class ParticipantPdfController extends Controller
{
    private const BRANDING_KEY = 'branding';
    private const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'svg', 'avif'];
    private const DOCUMENT_FIELD_MAP = [
        [
            'labelPath' => 'documentLabels.identityCard',
            'labelFallback' => 'KTP / SIM / Paspor / Kartu Pelajar',
            'statusPath' => 'identityCardStatus',
            'filePath' => 'identityCardFile',
            'urlPath' => 'identityCardUrl',
        ],
        [
            'labelPath' => 'documentLabels.closeUpPhoto',
            'labelFallback' => 'Foto Close Up 4R',
            'statusPath' => 'closeUpStatus',
            'filePath' => 'closeUpFile',
            'urlPath' => 'closeUpUrl',
        ],
        [
            'labelPath' => 'documentLabels.fullBodyPhoto',
            'labelFallback' => 'Foto Full Body 4R',
            'statusPath' => 'fullBodyStatus',
            'filePath' => 'fullBodyFile',
            'urlPath' => 'fullBodyUrl',
        ],
        [
            'labelPath' => 'documentLabels.formS01',
            'labelFallback' => 'Formulir S-01',
            'statusPath' => 's01Status',
            'filePath' => 's01File',
            'urlPath' => 's01Url',
        ],
        [
            'labelPath' => 'documentLabels.formS02',
            'labelFallback' => 'Formulir S-02',
            'statusPath' => 's02Status',
            'filePath' => 's02File',
            'urlPath' => 's02Url',
        ],
        [
            'labelPath' => 'documentLabels.formS03',
            'labelFallback' => 'Formulir S-03',
            'statusPath' => 's03Status',
            'filePath' => 's03File',
            'urlPath' => 's03Url',
        ],
        [
            'labelPath' => 'documentLabels.formS04',
            'labelFallback' => 'Formulir S-04',
            'statusPath' => 's04Status',
            'filePath' => 's04File',
            'urlPath' => 's04Url',
        ],
    ];

    public function store(Request $request)
    {
        $payload = $request->validate([
            'participant' => ['required', 'array'],
            'title' => ['nullable', 'string'],
        ]);

        $participant = $payload['participant'] ?? [];
        $title = trim($payload['title'] ?? '');
        if ($title === '') {
            $title = 'Data Peserta Duta Wisata Batam 2026';
        }

        $branding = SiteSetting::query()->where('key', self::BRANDING_KEY)->first();
        $logoPath = Arr::get($branding?->value, 'logoMain', '/logo1.png');
        $logoBase64 = $this->resolveImageBase64($logoPath);

        $photoBase64 = $this->resolveImageBase64(Arr::get($participant, 'photo'));

        if (! extension_loaded('gd')) {
            return response()->json([
                'message' => 'Gagal generate PDF. Ekstensi PHP GD belum aktif. Aktifkan extension=gd di php.ini lalu restart server PHP/Apache.',
            ], 500);
        }

        try {
            $pdf = Pdf::loadView('pdf.participant', [
                'title' => $title,
                'participant' => $participant,
                'logoBase64' => $logoBase64,
                'photoBase64' => $photoBase64,
                'documentEntries' => $this->buildDocumentEntries($participant),
            ])->setPaper('A4', 'portrait');

            $fileName = str($title)->slug('-')->append('.pdf')->value();

            return $pdf->stream($fileName);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'Gagal generate PDF peserta. Cek log backend untuk detail error.',
            ], 500);
        }
    }

    public function storeBulk(Request $request)
    {
        $payload = $request->validate([
            'participants' => ['required', 'array', 'min:1'],
            'title' => ['nullable', 'string'],
        ]);

        $title = trim($payload['title'] ?? '');
        if ($title === '') {
            $title = 'Data Peserta Duta Wisata Batam 2026';
        }

        if (! extension_loaded('gd')) {
            return response()->json([
                'message' => 'Gagal generate PDF. Ekstensi PHP GD belum aktif. Aktifkan extension=gd di php.ini lalu restart server PHP/Apache.',
            ], 500);
        }

        $rows = array_values(array_filter($payload['participants'] ?? [], fn ($item) => is_array($item)));
        if (count($rows) === 0) {
            return response()->json([
                'message' => 'Data peserta kosong. Tidak ada PDF yang dapat digenerate.',
            ], 422);
        }

        $branding = SiteSetting::query()->where('key', self::BRANDING_KEY)->first();
        $logoPath = Arr::get($branding?->value, 'logoMain', '/logo1.png');
        $logoBase64 = $this->resolveImageBase64($logoPath);

        $participants = array_map(function (array $participant, int $index) {
            return [
                'no' => $index + 1,
                'participant' => $participant,
                'photoBase64' => $this->resolveImageBase64(Arr::get($participant, 'photo')),
                'documentEntries' => $this->buildDocumentEntries($participant),
            ];
        }, $rows, array_keys($rows));

        try {
            $pdf = Pdf::loadView('pdf.participants-bulk', [
                'title' => $title,
                'participants' => $participants,
                'logoBase64' => $logoBase64,
            ])->setPaper('A4', 'portrait');

            $fileName = str($title)->slug('-')->append('.pdf')->value();

            return $pdf->stream($fileName);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'Gagal generate PDF semua peserta. Cek log backend untuk detail error.',
            ], 500);
        }
    }

    private function resolveImageBase64(?string $path): ?string
    {
        $value = trim((string) $path);
        if ($value === '') {
            return null;
        }

        if (str_starts_with($value, 'data:image/')) {
            return $value;
        }

        $fullPath = $this->resolveLocalFilePath($value);

        if (! $fullPath || ! file_exists($fullPath)) {
            return null;
        }

        $mime = mime_content_type($fullPath) ?: 'image/png';
        $data = base64_encode(file_get_contents($fullPath));
        return "data:{$mime};base64,{$data}";
    }

    private function resolveLocalFilePath(?string $path): ?string
    {
        $value = trim((string) $path);
        if ($value === '') {
            return null;
        }

        if (preg_match('#^https?://#i', $value) === 1) {
            $urlPath = parse_url($value, PHP_URL_PATH) ?: '';
            if ($urlPath === '') {
                return null;
            }
            if (str_starts_with($urlPath, '/storage/')) {
                $relative = ltrim(substr($urlPath, strlen('/storage/')), '/');
                return storage_path('app/public/'.$relative);
            }

            return public_path(ltrim($urlPath, '/'));
        }

        if (str_starts_with($value, '/storage/')) {
            $relative = ltrim(substr($value, strlen('/storage/')), '/');
            return storage_path('app/public/'.$relative);
        }

        if (str_starts_with($value, 'storage/')) {
            $relative = ltrim(substr($value, strlen('storage/')), '/');
            return storage_path('app/public/'.$relative);
        }

        return public_path(ltrim($value, '/'));
    }

    private function normalizeFieldValue(mixed $value): string
    {
        $text = trim((string) $value);
        $lower = strtolower($text);

        if ($text === '' || $text === '-' || $lower === 'null' || $lower === 'undefined') {
            return '';
        }

        return $text;
    }

    private function detectDocumentKind(string $fileName, string $url): string
    {
        if ($fileName === '' && $url === '') {
            return 'missing';
        }

        if (str_starts_with($url, 'data:image/')) {
            return 'image';
        }

        if (str_starts_with($url, 'data:application/pdf')) {
            return 'pdf';
        }

        $candidate = $fileName !== '' ? $fileName : (parse_url($url, PHP_URL_PATH) ?: $url);
        $extension = strtolower((string) pathinfo($candidate, PATHINFO_EXTENSION));

        if ($extension === 'pdf') {
            return 'pdf';
        }
        if (in_array($extension, self::IMAGE_EXTENSIONS, true)) {
            return 'image';
        }

        $fullPath = $this->resolveLocalFilePath($url);
        if ($fullPath && file_exists($fullPath)) {
            $mime = mime_content_type($fullPath) ?: '';
            if (str_starts_with($mime, 'image/')) {
                return 'image';
            }
            if ($mime === 'application/pdf') {
                return 'pdf';
            }
        }

        return 'file';
    }

    private function buildDocumentEntries(array $participant): array
    {
        return array_map(function (array $meta) use ($participant) {
            $label = $this->normalizeFieldValue(Arr::get($participant, $meta['labelPath']));
            if ($label === '') {
                $label = $meta['labelFallback'];
            }

            $status = $this->normalizeFieldValue(Arr::get($participant, $meta['statusPath']));
            if ($status === '') {
                $status = '-';
            }

            $fileName = $this->normalizeFieldValue(Arr::get($participant, $meta['filePath']));
            $url = $this->normalizeFieldValue(Arr::get($participant, $meta['urlPath']));
            $kind = $this->detectDocumentKind($fileName, $url);
            $imageBase64 = $kind === 'image' && $url !== '' ? $this->resolveImageBase64($url) : null;

            $note = match ($kind) {
                'image' => $imageBase64
                    ? 'Gambar dokumen berhasil dipreview.'
                    : 'File gambar ada, namun preview tidak bisa ditampilkan di server ini.',
                'pdf' => 'Dokumen dikirim dalam format PDF.',
                'file' => 'Dokumen dikirim (preview tidak tersedia).',
                default => 'Dokumen belum tersedia.',
            };

            return [
                'label' => $label,
                'status' => $status,
                'fileName' => $fileName !== '' ? $fileName : '-',
                'url' => $url,
                'kind' => $kind,
                'imageBase64' => $imageBase64,
                'note' => $note,
            ];
        }, self::DOCUMENT_FIELD_MAP);
    }
}
