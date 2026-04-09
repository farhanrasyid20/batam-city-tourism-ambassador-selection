<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FeedbackEntry;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class FeedbackController extends Controller
{
    private const ALLOWED_CATEGORIES = ['Saran', 'Kritik', 'Pertanyaan', 'Lainnya'];

    private const ALLOWED_STATUSES = ['baru', 'ditinjau', 'selesai'];

    private function toPayload(FeedbackEntry $entry): array
    {
        return [
            'id' => (string) $entry->id,
            'name' => (string) $entry->name,
            'email' => (string) $entry->email,
            'category' => (string) $entry->category,
            'message' => (string) $entry->message,
            'createdAt' => $entry->created_at?->toIso8601String() ?? now()->toIso8601String(),
            'status' => (string) $entry->status,
        ];
    }

    public function index(): JsonResponse
    {
        $items = FeedbackEntry::query()
            ->orderByDesc('created_at')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'message' => 'Data feedback berhasil diambil.',
            'data' => $items->map(fn (FeedbackEntry $entry): array => $this->toPayload($entry))->values(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255'],
            'category' => ['required', Rule::in(self::ALLOWED_CATEGORIES)],
            'message' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $payload = $validator->validated();

        $entry = FeedbackEntry::query()->create([
            'name' => trim((string) $payload['name']),
            'email' => strtolower(trim((string) $payload['email'])),
            'category' => (string) $payload['category'],
            'message' => trim((string) $payload['message']),
            'status' => 'baru',
        ]);

        return response()->json([
            'message' => 'Feedback berhasil dikirim.',
            'data' => $this->toPayload($entry),
        ], 201);
    }

    public function updateStatus(Request $request, int $id): JsonResponse
    {
        $entry = FeedbackEntry::query()->find($id);

        if (! $entry) {
            return response()->json([
                'message' => 'Feedback tidak ditemukan.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'status' => ['required', Rule::in(self::ALLOWED_STATUSES)],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $entry->status = (string) $validator->validated()['status'];
        $entry->save();

        return response()->json([
            'message' => 'Status feedback berhasil diperbarui.',
            'data' => $this->toPayload($entry->fresh()),
        ]);
    }
}
