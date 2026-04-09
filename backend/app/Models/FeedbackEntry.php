<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FeedbackEntry extends Model
{
    protected $fillable = [
        'name',
        'email',
        'category',
        'message',
        'status',
    ];
}
