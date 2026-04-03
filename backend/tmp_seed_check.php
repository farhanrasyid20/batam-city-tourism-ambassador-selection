<?php
$pdo = new PDO('mysql:host=127.0.0.1;port=3306;dbname=db_duta_wisata_batam', 'root', '');
$u = $pdo->query("SELECT role, COUNT(*) as total FROM users GROUP BY role ORDER BY role")->fetchAll(PDO::FETCH_ASSOC);
$s = $pdo->query("SELECT COUNT(*) as total FROM judge_scores")->fetch(PDO::FETCH_ASSOC);
print_r($u);
print_r($s);
