@echo off
echo Starting TikTok Live Game...

start cmd /k "cd server && npm start"
start cmd /k "cd client && npm run dev"

echo Game started!
echo Backend: http://localhost:3000
echo Frontend: http://localhost:5173 (usually)
echo Open the Frontend URL in your browser.
pause
