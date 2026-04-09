<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NewsItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class NewsController extends Controller
{
    private function toPayload(NewsItem $item): array
    {
        return [
            'id' => (string) $item->id,
            'title' => (string) $item->title,
            'image' => (string) ($item->image ?: ''),
            'date' => $item->date?->format('Y-m-d') ?? '',
            'category' => (string) $item->category,
            'excerpt' => (string) ($item->excerpt ?: ''),
            'contentHtml' => (string) ($item->content_html ?: ''),
            'body' => [],
        ];
    }

    private function normalizeImage(?string $image, ?string $existingImage = null): ?string
    {
        if ($image === null) {
            return null;
        }

        $image = trim($image);
        if ($image === '') {
            return null;
        }

        if (! str_starts_with($image, 'data:image/')) {
            return $image;
        }

        if (! preg_match('/^data:image\/([a-zA-Z0-9.+-]+);base64,(.+)$/', $image, $matches)) {
            throw ValidationException::withMessages([
                'image' => ['Format cover berita tidak valid.'],
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
                'image' => ['Format cover berita harus JPG, PNG, atau WEBP.'],
            ]);
        }

        $binary = base64_decode($matches[2], true);
        if ($binary === false) {
            throw ValidationException::withMessages([
                'image' => ['Data cover berita tidak dapat diproses.'],
            ]);
        }

        if (strlen($binary) > 5 * 1024 * 1024) {
            throw ValidationException::withMessages([
                'image' => ['Ukuran cover berita maksimal 5 MB.'],
            ]);
        }

        $path = 'news-covers/'.Str::uuid().'.'.$extension;
        Storage::disk('public')->put($path, $binary);

        if ($existingImage && str_starts_with($existingImage, '/storage/news-covers/')) {
            $oldPath = Str::after($existingImage, '/storage/');
            Storage::disk('public')->delete($oldPath);
        }

        return '/storage/'.$path;
    }

    public function index(): JsonResponse
    {
        $items = NewsItem::query()
            ->orderByDesc('date')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'message' => 'Data berita berhasil diambil.',
            'data' => $items->map(fn (NewsItem $item): array => $this->toPayload($item))->values(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'title' => ['required', 'string', 'max:500'],
            'image' => ['nullable', 'string'],
            'date' => ['required', 'date'],
            'category' => ['required', 'string', 'max:100'],
            'excerpt' => ['required', 'string'],
            'contentHtml' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $payload = $validator->validated();

        $item = NewsItem::query()->create([
            'title' => trim((string) $payload['title']),
            'image' => $this->normalizeImage($payload['image'] ?? null),
            'date' => $payload['date'],
            'category' => trim((string) $payload['category']),
            'excerpt' => trim((string) $payload['excerpt']),
            'content_html' => (string) $payload['contentHtml'],
        ]);

        return response()->json([
            'message' => 'Berita berhasil ditambahkan.',
            'data' => $this->toPayload($item),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $item = NewsItem::query()->find($id);

        if (! $item) {
            return response()->json([
                'message' => 'Berita tidak ditemukan.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'title' => ['required', 'string', 'max:500'],
            'image' => ['nullable', 'string'],
            'date' => ['required', 'date'],
            'category' => ['required', 'string', 'max:100'],
            'excerpt' => ['required', 'string'],
            'contentHtml' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $payload = $validator->validated();

        $item->title = trim((string) $payload['title']);
        $item->image = $this->normalizeImage($payload['image'] ?? null, $item->image);
        $item->date = $payload['date'];
        $item->category = trim((string) $payload['category']);
        $item->excerpt = trim((string) $payload['excerpt']);
        $item->content_html = (string) $payload['contentHtml'];
        $item->save();

        return response()->json([
            'message' => 'Berita berhasil diperbarui.',
            'data' => $this->toPayload($item->fresh()),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $item = NewsItem::query()->find($id);

        if (! $item) {
            return response()->json([
                'message' => 'Berita tidak ditemukan.',
            ], 404);
        }

        if ($item->image && str_starts_with($item->image, '/storage/news-covers/')) {
            $path = Str::after($item->image, '/storage/');
            Storage::disk('public')->delete($path);
        }

        $item->delete();

        return response()->json([
            'message' => 'Berita berhasil dihapus.',
        ]);
    }
}
