<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ParticipantResourceSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ParticipantResourceController extends Controller
{
    private const DOCUMENT_FIELDS = [
        'guideDocument',
        'submissionDocument',
        'formS1Document',
        'formS2Document',
        'formS3Document',
        'formS4Document',
        'twibbonDocument',
    ];

    private const IMAGE_FIELDS = [
        'twibbonThumbnail',
        'whatsappThumbnail',
    ];

    private const TEXT_FIELDS = [
        'hardcopyGuide',
        'closeUpPhotoGuide',
        'fullBodyPhotoGuide',
        'twibbonOpenLink',
        'whatsappGroupLink',
        'instagramMentions',
        'hashtagList',
        'postingInstruction',
        'additionalNote',
    ];

    public function showPublic(): JsonResponse
    {
        $setting = ParticipantResourceSetting::query()->find(1);
        $resources = $this->normalizeResources($setting?->resources);

        return response()->json([
            'message' => 'Resource peserta berhasil diambil.',
            'data' => $resources,
            'updated_at' => $setting?->updated_at?->toIso8601String(),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'payload' => ['nullable'],
            'guide_document_file' => ['sometimes', 'file', 'max:10240'],
            'submission_document_file' => ['sometimes', 'file', 'max:10240'],
            'form_s1_document_file' => ['sometimes', 'file', 'max:10240'],
            'form_s2_document_file' => ['sometimes', 'file', 'max:10240'],
            'form_s3_document_file' => ['sometimes', 'file', 'max:10240'],
            'form_s4_document_file' => ['sometimes', 'file', 'max:10240'],
            'twibbon_document_file' => ['sometimes', 'file', 'max:10240'],
            'twibbon_thumbnail_file' => ['sometimes', 'image', 'max:10240'],
            'whatsapp_thumbnail_file' => ['sometimes', 'image', 'max:10240'],
            'close_up_example_1_file' => ['sometimes', 'image', 'max:10240'],
            'close_up_example_2_file' => ['sometimes', 'image', 'max:10240'],
            'close_up_example_3_file' => ['sometimes', 'image', 'max:10240'],
            'full_body_example_1_file' => ['sometimes', 'image', 'max:10240'],
            'full_body_example_2_file' => ['sometimes', 'image', 'max:10240'],
            'full_body_example_3_file' => ['sometimes', 'image', 'max:10240'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $payloadInput = $request->input('payload');
        $payload = [];
        if (is_string($payloadInput) && trim($payloadInput) !== '') {
            $decoded = json_decode($payloadInput, true);
            if (is_array($decoded)) {
                $payload = $decoded;
            }
        } elseif (is_array($payloadInput)) {
            $payload = $payloadInput;
        }

        $resources = $this->normalizeResources($payload);
        $resources = $this->applyDocumentUploads($request, $resources);
        $resources = $this->applyImageUploads($request, $resources);

        $authUser = $request->attributes->get('auth_user');
        $setting = ParticipantResourceSetting::query()->updateOrCreate(
            ['id' => 1],
            [
                'resources' => $resources,
                'updated_by_user_id' => $authUser?->id,
            ]
        );

        return response()->json([
            'message' => 'Pusat dokumen peserta berhasil diperbarui.',
            'data' => $this->normalizeResources($setting->resources),
            'updated_at' => $setting->updated_at?->toIso8601String(),
        ]);
    }

    private function normalizeResources(?array $source): array
    {
        $source = is_array($source) ? $source : [];
        $defaultDocLinks = [
            'guideDocument' => '/participant-resources/Buku-Panduan-Duta-Wisata-2026.pdf',
            'submissionDocument' => 'https://bit.ly/berkas-duwis-2026',
            'formS1Document' => '/participant-resources/S-01-Formulir-Pendaftaran-Encik-Puan-Batam-2026.pdf',
            'formS2Document' => '/participant-resources/S-02-Surat-Izin-Orang-Tua-Encik-Puan-Batam-2026.pdf',
            'formS3Document' => '/participant-resources/S-03-Pernyataan-Bersedia-Menjadi-Duta-Wisata-2026.pdf',
            'formS4Document' => '/participant-resources/S-04-Kesanggupan-Mengikuti-Rangkaian-Kegiatan-2026.pdf',
            'twibbonDocument' => '/participant-resources/twibbon-duwis-2026.png',
        ];

        $resources = [
            'guideDocument' => $this->normalizeDocument(Arr::get($source, 'guideDocument'), $defaultDocLinks['guideDocument']),
            'submissionDocument' => $this->normalizeDocument(Arr::get($source, 'submissionDocument'), $defaultDocLinks['submissionDocument']),
            'formS1Document' => $this->normalizeDocument(Arr::get($source, 'formS1Document'), $defaultDocLinks['formS1Document']),
            'formS2Document' => $this->normalizeDocument(Arr::get($source, 'formS2Document'), $defaultDocLinks['formS2Document']),
            'formS3Document' => $this->normalizeDocument(Arr::get($source, 'formS3Document'), $defaultDocLinks['formS3Document']),
            'formS4Document' => $this->normalizeDocument(Arr::get($source, 'formS4Document'), $defaultDocLinks['formS4Document']),
            'twibbonDocument' => $this->normalizeDocument(Arr::get($source, 'twibbonDocument'), $defaultDocLinks['twibbonDocument']),
            'hardcopyGuide' => $this->toText(Arr::get($source, 'hardcopyGuide')),
            'closeUpPhotoGuide' => $this->toText(Arr::get($source, 'closeUpPhotoGuide')),
            'fullBodyPhotoGuide' => $this->toText(Arr::get($source, 'fullBodyPhotoGuide')),
            'twibbonOpenLink' => $this->toText(Arr::get($source, 'twibbonOpenLink', 'https://bit.ly/berkas-duwis-2026')),
            'whatsappGroupLink' => $this->toText(Arr::get($source, 'whatsappGroupLink', 'https://bit.ly/PesertaDUWIS2026')),
            'twibbonThumbnail' => $this->normalizeImage(Arr::get($source, 'twibbonThumbnail'), 'Thumbnail Twibbon', '/participant-resources/twibbon-duwis-2026.png'),
            'whatsappThumbnail' => $this->normalizeImage(Arr::get($source, 'whatsappThumbnail'), 'Thumbnail Grup WhatsApp', '/participant-resources/qr-grup-wa-dutawisata-2026.jpg'),
            'closeUpExamples' => $this->normalizeImageList(Arr::get($source, 'closeUpExamples'), 'Close Up', 'closeup'),
            'fullBodyExamples' => $this->normalizeImageList(Arr::get($source, 'fullBodyExamples'), 'Full Body', 'fullbody'),
            'instagramMentions' => $this->toText(Arr::get($source, 'instagramMentions', '@dutawisatakotabatam, @batamtourism.official')),
            'hashtagList' => $this->toText(Arr::get($source, 'hashtagList', "#encikpuanbatam\n#dutawisatakotabatam\n#pemilihandutawisatakotabatam2026")),
            'postingInstruction' => $this->toText(Arr::get($source, 'postingInstruction', 'Wajib posting twibbon di Instagram dan mention akun resmi yang telah ditentukan oleh panitia.')),
            'additionalNote' => $this->toText(Arr::get($source, 'additionalNote')),
        ];

        return $resources;
    }

    private function normalizeDocument(mixed $value, string $defaultLink = ''): array
    {
        $doc = is_array($value) ? $value : [];
        $link = $this->toText(Arr::get($doc, 'linkUrl'));
        if ($link === '') {
            $link = $defaultLink;
        }

        return [
            'linkUrl' => $link,
            'fileName' => $this->toText(Arr::get($doc, 'fileName')),
            'fileDataUrl' => $this->toText(Arr::get($doc, 'fileDataUrl')),
            'fileMimeType' => $this->toText(Arr::get($doc, 'fileMimeType')),
        ];
    }

    private function normalizeImage(mixed $value, string $fallbackCaption, string $defaultImageUrl = ''): array
    {
        $image = is_array($value) ? $value : [];
        $imageUrl = $this->toText(Arr::get($image, 'imageUrl'));
        if ($imageUrl === '') {
            $imageUrl = $defaultImageUrl;
        }

        return [
            'imageUrl' => $imageUrl,
            'imageName' => $this->toText(Arr::get($image, 'imageName')),
            'caption' => $this->toText(Arr::get($image, 'caption', $fallbackCaption)),
        ];
    }

    private function normalizeImageList(mixed $value, string $prefix, string $assetPrefix): array
    {
        $list = is_array($value) ? array_values($value) : [];
        $normalized = [];

        for ($i = 0; $i < 3; $i++) {
            $normalized[] = $this->normalizeImage(
                $list[$i] ?? [],
                sprintf('%s %d', $prefix, $i + 1),
                sprintf('/participant-resources/photo-examples/%s-%d.jpg', $assetPrefix, $i + 1)
            );
        }

        return $normalized;
    }

    private function toText(mixed $value): string
    {
        return is_string($value) ? trim($value) : '';
    }

    private function applyDocumentUploads(Request $request, array $resources): array
    {
        $mapping = [
            'guide_document_file' => 'guideDocument',
            'submission_document_file' => 'submissionDocument',
            'form_s1_document_file' => 'formS1Document',
            'form_s2_document_file' => 'formS2Document',
            'form_s3_document_file' => 'formS3Document',
            'form_s4_document_file' => 'formS4Document',
            'twibbon_document_file' => 'twibbonDocument',
        ];

        foreach ($mapping as $fileField => $resourceField) {
            if (! $request->hasFile($fileField)) {
                continue;
            }

            $file = $request->file($fileField);
            $extension = $file->getClientOriginalExtension() ?: $file->extension() ?: 'bin';
            $path = $file->storeAs(
                'participant-resources/documents',
                Str::uuid().'.'.$extension,
                'public'
            );

            $resources[$resourceField]['fileName'] = $file->getClientOriginalName();
            $resources[$resourceField]['fileDataUrl'] = '/storage/'.$path;
            $resources[$resourceField]['fileMimeType'] = (string) ($file->getMimeType() ?: '');
        }

        return $resources;
    }

    private function applyImageUploads(Request $request, array $resources): array
    {
        $singleMapping = [
            'twibbon_thumbnail_file' => 'twibbonThumbnail',
            'whatsapp_thumbnail_file' => 'whatsappThumbnail',
        ];

        foreach ($singleMapping as $fileField => $resourceField) {
            if (! $request->hasFile($fileField)) {
                continue;
            }

            $file = $request->file($fileField);
            $extension = $file->getClientOriginalExtension() ?: $file->extension() ?: 'jpg';
            $path = $file->storeAs(
                'participant-resources/images',
                Str::uuid().'.'.$extension,
                'public'
            );

            $resources[$resourceField]['imageName'] = $file->getClientOriginalName();
            $resources[$resourceField]['imageUrl'] = '/storage/'.$path;
        }

        for ($i = 0; $i < 3; $i++) {
            $closeUpField = 'close_up_example_'.($i + 1).'_file';
            if ($request->hasFile($closeUpField)) {
                $file = $request->file($closeUpField);
                $extension = $file->getClientOriginalExtension() ?: $file->extension() ?: 'jpg';
                $path = $file->storeAs(
                    'participant-resources/images/close-up',
                    Str::uuid().'.'.$extension,
                    'public'
                );
                $resources['closeUpExamples'][$i]['imageName'] = $file->getClientOriginalName();
                $resources['closeUpExamples'][$i]['imageUrl'] = '/storage/'.$path;
            }

            $fullBodyField = 'full_body_example_'.($i + 1).'_file';
            if (! $request->hasFile($fullBodyField)) {
                continue;
            }

            $file = $request->file($fullBodyField);
            $extension = $file->getClientOriginalExtension() ?: $file->extension() ?: 'jpg';
            $path = $file->storeAs(
                'participant-resources/images/full-body',
                Str::uuid().'.'.$extension,
                'public'
            );
            $resources['fullBodyExamples'][$i]['imageName'] = $file->getClientOriginalName();
            $resources['fullBodyExamples'][$i]['imageUrl'] = '/storage/'.$path;
        }

        return $resources;
    }
}
