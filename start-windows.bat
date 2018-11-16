pushd .
setlocal


rem ======================================================================
rem Python Setup
rem ======================================================================
rem This defaults to using the C:\Python34 path, but you can optionally
rem hard-code a different path here or set it before calling this script.

rem set python3_dir="C:\Custom\Path"
if not defined python3_dir (
	if not exist "c:\Python37" (
	   echo "Downloading Python37..."
	   powershell -command "[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12 ; wget https://www.python.org/ftp/python/3.7.1/python-3.7.1.exe -outfile python-3.7.1.exe"
	   
	   echo "Installing Python37..."
	   start "Installing Python3.7.1 ..." /wait python-3.7.1.exe  /quiet InstallAllUsers=1 PrependPath=1 Include_test=0 TargetDir=c:\Python37
	)
	set python3_dir=C:\Python37
)

rem ======================================================================
rem NodeJS Setup
rem ======================================================================

rem set nodejs_dir="C:\Custom\Path"
if not defined nodejs_dir (
	rem Download and install NodeJS
	if not exist "c:\Program Files\nodejs" (
	   powershell -command "[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12 ; wget https://nodejs.org/dist/v10.13.0/node-v10.13.0-x64.msi -outfile node-v10.13.0-x64.msi"
	   start "Installing NodeJS..." /wait node-v10.13.0-x64.msi
	)
	
	set nodejs_dir=C:\Program Files\nodejs\npm
)

rem Add NodeJS to the path -- makes life easier
set path=%nodejs_dir%;%path%

rem ======================================================================
rem Yarn Setup
rem ======================================================================

rem set yarn_dir="C:\Custom\Path"
if not defined yarn_dir (
	rem Download and install Yarn
	if not exist "C:\Program Files (x86)\Yarn" (
	   powershell -command "[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12 ; wget https://yarnpkg.com/latest.msi -outfile yarn.msi"
	   start "Installing Yarn..." /wait yarn.msi
	)
)

rem ======================================================================
rem ffmpeg Setup
rem ======================================================================

rem set ffmpeg_path="C:\Custom\Path"
rem Download and install Yarn
if not exist backend\ffmpeg.exe (
   echo "Installing FFMPEG..."
   powershell -command "[Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12 ; wget https://ffmpeg.zeranoe.com/builds/win64/static/ffmpeg-20181114-1096614-win64-static.zip -outfile ffmpeg.zip"
   powershell -command "Expand-Archive -Path "ffmpeg.zip" -DestinationPath "ffmpeg"
   copy ffmpeg\ffmpeg-20181114-1096614-win64-static\bin\ffmpeg.exe backend\ffmpeg.exe
)

rem ======================================================================
rem Start Python backend
rem ======================================================================
cd backend
set CORPUS=english_corpus.csv
"%python3_dir%\scripts\pip.exe" install -r requirements.txt
start "Python Backend" "%python3_dir%\python.exe" run.py
cd ..

rem ======================================================================
rem Start web server
rem ======================================================================

cd frontend
"%python3_dir%\Scripts\pip.exe" install -r requirements.txt
cmd /c yarn install
yarn start


:Exit
popd