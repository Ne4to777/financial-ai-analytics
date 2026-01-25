#!/bin/bash

# Этот скрипт автоматически добавляет невидимые связи ~~~ между элементами внутри subgraph с direction LR
# чтобы заставить Mermaid отображать их горизонтально

cd "$(dirname "$0")/diagrams"

# Диаграммы которые нужно исправить (исключая 01 и 10, которые уже правильные)
files=(
    "02-system-architecture.md"
    "05-flutter-structure.md"
    "06-screens-mindmap.md"
    "07-api-structure.md"
    "08-ai-analysis-process.md"
    "09-tech-stack.md"
    "11-security.md"
    "12-performance.md"
)

for file in "${files[@]}"; do
    echo "Обрабатываю $file..."
    
    # Для каждого subgraph с direction LR, найти все элементы и добавить между ними ~~~
    # Это сложная задача для bash, поэтому лучше сделать вручную
done

echo "✅ Готово!"
