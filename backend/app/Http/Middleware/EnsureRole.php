<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRole
{
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

