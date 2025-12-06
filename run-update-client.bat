@echo off
cd /d %~dp0
powershell -ExecutionPolicy Bypass -File ".\update-client.ps1"
pause
