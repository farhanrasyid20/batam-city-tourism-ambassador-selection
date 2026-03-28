<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;

class UserManagementController extends Controller
{
    private function allowedRolesFor(?string $requesterRole): array
    {
        return $requesterRole === 'admin' ? ['judge'] : ['admin', 'judge'];
    }

    public function index(Request $request): JsonResponse
    {
        $authUser = $request->attributes->get('auth_user');
        $requesterRole = $authUser->role ?? null;
        $allowedRoles = $this->allowedRolesFor($requesterRole);
        $role = $request->query('role');
        $search = trim((string) $request->query('search', ''));

        $query = User::query()
            ->whereIn('role', $allowedRoles)
            ->orderByDesc('id');

        if (in_array($role, $allowedRoles, true)) {
            $query->where('role', $role);
        }

        if ($search !== '') {
            $query->where(function ($builder) use ($search): void {
                $builder
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $items = $query->get(['id', 'name', 'email', 'phone', 'role', 'account_status', 'email_verified_at', 'created_at', 'updated_at']);

        return response()->json([
            'message' => 'Daftar user internal berhasil diambil.',
            'data' => $items,
            'total' => $items->count(),
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $authUser = $request->attributes->get('auth_user');
        $requesterRole = $authUser->role ?? null;
        $allowedRoles = $this->allowedRolesFor($requesterRole);

        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'role' => ['required', Rule::in($allowedRoles)],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'account_status' => ['nullable', Rule::in(['active', 'suspended'])],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $user = User::create([
            'name' => $request->string('name')->toString(),
            'email' => strtolower($request->string('email')->toString()),
            'phone' => $request->string('phone')->toString() ?: null,
            'role' => $request->string('role')->toString(),
            'password' => $request->string('password')->toString(),
            'account_status' => $request->string('account_status')->toString() ?: 'active',
        ]);
        $user->forceFill([
            'email_verified_at' => Carbon::now(),
        ])->save();

        return response()->json([
            'message' => 'User internal berhasil dibuat.',
            'user' => $user->only(['id', 'name', 'email', 'phone', 'role', 'account_status', 'email_verified_at']),
        ], 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $authUser = $request->attributes->get('auth_user');
        $requesterRole = $authUser->role ?? null;
        $allowedRoles = $this->allowedRolesFor($requesterRole);

        /** @var User|null $user */
        $user = User::query()
            ->whereIn('role', $allowedRoles)
            ->find($id);

        if (! $user) {
            return response()->json([
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => ['sometimes', 'required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'phone' => ['sometimes', 'nullable', 'string', 'max:30'],
            'role' => ['sometimes', 'required', Rule::in($allowedRoles)],
            'password' => ['sometimes', 'required', 'string', 'min:8', 'confirmed'],
            'account_status' => ['sometimes', 'required', Rule::in(['active', 'suspended'])],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Validasi gagal.',
                'errors' => $validator->errors(),
            ], 422);
        }

        $payload = $validator->validated();

        if (array_key_exists('name', $payload)) {
            $user->name = $payload['name'];
        }
        if (array_key_exists('email', $payload)) {
            $user->email = strtolower($payload['email']);
        }
        if (array_key_exists('phone', $payload)) {
            $user->phone = $payload['phone'] ?: null;
        }
        if (array_key_exists('role', $payload)) {
            $user->role = $payload['role'];
        }
        if (array_key_exists('account_status', $payload)) {
            $user->account_status = $payload['account_status'];
        }
        if (array_key_exists('password', $payload)) {
            $user->password = $payload['password'];
        }

        $user->save();

        return response()->json([
            'message' => 'User internal berhasil diperbarui.',
            'user' => $user->only(['id', 'name', 'email', 'phone', 'role', 'account_status', 'email_verified_at']),
        ]);
    }

    public function suspend(Request $request, int $id): JsonResponse
    {
        $requesterRole = $request->attributes->get('auth_user')->role ?? null;
        $allowedRoles = $this->allowedRolesFor($requesterRole);

        /** @var User|null $user */
        $user = User::query()
            ->whereIn('role', $allowedRoles)
            ->find($id);

        if (! $user) {
            return response()->json([
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        $user->account_status = 'suspended';
        $user->save();

        return response()->json([
            'message' => 'User berhasil dinonaktifkan.',
        ]);
    }

    public function activate(Request $request, int $id): JsonResponse
    {
        $requesterRole = $request->attributes->get('auth_user')->role ?? null;
        $allowedRoles = $this->allowedRolesFor($requesterRole);

        /** @var User|null $user */
        $user = User::query()
            ->whereIn('role', $allowedRoles)
            ->find($id);

        if (! $user) {
            return response()->json([
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        $user->account_status = 'active';
        if (! $user->email_verified_at) {
            $user->email_verified_at = Carbon::now();
        }
        $user->save();

        return response()->json([
            'message' => 'User berhasil diaktifkan.',
        ]);
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        $authUser = $request->attributes->get('auth_user');
        $requesterRole = $authUser->role ?? null;
        $allowedRoles = $this->allowedRolesFor($requesterRole);

        /** @var User|null $target */
        $target = User::query()
            ->whereIn('role', $allowedRoles)
            ->find($id);

        if (! $target) {
            return response()->json([
                'message' => 'User tidak ditemukan.',
            ], 404);
        }

        $authUser = $request->attributes->get('auth_user');
        if ($authUser && (int) $authUser->id === (int) $target->id) {
            return response()->json([
                'message' => 'Anda tidak dapat menghapus akun Anda sendiri.',
            ], 422);
        }

        $target->delete();

        return response()->json([
            'message' => 'User internal berhasil dihapus.',
        ]);
    }
}
