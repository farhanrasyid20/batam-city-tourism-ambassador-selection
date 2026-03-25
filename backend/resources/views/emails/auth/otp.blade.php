<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kode OTP Verifikasi Akun</title>
</head>
<body style="margin:0;padding:0;background:#101010;font-family:Arial,Helvetica,sans-serif;color:#f3f3f3;">
    <div style="max-width:600px;margin:0 auto;padding:28px 16px;">
        <div style="background:#171717;border:1px solid #2d2d2d;border-radius:20px;overflow:hidden;">
            <div style="height:4px;background:linear-gradient(90deg,#8c6a1c,#f5d06f,#8c6a1c);"></div>
            <div style="padding:24px 24px 18px;border-bottom:1px solid #252525;background:#1a1a1a;">
                <p style="margin:0 0 6px;font-size:12px;letter-spacing:0.16em;color:#c8a24d;text-transform:uppercase;">
                    Panitia Resmi
                </p>
                <h1 style="margin:0;font-size:22px;line-height:1.35;color:#ffffff;font-weight:700;">
                    Kode OTP Verifikasi Akun
                </h1>
                <p style="margin:8px 0 0;font-size:13px;line-height:1.7;color:#b9b9b9;">
                    Pemilihan Duta Wisata Encik &amp; Puan Kota Batam 2026
                </p>
            </div>

            <div style="padding:24px;">
                <p style="margin:0 0 14px;font-size:14px;line-height:1.7;color:#f3f3f3;">
                    Halo {{ $name }},
                </p>

                <div style="margin:0 0 22px;padding:18px 18px 20px;border-radius:16px;background:#111111;border:1px solid #2d2d2d;">
                    <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#f3f3f3;font-weight:700;">
                        [BAHASA INDONESIA]
                    </p>
                    <p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#d8d8d8;">
                        Gunakan kode OTP berikut untuk menyelesaikan verifikasi akun peserta Anda.
                    </p>
                    <div style="margin:0 0 14px;padding:14px 16px;border-radius:14px;background:#191919;border:1px solid #3a3120;text-align:center;">
                        <div style="font-size:34px;line-height:1;letter-spacing:0.18em;color:#f5d06f;font-weight:700;">
                            {{ $otp }}
                        </div>
                    </div>
                    <p style="margin:0 0 10px;font-size:13px;line-height:1.7;color:#cfcfcf;">
                        Kode ini berlaku selama <strong style="color:#f5d06f;">{{ $expiresText }}</strong>.
                    </p>
                    <p style="margin:0;font-size:13px;line-height:1.7;color:#b3b3b3;">
                        Kode ini bersifat rahasia. Jangan beritahukan atau bagikan kode ini kepada siapa pun.
                    </p>
                </div>

                <div style="margin:0 0 20px;padding:18px 18px 20px;border-radius:16px;background:#111111;border:1px solid #2d2d2d;">
                    <p style="margin:0 0 10px;font-size:14px;line-height:1.6;color:#f3f3f3;font-weight:700;">
                        [ENGLISH]
                    </p>
                    <p style="margin:0 0 12px;font-size:14px;line-height:1.7;color:#d8d8d8;">
                        Use the following OTP code to complete your participant account verification.
                    </p>
                    <div style="margin:0 0 14px;padding:14px 16px;border-radius:14px;background:#191919;border:1px solid #3a3120;text-align:center;">
                        <div style="font-size:34px;line-height:1;letter-spacing:0.18em;color:#f5d06f;font-weight:700;">
                            {{ $otp }}
                        </div>
                    </div>
                    <p style="margin:0 0 10px;font-size:13px;line-height:1.7;color:#cfcfcf;">
                        This code is valid for <strong style="color:#f5d06f;">{{ $expiresText }}</strong>.
                    </p>
                    <p style="margin:0;font-size:13px;line-height:1.7;color:#b3b3b3;">
                        This code is confidential. Please do not share it with anyone.
                    </p>
                </div>

                <div style="padding-top:16px;border-top:1px dashed #333333;">
                    <p style="margin:0 0 8px;font-size:13px;line-height:1.7;color:#d8d8d8;">
                        Panitia Duta Wisata Kota Batam 2026
                    </p>
                    <p style="margin:0;font-size:12px;line-height:1.7;color:#8f8f8f;font-style:italic;">
                        Ini adalah email otomatis, mohon tidak membalas email ini.
                    </p>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
