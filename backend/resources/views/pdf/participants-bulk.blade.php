<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <title>{{ $title }}</title>
    <style>
      @page { margin: 12mm; }
      body { font-family: DejaVu Sans, Arial, sans-serif; color: #1f1f1f; font-size: 11px; }
      h1 { margin: 0; font-size: 18px; text-transform: uppercase; letter-spacing: 0.4px; }
      h2 { margin: 4px 0 0; font-size: 12px; color: #555; font-weight: 600; }
      .meta { margin-top: 6px; font-size: 10px; color: #666; }
      .header { display: flex; align-items: center; gap: 14px; border-bottom: 2px solid #caa657; padding-bottom: 10px; margin-bottom: 12px; }
      .brand-logo { width: 52px; height: 52px; object-fit: contain; }
      .card { border: 1px solid #e1e1e1; border-radius: 10px; padding: 10px; margin-bottom: 10px; }
      .profile { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 8px; }
      .photo { width: 76px; height: 92px; border: 1px solid #d5c08a; border-radius: 8px; overflow: hidden; background: #faf7f0; }
      .photo img { width: 100%; height: 100%; object-fit: cover; }
      .identity { flex: 1; }
      .identity h3 { margin: 0 0 4px; font-size: 13px; }
      .badge { display: inline-block; margin-right: 6px; margin-top: 2px; padding: 2px 6px; border-radius: 999px; font-size: 10px; background: #f4f4f4; color: #333; }
      .split { width: 100%; border-collapse: collapse; table-layout: fixed; }
      .split td { vertical-align: top; width: 50%; padding: 0; }
      .split td.left { padding-right: 4px; }
      .split td.right { padding-left: 4px; }
      table.data { width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 8px; }
      table.data th, table.data td { border: 1px solid #d5d5d5; padding: 4px 5px; text-align: left; vertical-align: top; word-break: break-word; }
      table.data th { background: #f7f3e9; width: 36%; }
      h4 { margin: 0 0 6px; font-size: 11px; }
      .section-title { margin: 8px 0 6px; font-size: 11px; font-weight: bold; color: #6f5526; }
      .doc-table { width: 100%; border-collapse: collapse; font-size: 9.5px; }
      .doc-table th, .doc-table td { border: 1px solid #d5d5d5; padding: 4px 5px; text-align: left; vertical-align: top; word-break: break-word; }
      .doc-table th { background: #f7f3e9; }
      .doc-thumb { width: 80px; height: 80px; object-fit: cover; border: 1px solid #d5c08a; border-radius: 6px; display: block; margin-bottom: 3px; }
      .page-break { page-break-after: always; }
      .footer { text-align: center; font-size: 9px; color: #777; margin-top: 6px; }
    </style>
  </head>
  <body>
    @php
      use Illuminate\Support\Arr;
    @endphp

    @foreach ($participants as $item)
      @php
        $row = Arr::get($item, 'participant', []);
      @endphp

      <div class="{{ $loop->last ? '' : 'page-break' }}">
        <div class="header">
          @if (!empty($logoBase64))
            <img src="{{ $logoBase64 }}" class="brand-logo" alt="Logo" />
          @endif
          <div>
            <h1>{{ $title }}</h1>
            <h2>Sistem Pemilihan Duta Wisata Kota Batam</h2>
            <div class="meta">Dicetak: {{ now()->locale('id')->translatedFormat('d F Y, H:i') }} | Peserta #{{ Arr::get($item, 'no', 0) }}</div>
          </div>
        </div>

        <div class="card">
          <div class="profile">
            <div class="photo">
              @if (!empty(Arr::get($item, 'photoBase64')))
                <img src="{{ Arr::get($item, 'photoBase64') }}" alt="Foto Peserta" />
              @endif
            </div>
            <div class="identity">
              <h3>{{ Arr::get($row, 'nama', '-') }} ({{ Arr::get($row, 'nomorPeserta', '-') }})</h3>
              <span class="badge">Status Verifikasi: {{ Arr::get($row, 'verifikasi', '-') }}</span>
              <span class="badge">Tahap Seleksi: {{ Arr::get($row, 'tahap', '-') }}</span>
            </div>
          </div>

          <table class="split">
            <tr>
              <td class="left">
                <h4>Biodata Inti</h4>
                <table class="data">
                  <tbody>
                    <tr><th>Agama</th><td>{{ Arr::get($row, 'agama', '-') }}</td></tr>
                    <tr><th>Status Saat Ini</th><td>{{ Arr::get($row, 'statusSaatIni', '-') }}</td></tr>
                    <tr><th>Kategori</th><td>{{ Arr::get($row, 'kategori', '-') }}</td></tr>
                    <tr><th>NIK</th><td>{{ Arr::get($row, 'nik', '-') }}</td></tr>
                    <tr><th>TTL</th><td>{{ Arr::get($row, 'tempatLahir', '-') }}, {{ Arr::get($row, 'tanggalLahir', '-') }}</td></tr>
                    <tr><th>Tinggi / Berat</th><td>{{ Arr::get($row, 'tinggiBadan', '-') }} / {{ Arr::get($row, 'beratBadan', '-') }}</td></tr>
                    <tr><th>Ukuran Baju</th><td>{{ Arr::get($row, 'ukuranBaju', '-') }}</td></tr>
                    <tr><th>Lingkar Dada</th><td>{{ Arr::get($row, 'lingkarDada', '-') }}</td></tr>
                    <tr><th>Lingkar Pinggang</th><td>{{ Arr::get($row, 'lingkarPinggang', '-') }}</td></tr>
                    <tr><th>Lingkar Pinggul</th><td>{{ Arr::get($row, 'lingkarPinggul', '-') }}</td></tr>
                    <tr><th>Ukuran Celana</th><td>{{ Arr::get($row, 'ukuranCelana', '-') }}</td></tr>
                    <tr><th>Ukuran Sepatu</th><td>{{ Arr::get($row, 'ukuranSepatu', '-') }}</td></tr>
                    <tr><th>Pendidikan</th><td>{{ Arr::get($row, 'pendidikan', '-') }}</td></tr>
                    <tr><th>Pekerjaan</th><td>{{ Arr::get($row, 'occupation', '-') }}</td></tr>
                  </tbody>
                </table>
              </td>
              <td class="right">
                <h4>Kontak & Latar Belakang</h4>
                <table class="data">
                  <tbody>
                    <tr><th>Instagram</th><td>{{ Arr::get($row, 'instagram', '-') }}</td></tr>
                    <tr><th>TikTok</th><td>{{ Arr::get($row, 'tiktok', '-') }}</td></tr>
                    <tr><th>Email</th><td>{{ Arr::get($row, 'email', '-') }}</td></tr>
                    <tr><th>Telepon</th><td>{{ Arr::get($row, 'phone', '-') }}</td></tr>
                    <tr><th>HP Orang Tua/Wali</th><td>{{ Arr::get($row, 'parentPhone', '-') }}</td></tr>
                    <tr><th>Nama Ayah</th><td>{{ Arr::get($row, 'fatherName', '-') }}</td></tr>
                    <tr><th>Nama Ibu</th><td>{{ Arr::get($row, 'motherName', '-') }}</td></tr>
                    <tr><th>Alamat Domisili</th><td>{{ Arr::get($row, 'domicileAddress', '-') }}</td></tr>
                    <tr><th>Alamat KTP</th><td>{{ Arr::get($row, 'ktpAddress', '-') }}</td></tr>
                    <tr><th>Keahlian/Bakat</th><td>{{ Arr::get($row, 'skills', '-') }}</td></tr>
                    <tr><th>Hobi</th><td>{{ Arr::get($row, 'hobbies', '-') }}</td></tr>
                    <tr><th>Bahasa</th><td>{{ Arr::get($row, 'languages', '-') }}</td></tr>
                    <tr><th>Visi & Misi</th><td>{{ Arr::get($row, 'vision', '-') }} / {{ Arr::get($row, 'mission', '-') }}</td></tr>
                    <tr><th>Prestasi</th><td>{{ Arr::get($row, 'achievement', '-') }}</td></tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </table>

          <div class="section-title">Dokumen Peserta</div>
          <table class="doc-table">
            <thead>
              <tr>
                <th>Dokumen</th>
                <th>Status</th>
                <th>Preview / Keterangan</th>
              </tr>
            </thead>
            <tbody>
              @foreach ((Arr::get($item, 'documentEntries', [])) as $doc)
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

          <div class="footer">Dokumen ini digenerate otomatis oleh sistem.</div>
        </div>
      </div>
    @endforeach
  </body>
</html>
