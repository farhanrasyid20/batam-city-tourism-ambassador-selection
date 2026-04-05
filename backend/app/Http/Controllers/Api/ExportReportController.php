<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class ExportReportController extends Controller
{
    public function upload(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'kind' => ['required', Rule::in(['excel', 'pdf'])],
            'stage' => ['required', Rule::in(['Audition', 'Camp', 'Grand Final', 'Final Result'])],
            'gender' => ['nullable', Rule::in(['Semua', 'Encik', 'Puan'])],
            'file' => ['required', 'file', 'max:20480'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $payload = $validator->validated();
        $file = $request->file('file');

        if (! $file) {
            return response()->json([
                'message' => 'File export tidak ditemukan.',
            ], 422);
        }

        $dateFolder = now()->format('Y-m-d');
        $kind = $payload['kind'];
        $safeStage = str($payload['stage'])->replace(' ', '-')->lower()->value();
        $safeGender = str($payload['gender'] ?? 'semua')->lower()->value();
        $filename = sprintf(
            '%s_%s_%s_%s.%s',
            $kind,
            $safeStage,
            $safeGender,
            now()->format('His'),
            $file->getClientOriginalExtension() ?: ($kind === 'pdf' ? 'pdf' : 'xls')
        );

        $path = sprintf('exports/jury-recaps/%s/%s', $dateFolder, $filename);
        Storage::disk('public')->put($path, file_get_contents($file->getRealPath()));

        return response()->json([
            'message' => 'File export berhasil disimpan online.',
            'data' => [
                'kind' => $kind,
                'stage' => $payload['stage'],
                'gender' => $payload['gender'] ?? 'Semua',
                'file_name' => $filename,
                'storage_path' => $path,
                'public_url' => url('/storage/'.$path),
                'saved_at' => now()->toIso8601String(),
            ],
        ]);
    }
}
