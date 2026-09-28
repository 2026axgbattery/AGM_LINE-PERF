@echo off
REM Download SMES data for the previous day (detail + summary) and load it into the
REM webapp SQLite database. Double-click to run.
REM Prerequisite: SMES must already be logged in and visible on screen (not minimized).

cd /d "%~dp0..\.."
echo === Downloading SMES data for the previous day and updating the webapp ===
".venv\Scripts\python.exe" "scripts\smes_automation\run_daily_update.py"

echo.
echo === Exit code: %ERRORLEVEL% ===
pause
