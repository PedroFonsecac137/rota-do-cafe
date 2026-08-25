@echo off
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js nao foi encontrado neste computador.
  echo Instale o Node.js e tente novamente.
  echo.
  pause
  exit /b 1
)
if not exist "node_modules\" (
  echo Preparando o jogo pela primeira vez...
  call npm install
  if errorlevel 1 (
    echo Nao foi possivel instalar as dependencias.
    pause
    exit /b 1
  )
)
echo Iniciando Rota do Cafe...
echo O cadastro sera salvo em participantes.txt
echo Aguarde o navegador abrir automaticamente...
call npm run dev -- --host 127.0.0.1 --port 5188 --open
if errorlevel 1 (
  echo.
  echo Nao foi possivel iniciar o jogo.
  echo Feche outras janelas pretas do Rota do Cafe e tente novamente.
  echo.
  pause
)
