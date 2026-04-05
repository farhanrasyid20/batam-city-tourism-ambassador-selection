<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\JudgeNote;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class JudgeNoteController extends Controller
{
    private const ALLOWED_STAGES = ['Technical Meeting', 'Audition', 'Pre Camp', 'Camp', 'Grand Final'];

    private const ALLOWED_AUTHOR_ROLES = ['judge', 'admin', 'committee'];

    private function toPayload(JudgeNote $note): array
    {
        return [
            'id' => $note->id,
            'participant_id' => $note->participant_id,
            'participant_name' => $note->participant_name,
            'stage' => $note->stage,
            'author_user_id' => $note->author_user_id,
            'author_name' => $note->author?->name,
            'author_avatar' => $note->author?->judge_avatar,
            'author_role' => $note->author_role,
            'content' => $note->content,
            'created_at' => $note->created_at_note?->toISOString(),
        ];
    }

    public function index(Request $request): JsonResponse
    {
        /** @var User|null $authUser */
        $authUser = $request->attributes->get('auth_user');
        $authRole = $authUser?->role ?? null;

        $validator = Validator::make($request->query(), [
            'participant_id' => ['nullable', 'string', 'max:100'],
            'stage' => ['nullable', Rule::in(self::ALLOWED_STAGES)],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $payload = $validator->validated();
        $query = JudgeNote::query()->with('author:id,name,judge_avatar');

        if ($authRole === 'judge') {
            // Juri boleh lihat semua catatan tahapan peserta untuk konteks penilaian.
        }

        if (array_key_exists('participant_id', $payload)) {
            $query->where('participant_id', trim((string) $payload['participant_id']));
        }
        if (array_key_exists('stage', $payload)) {
            $query->where('stage', $payload['stage']);
        }

        $notes = $query
            ->orderByDesc('created_at_note')
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'message' => 'Data catatan juri berhasil diambil.',
            'data' => $notes->map(fn (JudgeNote $note): array => $this->toPayload($note))->values(),
            'total' => $notes->count(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        /** @var User|null $authUser */
        $authUser = $request->attributes->get('auth_user');
        if (! $authUser || $authUser->role !== 'judge') {
            return response()->json([
                'message' => 'Hanya akun juri yang dapat menyimpan catatan.',
            ], 403);
        }

        $validator = Validator::make($request->all(), [
            'participant_id' => ['required', 'string', 'max:100'],
            'participant_name' => ['nullable', 'string', 'max:255'],
            'stage' => ['required', Rule::in(self::ALLOWED_STAGES)],
            'content' => ['required', 'string', 'max:5000'],
            'author_role' => ['nullable', Rule::in(self::ALLOWED_AUTHOR_ROLES)],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $payload = $validator->validated();

        $note = JudgeNote::query()->create([
            'participant_id' => trim((string) $payload['participant_id']),
            'participant_name' => isset($payload['participant_name'])
                ? trim((string) $payload['participant_name'])
                : null,
            'author_user_id' => (int) $authUser->id,
            'stage' => (string) $payload['stage'],
            'author_role' => (string) ($payload['author_role'] ?? 'judge'),
            'content' => trim((string) $payload['content']),
            'created_at_note' => Carbon::now(),
        ]);

        $note->load('author:id,name,judge_avatar');

        return response()->json([
            'message' => 'Catatan berhasil disimpan ke database.',
            'data' => $this->toPayload($note),
        ], 201);
    }
}
