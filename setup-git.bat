@echo off
echo Inicializando repositorio git en la carpeta del proyecto...
cd /d "%~dp0"

:: Eliminar subcarpeta incorrecta si existe
if exist "Claude Code" (
    echo Eliminando carpeta incorrecta...
    rmdir /s /q "Claude Code"
)

:: Inicializar git
git init
git add .
git commit -m "feat: initial commit - TanStack Start + Railway config"
git branch -M main
git remote add origin https://github.com/amihanovich/que_veo.git
git push -u origin main

echo.
echo Listo! El codigo fue subido a github.com/amihanovich/que_veo
pause
