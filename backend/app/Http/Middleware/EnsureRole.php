<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware otorisasi role berbasis atribut `auth_user` pada request.
 */
class EnsureRole
{
    /**
     * Memastikan role user termasuk dalam daftar role yang diizinkan.
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->attributes->get('auth_user');

        if (! $user) {
            return new JsonResponse([
                'message' => 'User tidak terautentikasi.',
            ], 401);
        }

        if (! in_array($user->role, $roles, true)) {
            return new JsonResponse([
                'message' => 'Anda tidak memiliki akses ke resource ini.',
            ], 403);
        }

        return $next($request);
    }
}
