# Import peserta massal dari CSV

1. Isi data peserta di file template:
   `backend/database/templates/participants_import_template.csv`
2. Boleh edit file itu langsung di Excel, lalu simpan lagi sebagai format `CSV UTF-8`.
3. Jalankan command dari folder `backend`:

```powershell
php artisan participants:import-csv database/templates/participants_import_template.csv
```

Opsi yang tersedia:

```powershell
php artisan participants:import-csv database/templates/participants_import_template.csv --default-password=Peserta123! --account-status=active --submitted=1 --verified-email=1
```

Catatan:
- Kolom wajib hanya `name` dan `email`.
- Baris dengan email yang sudah ada akan diupdate, bukan dibuat ganda.
- `birth_date` bisa diisi format `YYYY-MM-DD`, `DD/MM/YYYY`, atau `DD-MM-YYYY`.
- Peserta baru otomatis dibuat sebagai role `participant`.
- Password default hanya dipakai untuk akun yang baru dibuat.
