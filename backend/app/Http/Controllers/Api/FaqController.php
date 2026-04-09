<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FaqItem;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class FaqController extends Controller
{
    private const ALLOWED_CATEGORIES = ['Pendaftaran', 'Berkas', 'Tahapan', 'Akun', 'Penilaian'];

    private function toPayload(FaqItem $item): array
    {
        return [
            'id' => (string) $item->id,
            'question' => (string) $item->question,
            'answer' => (string) $item->answer,
            'category' => (string) $item->category,
        ];
    }

    public function index(): JsonResponse
    {
        $items = FaqItem::query()
            ->orderByDesc('updated_at')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'message' => 'Data FAQ berhasil diambil.',
            'data' => $items->map(fn (FaqItem $item): array => $this->toPayload($item))->values(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'question' => ['required', 'string', 'max:1000'],
            'answer' => ['required', 'string'],
            'category' => ['required', Rule::in(self::ALLOWED_CATEGORIES)],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $payload = $validator->validated();

        $item = FaqItem::query()->create([
            'question' => trim((string) $payload['question']),
            'answer' => trim((string) $payload['answer']),
            'category' => (string) $payload['category'],
        ]);

        return response()->json([
            'message' => 'FAQ berhasil ditambahkan.',
            'data' => $this->toPayload($item),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $item = FaqItem::query()->find($id);

        if (! $item) {
            return response()->json([
                'message' => 'FAQ tidak ditemukan.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'question' => ['required', 'string', 'max:1000'],
            'answer' => ['required', 'string'],
            'category' => ['required', Rule::in(self::ALLOWED_CATEGORIES)],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $payload = $validator->validated();

        $item->question = trim((string) $payload['question']);
        $item->answer = trim((string) $payload['answer']);
        $item->category = (string) $payload['category'];
        $item->save();

        return response()->json([
            'message' => 'FAQ berhasil diperbarui.',
            'data' => $this->toPayload($item->fresh()),
        ]);
    }

    public function destroy(int $id): JsonResponse
    {
        $item = FaqItem::query()->find($id);

        if (! $item) {
            return response()->json([
                'message' => 'FAQ tidak ditemukan.',
            ], 404);
        }

        $item->delete();

        return response()->json([
            'message' => 'FAQ berhasil dihapus.',
        ]);
    }
}
