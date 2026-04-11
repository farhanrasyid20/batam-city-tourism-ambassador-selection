<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
/**
 * Eloquent model representing a domain entity.
 * Defines persistence rules, casting, and relationships for this resource.
 */

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
