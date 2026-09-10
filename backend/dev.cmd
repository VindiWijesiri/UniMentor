@echo off
cd /d "%~dp0"
if not exist "node_modules\.bin\ts-node-dev.cmd" (
  echo Run npm install in this folder first.
  exit /b 1
)
".\node_modules\.bin\ts-node-dev.cmd" --respawn --transpile-only src\server.ts
