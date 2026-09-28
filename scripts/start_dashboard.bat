@echo off
REM Start the AGM OEE dashboard (webapp) via PM2 and open it in the browser.
REM Double-click to run.
REM Note: after changing webapp code, run "npm run build" in webapp/ before using this
REM (a data-only refresh does not need a rebuild).

cd /d "%~dp0..\webapp"
echo === Starting dashboard (PM2) ===
call npx pm2 startOrReload ecosystem.config.cjs

echo.
echo Opening browser in a moment...
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo === Dashboard is running at http://localhost:3000 ===
echo (To stop: run "npx pm2 stop agm-oee" from the webapp folder)
pause
