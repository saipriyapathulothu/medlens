@echo off
echo ========================================================
echo        Pushing MedLens to GitHub: saipriyapathulothu
echo ========================================================
echo.

:: Refresh environment PATH so git is recognized
set "PATH=%PATH%;%LOCALAPPDATA%\Microsoft\WinGet\Packages\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\cmd"
set "PATH=%PATH%;%LOCALAPPDATA%\Microsoft\WinGet\Packages\Git.MinGit_Microsoft.Winget.Source_8wekyb3d8bbwe\bin"

cd /d "%~dp0"

echo [1/2] Checking git status...
git status

echo.
echo [2/2] Pushing code to https://github.com/saipriyapathulothu/medlens.git ...
echo (If prompted, please sign in with your GitHub account in the browser or enter your Personal Access Token)
echo.

git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo ========================================================
    echo SUCCESS! Your code is now live on GitHub:
    echo https://github.com/saipriyapathulothu/medlens
    echo ========================================================
) else (
    echo.
    echo [NOTICE] If authentication failed, you can push using a GitHub Personal Access Token (PAT):
    echo Run: git push https://YOUR_TOKEN@github.com/saipriyapathulothu/medlens.git main
)

echo.
pause
