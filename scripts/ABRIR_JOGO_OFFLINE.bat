@echo off
setlocal
cd /d "%~dp0"
title Rota do Cafe - Feira Offline

if not exist "node.exe" (
  echo ERRO: node.exe nao foi encontrado nesta pasta.
  echo Copie novamente o pacote completo do jogo.
  pause
  exit /b 1
)

if not exist "site\index.html" (
  echo ERRO: Os arquivos do jogo nao foram encontrados.
  echo Copie novamente o pacote completo do jogo.
  pause
  exit /b 1
)

echo Iniciando Rota do Cafe em modo offline...
echo Nao feche esta janela durante o evento.
echo.
"%~dp0node.exe" "%~dp0offline-server.cjs"

if errorlevel 1 (
  echo.
  echo O jogo foi encerrado com erro.
  pause
)
