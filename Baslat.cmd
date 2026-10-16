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
call npm run dev -- --host 127.0.0.1 --open
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