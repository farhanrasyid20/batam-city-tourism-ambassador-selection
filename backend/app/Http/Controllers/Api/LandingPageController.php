<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LandingPageSetting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
/**
 * Controller layer entrypoint.
 * Handles HTTP request/response orchestration for this module.
 */

class LandingPageController extends Controller
{
    public function uploadGuidePdf(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'guide_pdf_file' => ['required', 'file', 'mimes:pdf', 'max:20480'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $file = $request->file('guide_pdf_file');
        $extension = $file->getClientOriginalExtension() ?: $file->extension() ?: 'pdf';
        $path = $file->storeAs(
            'landing-page/guides',
            Str::uuid().'.'.$extension,
            'public'
        );

        $authUser = $request->attributes->get('auth_user');
        $setting = LandingPageSetting::query()->find(1);
        $normalized = $this->normalizeContent($setting?->content);
        $normalized['about']['guidePdfUrl'] = '/storage/'.$path;

        $saved = LandingPageSetting::query()->updateOrCreate(
            ['id' => 1],
            [
                'content' => $normalized,
                'updated_by_user_id' => $authUser?->id,
            ]
        );

        return response()->json([
            'message' => 'File buku panduan berhasil diupload.',
            'data' => $this->normalizeContent($saved->content),
            'updated_at' => $saved->updated_at?->toIso8601String(),
        ]);
    }

    public function showPublic(): JsonResponse
    {
        $setting = LandingPageSetting::query()->find(1);

        return response()->json([
            'message' => 'Konten landing page berhasil diambil.',
            'data' => $this->normalizeContent($setting?->content),
            'updated_at' => $setting?->updated_at?->toIso8601String(),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'hero' => ['required', 'array'],
            'hero.organizerLabel' => ['required', 'string'],
            'hero.titleLine1' => ['required', 'string'],
            'hero.titleLine2' => ['required', 'string'],
            'hero.titleLine3' => ['required', 'string'],
            'hero.description' => ['required', 'string'],
            'hero.primaryButtonLabel' => ['required', 'string'],
            'hero.secondaryButtonLabel' => ['required', 'string'],

            'about' => ['required', 'array'],
            'about.sectionLabel' => ['required', 'string'],
            'about.sectionTitle' => ['required', 'string'],
            'about.aboutCardTitle' => ['required', 'string'],
            'about.visionMissionTitle' => ['required', 'string'],
            'about.aboutCardDescription' => ['required', 'string'],
            'about.visionText' => ['required', 'string'],
            'about.missionItems' => ['required', 'array'],
            'about.missionItems.*' => ['required', 'string'],
            'about.guideSectionLabel' => ['required', 'string'],
            'about.guideTitle' => ['required', 'string'],
            'about.guideDescription' => ['required', 'string'],
            'about.guideOpenLabel' => ['required', 'string'],
            'about.guideCloseLabel' => ['required', 'string'],
            'about.guideOpenPdfLabel' => ['required', 'string'],
            'about.guideDownloadPdfLabel' => ['required', 'string'],
            'about.guidePdfUrl' => ['nullable', 'string'],

            'registration' => ['required', 'array'],
            'registration.sectionLabel' => ['required', 'string'],
            'registration.sectionTitle' => ['required', 'string'],
            'registration.stepsTitle' => ['required', 'string'],
            'registration.scheduleTitle' => ['required', 'string'],
            'registration.registerButtonLabel' => ['required', 'string'],
            'registration.steps' => ['required', 'array'],
            'registration.steps.*' => ['required', 'string'],
            'registration.scheduleItems' => ['required', 'array'],
            'registration.scheduleItems.*.id' => ['required', 'string'],
            'registration.scheduleItems.*.activity' => ['required', 'string'],
            'registration.scheduleItems.*.date' => ['nullable', 'string'],
            'registration.scheduleItems.*.startDate' => ['nullable', 'string'],
            'registration.scheduleItems.*.endDate' => ['nullable', 'string'],
            'registration.scheduleItems.*.isExtended' => ['nullable', 'boolean'],
            'registration.scheduleItems.*.extendedUntil' => ['nullable', 'string'],
            'registration.scheduleItems.*.extensionNote' => ['nullable', 'string'],

            'winnerCategories' => ['required', 'array'],
            'winnerCategories.sectionTitle' => ['required', 'string'],
            'winnerCategories.soloSectionLabel' => ['required', 'string'],
            'winnerCategories.soloSectionDescription' => ['required', 'string'],
            'winnerCategories.soloItems' => ['required', 'array'],
            'winnerCategories.soloItems.*.title' => ['required', 'string'],
            'winnerCategories.soloItems.*.description' => ['required', 'string'],
            'winnerCategories.pairSectionLabel' => ['required', 'string'],
            'winnerCategories.pairSectionDescription' => ['required', 'string'],
            'winnerCategories.pairItem' => ['required', 'array'],
            'winnerCategories.pairItem.title' => ['required', 'string'],
            'winnerCategories.pairItem.description' => ['required', 'string'],
            'winnerCategories.favoriteSectionLabel' => ['required', 'string'],
            'winnerCategories.favoriteSectionDescription' => ['required', 'string'],
            'winnerCategories.favoriteItems' => ['required', 'array'],
            'winnerCategories.favoriteItems.*.title' => ['required', 'string'],
            'winnerCategories.favoriteItems.*.description' => ['required', 'string'],

            'requirements' => ['required', 'array'],
            'requirements.sectionLabel' => ['required', 'string'],
            'requirements.sectionTitle' => ['required', 'string'],
            'requirements.introText' => ['required', 'string'],
            'requirements.generalTitle' => ['required', 'string'],
            'requirements.generalItems' => ['required', 'array'],
            'requirements.generalItems.*' => ['required', 'string'],
            'requirements.specialTitle' => ['required', 'string'],
            'requirements.specialItems' => ['required', 'array'],
            'requirements.specialItems.*' => ['required', 'string'],

            'partnership' => ['required', 'array'],
            'partnership.sectionLabel' => ['required', 'string'],
            'partnership.sectionTitle' => ['required', 'string'],
            'partnership.partners' => ['required', 'array'],
            'partnership.partners.*.id' => ['required', 'string'],
            'partnership.partners.*.src' => ['required', 'string'],
            'partnership.partners.*.alt' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $authUser = $request->attributes->get('auth_user');
        $normalized = $this->normalizeContent($validator->validated());

        $setting = LandingPageSetting::query()->updateOrCreate(
            ['id' => 1],
            [
                'content' => $normalized,
                'updated_by_user_id' => $authUser?->id,
            ]
        );

        return response()->json([
            'message' => 'Konten landing page berhasil diperbarui.',
            'data' => $this->normalizeContent($setting->content),
            'updated_at' => $setting->updated_at?->toIso8601String(),
        ]);
    }

    private function normalizeContent(?array $source): array
    {
        $source = is_array($source) ? $source : [];

        return [
            'hero' => [
                'organizerLabel' => $this->toText(Arr::get($source, 'hero.organizerLabel'), 'Dinas Kebudayaan & Pariwisata Kota Batam'),
                'titleLine1' => $this->toText(Arr::get($source, 'hero.titleLine1'), 'PEMILIHAN DUTA WISATA'),
                'titleLine2' => $this->toText(Arr::get($source, 'hero.titleLine2'), 'ENCIK & PUAN'),
                'titleLine3' => $this->toText(Arr::get($source, 'hero.titleLine3'), 'KOTA BATAM 2026'),
                'description' => $this->toText(
                    Arr::get($source, 'hero.description'),
                    'Platform digital resmi pemilihan Encik & Puan Duta Wisata Kota Batam 2026. Daftarkan diri Anda dan jadilah representasi terbaik Kota Batam!'
                ),
                'primaryButtonLabel' => $this->toText(Arr::get($source, 'hero.primaryButtonLabel'), '✦ Daftar Sekarang'),
                'secondaryButtonLabel' => $this->toText(Arr::get($source, 'hero.secondaryButtonLabel'), 'Login Peserta'),
            ],
            'about' => [
                'sectionLabel' => $this->toText(Arr::get($source, 'about.sectionLabel'), 'Tentang Program'),
                'sectionTitle' => $this->toText(Arr::get($source, 'about.sectionTitle'), 'ENCIK & PUAN DUTA WISATA BATAM'),
                'aboutCardTitle' => $this->toText(Arr::get($source, 'about.aboutCardTitle'), 'Tentang Program'),
                'visionMissionTitle' => $this->toText(Arr::get($source, 'about.visionMissionTitle'), 'Visi & Misi'),
                'aboutCardDescription' => $this->toText(
                    Arr::get($source, 'about.aboutCardDescription'),
                    'Encik & Puan Duta Wisata Kota Batam adalah program tahunan yang diselenggarakan oleh Dinas Kebudayaan dan Pariwisata Kota Batam untuk menjaring generasi muda terbaik sebagai representasi dan promotor pariwisata Batam.'
                ),
                'visionText' => $this->toText(
                    Arr::get($source, 'about.visionText'),
                    'Mewujudkan generasi muda Batam sebagai duta pariwisata yang unggul, berkarakter, dan berdaya saing.'
                ),
                'missionItems' => $this->normalizeStringList(
                    Arr::get($source, 'about.missionItems'),
                    [
                        'Mempromosikan destinasi wisata Batam ke tingkat nasional dan internasional.',
                        'Menumbuhkan generasi muda yang aktif, inspiratif, dan peduli terhadap potensi daerah.',
                    ]
                ),
                'guideSectionLabel' => $this->toText(Arr::get($source, 'about.guideSectionLabel'), 'Buku Panduan Resmi'),
                'guideTitle' => $this->toText(Arr::get($source, 'about.guideTitle'), 'Buku Panduan Pemilihan Duta Wisata Batam 2026'),
                'guideDescription' => $this->toText(
                    Arr::get($source, 'about.guideDescription'),
                    'Tekan tombol lihat panduan untuk membuka isi buku langsung di bawah section ini. Jika browser tertentu bermasalah saat menampilkan PDF, file asli tetap bisa dibuka atau diunduh.'
                ),
                'guideOpenLabel' => $this->toText(Arr::get($source, 'about.guideOpenLabel'), 'Lihat Panduan'),
                'guideCloseLabel' => $this->toText(Arr::get($source, 'about.guideCloseLabel'), 'Tutup Panduan'),
                'guideOpenPdfLabel' => $this->toText(Arr::get($source, 'about.guideOpenPdfLabel'), 'Buka PDF'),
                'guideDownloadPdfLabel' => $this->toText(Arr::get($source, 'about.guideDownloadPdfLabel'), 'Unduh PDF'),
                'guidePdfUrl' => $this->toText(Arr::get($source, 'about.guidePdfUrl'), '/participant-resources/Buku-Panduan-Duta-Wisata-2026.pdf'),
            ],
            'registration' => [
                'sectionLabel' => $this->toText(Arr::get($source, 'registration.sectionLabel'), 'Pendaftaran'),
                'sectionTitle' => $this->toText(Arr::get($source, 'registration.sectionTitle'), 'TATA CARA PENDAFTARAN'),
                'stepsTitle' => $this->toText(Arr::get($source, 'registration.stepsTitle'), 'Langkah Pendaftaran'),
                'scheduleTitle' => $this->toText(Arr::get($source, 'registration.scheduleTitle'), 'Jadwal Penting'),
                'registerButtonLabel' => $this->toText(Arr::get($source, 'registration.registerButtonLabel'), 'Daftar Sekarang'),
                'steps' => $this->normalizeStringList(
                    Arr::get($source, 'registration.steps'),
                    ['Buat akun peserta', 'Lengkapi biodata', 'Unggah berkas', 'Submit pendaftaran']
                ),
                'scheduleItems' => $this->normalizeScheduleItems(Arr::get($source, 'registration.scheduleItems')),
            ],
            'winnerCategories' => [
                'sectionTitle' => $this->toText(Arr::get($source, 'winnerCategories.sectionTitle'), 'KATEGORI PEMENANG'),
                'soloSectionLabel' => $this->toText(Arr::get($source, 'winnerCategories.soloSectionLabel'), 'Kategori Individu'),
                'soloSectionDescription' => $this->toText(Arr::get($source, 'winnerCategories.soloSectionDescription'), 'Penghargaan utama untuk kategori solo Encik dan Puan.'),
                'soloItems' => $this->normalizeWinnerItems(
                    Arr::get($source, 'winnerCategories.soloItems'),
                    [
                        [
                            'title' => 'Encik Duta Wisata Kota Batam 2026',
                            'description' => 'Gelar utama untuk finalis putra terbaik yang unggul dalam pengetahuan, karakter, dan representasi pariwisata Batam.',
                        ],
                        [
                            'title' => 'Puan Duta Wisata Kota Batam 2026',
                            'description' => 'Gelar utama untuk finalis putri terbaik yang unggul dalam kepribadian, wawasan, dan promosi pariwisata Batam.',
                        ],
                        [
                            'title' => '1st Runner Up Encik',
                            'description' => 'Penghargaan untuk finalis putra dengan capaian terbaik setelah pemenang utama.',
                        ],
                        [
                            'title' => '1st Runner Up Puan',
                            'description' => 'Penghargaan untuk finalis putri dengan capaian terbaik setelah pemenang utama.',
                        ],
                    ]
                ),
                'pairSectionLabel' => $this->toText(Arr::get($source, 'winnerCategories.pairSectionLabel'), 'Kategori Pasangan'),
                'pairSectionDescription' => $this->toText(Arr::get($source, 'winnerCategories.pairSectionDescription'), 'Penghargaan resmi untuk pasangan utama Duta Wisata Kota Batam.'),
                'pairItem' => $this->normalizeWinnerItem(
                    Arr::get($source, 'winnerCategories.pairItem'),
                    [
                        'title' => 'Encik & Puan Duta Wisata Kota Batam 2026',
                        'description' => 'Penghargaan resmi untuk pasangan utama yang mewakili Duta Wisata Kota Batam selama masa tugas.',
                    ]
                ),
                'favoriteSectionLabel' => $this->toText(Arr::get($source, 'winnerCategories.favoriteSectionLabel'), 'Kategori Favorit'),
                'favoriteSectionDescription' => $this->toText(Arr::get($source, 'winnerCategories.favoriteSectionDescription'), 'Penghargaan berdasarkan dukungan publik dan antusiasme masyarakat.'),
                'favoriteItems' => $this->normalizeWinnerItems(
                    Arr::get($source, 'winnerCategories.favoriteItems'),
                    [
                        [
                            'title' => 'Duta Favorit Encik',
                            'description' => 'Penghargaan berdasarkan dukungan publik dan antusiasme masyarakat untuk finalis putra.',
                        ],
                        [
                            'title' => 'Duta Favorit Puan',
                            'description' => 'Penghargaan berdasarkan dukungan publik dan antusiasme masyarakat untuk finalis putri.',
                        ],
                    ]
                ),
            ],
            'requirements' => [
                'sectionLabel' => $this->toText(Arr::get($source, 'requirements.sectionLabel'), 'Syarat Pendaftaran'),
                'sectionTitle' => $this->toText(Arr::get($source, 'requirements.sectionTitle'), 'PERSYARATAN PESERTA DUTA WISATA KOTA BATAM 2026'),
                'introText' => $this->toText(
                    Arr::get($source, 'requirements.introText'),
                    'Pastikan seluruh syarat umum dan syarat khusus di bawah ini dipenuhi sebelum melakukan pendaftaran dan pengumpulan berkas.'
                ),
                'generalTitle' => $this->toText(Arr::get($source, 'requirements.generalTitle'), 'PERSYARATAN UMUM'),
                'generalItems' => $this->normalizeStringList(
                    Arr::get($source, 'requirements.generalItems'),
                    [
                        'Warga Negara Indonesia dan berdomisili di Kota Batam',
                        'Berusia 18 - 25 tahun pada saat pendaftaran',
                        'Belum menikah',
                        'Pendidikan minimal SMA/SMK/sederajat',
                        'Tinggi badan minimal: Pria 175 cm, Wanita 165 cm',
                        'Sehat jasmani dan rohani',
                    ]
                ),
                'specialTitle' => $this->toText(Arr::get($source, 'requirements.specialTitle'), 'PERSYARATAN KHUSUS'),
                'specialItems' => $this->normalizeStringList(
                    Arr::get($source, 'requirements.specialItems'),
                    [
                        'Memiliki akun Instagram aktif dan tidak di-private',
                        'Bersedia mengikuti seluruh tahapan seleksi',
                        'Tidak sedang menjabat sebagai Duta aktif',
                        'Mampu berkomunikasi dalam Bahasa Indonesia dan Bahasa Inggris',
                        'Memiliki wawasan luas tentang pariwisata Kota Batam',
                        'Bersedia mempromosikan pariwisata Kota Batam selama masa jabatan',
                    ]
                ),
            ],
            'partnership' => [
                'sectionLabel' => $this->toText(Arr::get($source, 'partnership.sectionLabel'), 'Partnership'),
                'sectionTitle' => $this->toText(Arr::get($source, 'partnership.sectionTitle'), 'SPONSOR & MITRA RESMI'),
                'partners' => $this->normalizePartners(Arr::get($source, 'partnership.partners')),
            ],
        ];
    }

    private function normalizeStringList(mixed $value, array $default): array
    {
        $items = is_array($value) ? array_values($value) : [];
        $normalized = array_values(array_filter(array_map(
            fn (mixed $item): string => $this->toText($item),
            $items
        ), fn (string $item): bool => $item !== ''));

        return $normalized !== [] ? $normalized : $default;
    }

    private function normalizeScheduleItems(mixed $value): array
    {
        $items = is_array($value) ? array_values($value) : [];
        $normalized = [];

        foreach ($items as $index => $item) {
            if (! is_array($item)) {
                continue;
            }

            $activity = $this->toText($item['activity'] ?? null);
            $date = $this->toText($item['date'] ?? null);
            $startDate = $this->toText($item['startDate'] ?? null);
            $endDate = $this->toText($item['endDate'] ?? null);
            $isExtended = (bool) ($item['isExtended'] ?? false);
            $extendedUntil = $this->toText($item['extendedUntil'] ?? null);
            $extensionNote = $this->toText($item['extensionNote'] ?? null);

            if ($activity === '' && $date === '' && $startDate === '' && $endDate === '') {
                continue;
            }

            if ($date === '') {
                $date = $this->buildScheduleDateText($startDate, $endDate, $isExtended, $extendedUntil);
            }

            $normalized[] = [
                'id' => $this->toText($item['id'] ?? null, 'schedule-'.($index + 1)),
                'activity' => $activity,
                'date' => $date,
                'startDate' => $startDate,
                'endDate' => $endDate,
                'isExtended' => $isExtended,
                'extendedUntil' => $extendedUntil,
                'extensionNote' => $extensionNote,
            ];
        }

        if ($normalized === []) {
            return $this->getDefaultScheduleItems();
        }

        return $this->mergeMissingScheduleItems($normalized);
    }

    private function getDefaultScheduleItems(): array
    {
        return [
            ['id' => 'schedule-1', 'activity' => 'Pendaftaran Online', 'date' => '2026-02-01 - 2026-04-09', 'startDate' => '2026-02-01', 'endDate' => '2026-04-09', 'isExtended' => false, 'extendedUntil' => '', 'extensionNote' => ''],
            ['id' => 'schedule-2', 'activity' => 'Technical Meeting', 'date' => '2026-04-10', 'startDate' => '2026-04-10', 'endDate' => '2026-04-10', 'isExtended' => false, 'extendedUntil' => '', 'extensionNote' => ''],
            ['id' => 'schedule-3', 'activity' => 'Audisi', 'date' => '2026-04-11', 'startDate' => '2026-04-11', 'endDate' => '2026-04-11', 'isExtended' => false, 'extendedUntil' => '', 'extensionNote' => ''],
            ['id' => 'schedule-4', 'activity' => 'Pra-karantina', 'date' => '2026-04-13 - 2026-04-24', 'startDate' => '2026-04-13', 'endDate' => '2026-04-24', 'isExtended' => false, 'extendedUntil' => '', 'extensionNote' => ''],
            ['id' => 'schedule-5', 'activity' => 'Karantina', 'date' => '2026-04-29 - 2026-05-01', 'startDate' => '2026-04-29', 'endDate' => '2026-05-01', 'isExtended' => false, 'extendedUntil' => '', 'extensionNote' => ''],
            ['id' => 'schedule-6', 'activity' => 'Grand Final', 'date' => '2026-05-02', 'startDate' => '2026-05-02', 'endDate' => '2026-05-02', 'isExtended' => false, 'extendedUntil' => '', 'extensionNote' => ''],
        ];
    }

    private function mergeMissingScheduleItems(array $current): array
    {
        $defaults = $this->getDefaultScheduleItems();
        $currentKeys = array_map(
            fn (array $item): string => $this->activityKey($this->toText($item['activity'] ?? null)),
            $current
        );

        foreach ($defaults as $item) {
            $key = $this->activityKey($this->toText($item['activity'] ?? null));
            if ($key === '' || in_array($key, $currentKeys, true)) {
                continue;
            }

            $current[] = $item;
        }

        return $current;
    }

    private function activityKey(string $value): string
    {
        $lower = mb_strtolower(trim($value));
        return preg_replace('/[^a-z0-9]/', '', $lower) ?? '';
    }

    private function buildScheduleDateText(
        string $startDate,
        string $endDate,
        bool $isExtended,
        string $extendedUntil
    ): string {
        if ($startDate !== '' && $endDate !== '') {
            $base = $startDate === $endDate ? $startDate : $startDate.' - '.$endDate;
        } elseif ($startDate !== '') {
            $base = $startDate;
        } elseif ($endDate !== '') {
            $base = $endDate;
        } else {
            $base = '';
        }

        if ($isExtended && $extendedUntil !== '') {
            $base = trim($base.' (Diperpanjang s/d '.$extendedUntil.')');
        }

        return $base;
    }

    private function normalizeWinnerItems(mixed $value, array $default): array
    {
        $items = is_array($value) ? array_values($value) : [];
        $normalized = [];

        foreach ($items as $item) {
            if (! is_array($item)) {
                continue;
            }

            $title = $this->toText($item['title'] ?? null);
            $description = $this->toText($item['description'] ?? null);

            if ($title === '' && $description === '') {
                continue;
            }

            $normalized[] = [
                'title' => $title,
                'description' => $description,
            ];
        }

        return $normalized !== [] ? $normalized : $default;
    }

    private function normalizeWinnerItem(mixed $value, array $default): array
    {
        $item = is_array($value) ? $value : [];

        return [
            'title' => $this->toText($item['title'] ?? null, $default['title']),
            'description' => $this->toText($item['description'] ?? null, $default['description']),
        ];
    }

    private function normalizePartners(mixed $value): array
    {
        $items = is_array($value) ? array_values($value) : [];
        $normalized = [];

        foreach ($items as $index => $item) {
            if (! is_array($item)) {
                continue;
            }

            $src = $this->toText($item['src'] ?? null);
            $alt = $this->toText($item['alt'] ?? null);

            if ($src === '' && $alt === '') {
                continue;
            }

            $normalized[] = [
                'id' => $this->toText($item['id'] ?? null, 'partner-'.($index + 1)),
                'src' => $src,
                'alt' => $alt,
            ];
        }

        return $normalized !== []
            ? $normalized
            : [
                ['id' => 'logo-site', 'src' => '/logo1.png', 'alt' => 'Duta Wisata Batam'],
                ['id' => 'batam', 'src' => '/partners/dinas_kebudayaan.png', 'alt' => 'Dinas Pariwisata Kota Batam'],
                ['id' => 'vbi', 'src' => '/partners/vbi.png', 'alt' => 'Visit Batam Indonesia'],
                ['id' => 'bbi', 'src' => '/partners/bbi.png', 'alt' => 'Bangga Buatan Indonesia'],
                ['id' => 'wonderful-indonesia', 'src' => '/partners/wonderful.png', 'alt' => 'Wonderful Indonesia'],
                ['id' => 'kementrian-pariwisata', 'src' => '/partners/kemenpar.png', 'alt' => 'Kementrian Pariwisata'],
            ];
    }

    private function toText(mixed $value, string $default = ''): string
    {
        $text = is_string($value) ? trim($value) : '';

        return $text !== '' ? $text : $default;
    }
}
