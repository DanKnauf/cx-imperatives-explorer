@echo off
echo ============================================
echo  CX Imperatives 2026 - Data Explorer
echo ============================================
echo.
echo Starting local web server on http://localhost:8080
echo Open this URL in your browser to view the app.
echo.
echo Press Ctrl+C to stop the server.
echo.
cd /d "%~dp0docs"
python -m http.server 8080
pause
