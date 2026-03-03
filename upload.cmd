@echo off

echo Building gravity...
cd gravity
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: gravity build failed!
    exit /b 1
)
cd ..

echo Building lapogen...
cd lapogen
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: lapogen build failed!
    exit /b 1
)
cd ..

echo Building stefan-boltzmann...
cd StefBolz
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: stefan-boltzmann build failed!
    exit /b 1
)
cd ..

echo Uploading gravity...
xcopy /E /I /Y gravity\dist\* W:\labweb\gravity\

echo Uploading lapogen...
xcopy /E /I /Y lapogen\dist\* W:\labweb\optron\

echo Uploading stefan-boltzmann...
xcopy /E /I /Y StefBolz\dist\* W:\labweb\stefan-boltzmann\

echo Uploading homepage...
xcopy /E /I /Y homepage\* W:\labweb\

echo Done!