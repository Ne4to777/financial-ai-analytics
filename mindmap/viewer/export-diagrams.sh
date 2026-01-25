#!/bin/bash
# Скрипт для экспорта всех диаграмм в SVG формат

echo "🎨 Financial AI Analytics - Diagram Export Tool"
echo "================================================"
echo ""

# Создаем папку для экспорта
mkdir -p exported-diagrams

# Проверяем наличие mermaid-cli
if ! command -v mmdc &> /dev/null; then
    echo "❌ mermaid-cli не установлен"
    echo "📦 Установка mermaid-cli..."
    npm install -g @mermaid-js/mermaid-cli
    
    if [ $? -ne 0 ]; then
        echo "❌ Ошибка установки. Попробуйте вручную:"
        echo "   npm install -g @mermaid-js/mermaid-cli"
        exit 1
    fi
fi

echo "✅ mermaid-cli найден"
echo ""

# Счетчик экспортированных файлов
count=0

# Экспортируем все диаграммы
for file in docs/diagrams/*.md; do
    # Пропускаем README.md
    if [[ $file == *"README.md" ]]; then
        continue
    fi
    
    filename=$(basename "$file" .md)
    echo "📊 Экспорт: $filename..."
    
    # Экспорт в SVG (векторный формат, бесконечный зум!)
    mmdc -i "$file" \
         -o "exported-diagrams/${filename}.svg" \
         -b transparent \
         -t default
    
    if [ $? -eq 0 ]; then
        echo "   ✅ Создан: exported-diagrams/${filename}.svg"
        ((count++))
    else
        echo "   ❌ Ошибка при экспорте $filename"
    fi
    echo ""
done

echo "================================================"
echo "✨ Готово! Экспортировано диаграмм: $count"
echo ""
echo "📂 Файлы находятся в: ./exported-diagrams/"
echo ""
echo "🔍 Как открыть с зумом:"
echo "   1. Откройте SVG файл в браузере (Safari, Chrome, Firefox)"
echo "   2. Используйте Cmd/Ctrl + Plus/Minus для зума"
echo "   3. SVG = векторный формат = бесконечный зум без потери качества!"
echo ""
echo "💡 Совет: Для лучшего просмотра используйте:"
echo "   - macOS: Safari или Preview"
echo "   - Windows: Edge или Chrome"
echo "   - Linux: Firefox или Inkscape"
echo ""
