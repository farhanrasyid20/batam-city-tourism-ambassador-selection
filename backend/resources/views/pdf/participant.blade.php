<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <title>{{ $title }}</title>
    <style>
      @page { margin: 14mm; }
      body { font-family: DejaVu Sans, Arial, sans-serif; color: #1f1f1f; font-size: 12px; }
      .header { display: flex; align-items: center; gap: 14px; border-bottom: 2px solid #caa657; padding-bottom: 10px; margin-bottom: 16px; }
      .brand-logo { width: 58px; height: 58px; object-fit: contain; }
      h1 { margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 0.4px; }
      h2 { margin: 4px 0 0; font-size: 12px; color: #555; font-weight: 600; }
      .meta { margin-top: 6px; font-size: 11px; color: #666; }
      .card { border: 1px solid #e0e0e0; border-radius: 10px; padding: 12px; margin-bottom: 12px; }
      .profile { display: flex; gap: 14px; align-items: flex-start; }
      .photo { width: 90px; height: 110px; border: 1px solid #d5c08a; border-radius: 10px; overflow: hidden; background: #faf7f0; }
      .photo img { width: 100%; height: 100%; object-fit: cover; }
      table { width: 100%; border-collapse: collapse; font-size: 11px; }
      th, td { border: 1px solid #d0d0d0; padding: 6px; vertical-align: top; text-align: left; }
      th { background: #f5f1e8; width: 32%; }
      h3 { margin: 0 0 10px; font-size: 13px; }
      h4 { margin: 12px 0 6px; font-size: 12px; }
      .doc-thumb { width: 100px; height: 100px; object-fit: cover; border: 1px solid #d5c08a; border-radius: 6px; display: block; margin-bottom: 4px; }
      .footer { text-align: center; font-size: 10px; color: #777; margin-top: 16px; }
    </style>
  </head>
  <body>
    @php
      use Illuminate\Support\Arr;
    @endphp
    <div class="header">
      @if (!empty($logoBase64))
        <img src="{{ $logoBase64 }}" class="brand-logo" alt="Logo" />
      @endif
      <div>
        <h1>{{ $title }}</h1>
        <h2>Sistem Pemilihan Duta Wisata Kota Batam</h2>
        <div class="meta">Dicetak: {{ now()->locale('id')->translatedFormat('d F Y, H:i') }}</div>
      </div>
    </div>

    <div class="card profile">
      <div class="photo">
        @if (!empty($photoBase64))
          <img src="{{ $photoBase64 }}" alt="Foto Peserta" />
        @endif
      </div>
      <div style="flex: 1;">
        <h3>{{ Arr::get($participant, 'nama', '-') }} ({{ Arr::get($participant, 'nomorPeserta', '-') }})</h3>
        <table>
          <tbody>
            <tr><th>Agama</th><td>{{ Arr::get($participant, 'agama', '-') }}</td></tr>
            <tr><th>Status Saat Ini</th><td>{{ Arr::get($participant, 'statusSaatIni', '-') }}</td></tr>
            <tr><th>Kategori</th><td>{{ Arr::get($participant, 'kategori', '-') }}</td></tr>
            <tr><th>NIK</th><td>{{ Arr::get($participant, 'nik', '-') }}</td></tr>
            <tr><th>TTL</th><td>{{ Arr::get($participant, 'tempatLahir', '-') }}, {{ Arr::get($participant, 'tanggalLahir', '-') }}</td></tr>
            <tr><th>Tinggi Badan</th><td>{{ Arr::get($participant, 'tinggiBadan', '-') }}</td></tr>
            <tr><th>Berat Badan</th><td>{{ Arr::get($participant, 'beratBadan', '-') }}</td></tr>
            <tr><th>Ukuran Baju</th><td>{{ Arr::get($participant, 'ukuranBaju', '-') }}</td></tr>
            <tr><th>Lingkar Dada</th><td>{{ Arr::get($participant, 'lingkarDada', '-') }}</td></tr>
            <tr><th>Lingkar Pinggang</th><td>{{ Arr::get($participant, 'lingkarPinggang', '-') }}</td></tr>
            <tr><th>Lingkar Pinggul</th><td>{{ Arr::get($participant, 'lingkarPinggul', '-') }}</td></tr>
            <tr><th>Ukuran Celana</th><td>{{ Arr::get($participant, 'ukuranCelana', '-') }}</td></tr>
            <tr><th>Ukuran Sepatu</th><td>{{ Arr::get($participant, 'ukuranSepatu', '-') }}</td></tr>
            <tr><th>Pendidikan</th><td>{{ Arr::get($participant, 'pendidikan', '-') }}</td></tr>
            <tr><th>Instagram</th><td>{{ Arr::get($participant, 'instagram', '-') }}</td></tr>
            <tr><th>TikTok</th><td>{{ Arr::get($participant, 'tiktok', '-') }}</td></tr>
            <tr><th>Email</th><td>{{ Arr::get($participant, 'email', '-') }}</td></tr>
            <tr><th>Telepon</th><td>{{ Arr::get($participant, 'phone', '-') }}</td></tr>
            <tr><th>HP Orang Tua/Wali</th><td>{{ Arr::get($participant, 'parentPhone', '-') }}</td></tr>
            <tr><th>Nama Ayah</th><td>{{ Arr::get($participant, 'fatherName', '-') }}</td></tr>
            <tr><th>Nama Ibu</th><td>{{ Arr::get($participant, 'motherName', '-') }}</td></tr>
            <tr><th>Alamat Domisili</th><td>{{ Arr::get($participant, 'domicileAddress', '-') }}</td></tr>
            <tr><th>Alamat Sesuai KTP</th><td>{{ Arr::get($participant, 'ktpAddress', '-') }}</td></tr>
            <tr><th>Pekerjaan</th><td>{{ Arr::get($participant, 'occupation', '-') }}</td></tr>
            <tr><th>Keahlian/Bakat</th><td>{{ Arr::get($participant, 'skills', '-') }}</td></tr>
            <tr><th>Hobi</th><td>{{ Arr::get($participant, 'hobbies', '-') }}</td></tr>
            <tr><th>Bahasa</th><td>{{ Arr::get($participant, 'languages', '-') }}</td></tr>
            <tr><th>Visi</th><td>{{ Arr::get($participant, 'vision', '-') }}</td></tr>
            <tr><th>Misi</th><td>{{ Arr::get($participant, 'mission', '-') }}</td></tr>
            <tr><th>Pengalaman</th><td>{{ Arr::get($participant, 'experience', '-') }}</td></tr>
            <tr><th>Prestasi</th><td>{{ Arr::get($participant, 'achievement', '-') }}</td></tr>
            @php
              $extraRows = [
                ['Kontrak Agensi', Arr::get($participant, 'agreementNoAgency')],
                ['Nama Agensi', Arr::get($participant, 'agencyName')],
                ['Izin Orang Tua/Wali', Arr::get($participant, 'agreementParentPermission')],
                ['Izin Semua Tahap', Arr::get($participant, 'agreementAllStages')],
                ['Motivasi', Arr::get($participant, 'motivationStatement')],
                ['Kontribusi', Arr::get($participant, 'contributionIdea')],
                ['Public Speaking', Arr::get($participant, 'publicSpeakingExperience')],
              ];
              $extraRows = array_values(array_filter($extraRows, function ($row) {
                $value = trim((string) ($row[1] ?? ''));
                return $value !== '' && $value !== '-' && $value !== 'null';
              }));
            @endphp
            @if (count($extraRows) > 0)
              @foreach ($extraRows as $row)
                <tr><th>{{ $row[0] }}</th><td>{{ $row[1] }}</td></tr>
              @endforeach
            @endif
            <tr><th>Status Verifikasi</th><td>{{ Arr::get($participant, 'verifikasi', '-') }}</td></tr>
            <tr><th>Tahap Seleksi</th><td>{{ Arr::get($participant, 'tahap', '-') }}</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <div class="card">
      <h4>Dokumen</h4>
      <table>
        <thead>
          <tr>
            <th>Dokumen</th>
            <th>Status</th>
            <th>Preview / Keterangan</th>
          </tr>
        </thead>
        <tbody>
          @foreach (($documentEntries ?? []) as $doc)
            <tr>
              <td>{{ $doc['label'] }}</td>
              <td>{{ $doc['status'] }}</td>
              <td>
                @if (($doc['kind'] ?? '') === 'image' && !empty($doc['imageBase64']))
                  <img src="{{ $doc['imageBase64'] }}" alt="Preview {{ $doc['label'] }}" class="doc-thumb" />
                @elseif (($doc['kind'] ?? '') === 'pdf')
                  <strong>PDF</strong>
                @elseif (($doc['kind'] ?? '') === 'missing')
                  <strong>-</strong>
                @else
                  <strong>File</strong>
                @endif
              </td>
            </tr>
          @endforeach
        </tbody>
      </table>
    </div>

    <div class="footer">Dokumen ini digenerate otomatis oleh sistem.</div>
  </body>
</html>
