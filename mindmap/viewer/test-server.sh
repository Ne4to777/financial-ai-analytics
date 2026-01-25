#!/bin/bash

# Тестирование доступности всех файлов сервера

echo "🧪 Тестирование доступности файлов на http://localhost:8000"
echo ""

check_url() {
    local url=$1
    local name=$2
    local code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    
    if [ "$code" = "200" ]; then
        echo "✅ $name: OK ($code)"
    else
        echo "❌ $name: FAILED ($code)"
        return 1
    fi
}

echo "📊 Проверка viewer:"
check_url "http://localhost:8000/view-diagram-full.html" "Viewer"
echo ""

echo "📋 Проверка диаграмм:"
check_url "http://localhost:8000/diagrams/01-project-structure.md" "Диаграмма 01"
echo ""

echo "🎨 Проверка прототипов:"
check_url "http://localhost:8000/prototypes/index.html" "Prototypes Index"
check_url "http://localhost:8000/prototypes/01-landing.html" "Landing Page"
check_url "http://localhost:8000/prototypes/02-upload.html" "Upload Screen"
check_url "http://localhost:8000/prototypes/03-analysis.html" "Analysis Results"
echo ""

echo "✨ Все тесты завершены!"
echo ""
echo "🌐 Откройте в браузере:"
echo "   http://localhost:8000/view-diagram-full.html?diagram=prototypes"
