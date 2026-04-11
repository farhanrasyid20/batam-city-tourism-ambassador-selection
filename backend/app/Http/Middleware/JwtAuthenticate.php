<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Throwable;

/**
 * Middleware autentikasi JWT untuk API berbasis bearer token.
 */
class JwtAuthenticate
{
    /**
     * Memvalidasi token JWT dan menyisipkan user terautentikasi ke atribut request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $header = $request->bearerToken();

        if (! $header) {
            return new JsonResponse([
                'message' => 'Token tidak ditemukan.',
            ], 401);
        }

        try {
            $payload = JWT::decode($header, new Key(config('app.key') ?: env('APP_KEY', 'laravel-jwt-secret'), 'HS256'));
            $user = User::query()->find($payload->sub ?? null);

            if (! $user) {
                return new JsonResponse([
                    'message' => 'User token tidak valid.',
                ], 401);
            }

            $request->attributes->set('auth_user', $user);
        } catch (Throwable $exception) {
            return new JsonResponse([
                'message' => 'Token tidak valid atau sudah kedaluwarsa.',
            ], 401);
        }

        return $next($request);
    }
}
