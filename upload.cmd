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

echo Uploading gravity...
xcopy /E /I /Y gravity\dist\* W:\labweb\gravity\

echo Uploading lapogen...
xcopy /E /I /Y lapogen\dist\* W:\labweb\optron\

echo Done!