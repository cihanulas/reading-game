@echo off
setlocal
title Okuma Adasi
cd /d "%~dp0"
if errorlevel 1 (
    echo Uygulama klasoru acilamadi.
    pause
    exit /b 1
)

where node >nul 2>&1
if errorlevel 1 goto missing_node
where npm >nul 2>&1
if errorlevel 1 goto missing_node

if not exist "node_modules\.bin\vite.cmd" (
    echo Gerekli paketler yukleniyor. Ilk kurulumda internet gerekir.
    call npm ci
    if errorlevel 1 (
        echo Paketler yuklenemedi. Internet baglantinizi kontrol edin.
        pause
        exit /b 1
    )
)

echo Okuma Adasi baslatiliyor. Tarayici otomatik acilacak.
echo Uygulamayi durdurmak icin bu pencereyi kapatin.
echo.
echo Bu bilgisayardan: http://127.0.0.1:5173/
for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.PrefixOrigin -ne 'WellKnown' } | Select-Object -First 1 -ExpandProperty IPAddress)"`) do set "LANIP=%%i"
if defined LANIP (
    echo Telefondan, ayni Wi-Fi ile: http://%LANIP%:5173/
    echo Adres http ile baslamali. https yazmayin; tarayici guvenli baglanti hatasi verir.
    echo 127.0.0.1 yalnizca bu bilgisayarda acilir. Telefonda kullanmayin.
) else (
    echo Telefon adresi bulunamadi. Asagida Vite'in yazdigi Network satirini kullanin.
)
echo.
call npm run dev -- --host --open
if errorlevel 1 (
    echo Uygulama baslatilamadi. Yukaridaki hata mesajini kontrol edin.
    pause
    exit /b 1
)
exit /b 0

:missing_node
echo Node.js bulunamadi. https://nodejs.org adresinden LTS surumunu kurun.
echo Kurulumdan sonra bu dosyaya yeniden cift tiklayin.
pause
exit /b 1