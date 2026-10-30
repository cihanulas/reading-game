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

echo Bu bilgisayardan adres her zaman: http://127.0.0.1:5173/
echo Port 5173 sabittir. Baska porta gecmek kayitlari gizler.
echo.
powershell -NoProfile -Command "try { $c = New-Object System.Net.Sockets.TcpClient; $c.Connect('127.0.0.1', 5173); $c.Close(); exit 0 } catch { exit 1 }"
if not errorlevel 1 (
    echo Oyun zaten acik. Tarayici ayni adrese gidiyor.
    start http://127.0.0.1:5173/
    exit /b 0
)

echo Okuma Adasi baslatiliyor. Tarayici otomatik acilacak.
echo Uygulamayi durdurmak icin bu pencereyi kapatin.
echo.
for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "(Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.PrefixOrigin -ne 'WellKnown' } | Select-Object -First 1 -ExpandProperty IPAddress)"`) do set "LANIP=%%i"
if defined LANIP (
    echo Telefondan, ayni Wi-Fi ile: http://%LANIP%:5173/
    echo Adres http ile baslamali. https yazmayin; tarayici guvenli baglanti hatasi verir.
    echo 127.0.0.1 yalnizca bu bilgisayarda acilir. Telefonda kullanmayin.
) else (
    echo Telefon adresi bulunamadi. Asagida Vite'in yazdigi Network satirini kullanin.
)
echo.
start "" cmd /c "ping -n 4 127.0.0.1 >nul & start http://127.0.0.1:5173/"
call npm run dev -- --host --port 5173 --strictPort
if errorlevel 1 (
    echo Port 5173 acilamadi. Eski Okuma Adasi penceresini kapatip yeniden deneyin.
    echo Kayitlar http://127.0.0.1:5173/ adresinde durur.
    pause
    exit /b 1
)
exit /b 0

:missing_node
echo Node.js bulunamadi. https://nodejs.org adresinden LTS surumunu kurun.
echo Kurulumdan sonra bu dosyaya yeniden cift tiklayin.
pause
exit /b 1