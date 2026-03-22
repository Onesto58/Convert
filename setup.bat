@echo off
call npx --yes create-vite@latest temp-app --template react-ts
xcopy /E /I /Y temp-app .
rmdir /s /q temp-app
call npm install
call npm install xlsx lucide-react "@dnd-kit/core" "@dnd-kit/sortable" "@dnd-kit/utilities" "@supabase/supabase-js"
call npm install -D tailwindcss postcss autoprefixer
call npx tailwindcss init -p
