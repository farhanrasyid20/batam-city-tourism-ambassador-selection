<?php
require __DIR__ . '/vendor/autoload.php';
$app = require __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();
Illuminate\Support\Facades\Schema::dropIfExists('public_vote_candidate_settings');
Illuminate\Support\Facades\Schema::dropIfExists('public_vote_settings');
echo "dropped\n";
