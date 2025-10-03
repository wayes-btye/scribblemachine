@echo off
REM Deploy Worker to Cloud Run
REM This script updates Cloud Run to use the latest built image

echo 🚀 Deploying worker to Cloud Run...

REM Get the latest commit SHA
for /f %%i in ('git rev-parse HEAD') do set COMMIT_SHA=%%i
echo 📝 Using commit: %COMMIT_SHA%

REM Construct the image name
set IMAGE_NAME=gcr.io/scribblemachine/github.com/wayes-btye/scribblemachine:%COMMIT_SHA%
echo 🐳 Image: %IMAGE_NAME%

REM Check if image exists
echo 🔍 Checking if image exists...
gcloud container images describe "%IMAGE_NAME%" >nul 2>&1
if errorlevel 1 (
    echo ❌ Image %IMAGE_NAME% not found!
    echo 💡 Make sure you've pushed to GitHub and Cloud Build has completed.
    echo 🔗 Check build status: https://console.cloud.google.com/cloud-build/builds
    pause
    exit /b 1
)

echo ✅ Image found, deploying to Cloud Run...

REM Deploy to Cloud Run
gcloud run services update scribblemachine-worker ^
    --region=europe-west1 ^
    --image="%IMAGE_NAME%" ^
    --platform=managed

echo 🎉 Deployment complete!
echo 🌐 Service URL: https://scribblemachine-worker-1001132689979.europe-west1.run.app
echo 💚 Health check: curl https://scribblemachine-worker-1001132689979.europe-west1.run.app/health
pause
