#!/bin/bash

# Скрипт для обновления PROJECT_MINDMAP.md из отдельных диаграмм

cat > PROJECT_MINDMAP.md << 'HEADER'
# Financial AI Analytics Platform - Complete Mindmap

Полная визуализация проекта **Financial AI Analytics Platform** - кросс-платформенного приложения для финансовой аналитики с использованием искусственного интеллекта.

---

HEADER

# Добавляем каждую диаграмму в правильном порядке
diagrams=(
    "diagrams/00-navigation.md"
    "diagrams/01-project-structure.md"
    "diagrams/02-system-architecture.md"
    "diagrams/02a-architecture-mvp.md"
    "diagrams/02b-architecture-tier2.md"
    "diagrams/02c-architecture-tier3.md"
    "diagrams/03-data-model.md"
    "diagrams/04-data-flow.md"
    "diagrams/05-flutter-structure.md"
    "diagrams/06-screens-mindmap.md"
    "diagrams/06a-screens-tier1.md"
    "diagrams/06b-screens-tier2.md"
    "diagrams/06c-screens-tier3.md"
    "diagrams/07-api-structure.md"
    "diagrams/08-ai-analysis-process.md"
    "diagrams/09-tech-stack.md"
    "diagrams/10-roadmap.md"
    "diagrams/11-security.md"
    "diagrams/12-performance.md"
    "diagrams/13-business-value.md"
    "diagrams/14-proof-points.md"
    "diagrams/15-integrations.md"
    "diagrams/16-security-compliance.md"
    "diagrams/17-competitive-advantages.md"
    "diagrams/18-implementation-support.md"
)

for diagram in "${diagrams[@]}"; do
    if [ -f "$diagram" ]; then
        echo "Добавляем $(basename $diagram)..."
        cat "$diagram" >> PROJECT_MINDMAP.md
        echo -e "\n---\n" >> PROJECT_MINDMAP.md
    else
        echo "⚠️ Файл $diagram не найден"
    fi
done

# Добавляем заключение
cat >> PROJECT_MINDMAP.md << 'FOOTER'

## Заключение

Этот mindmap представляет полную визуализацию проекта Financial AI Analytics Platform - кроссплатформенного приложения для финансовой аналитики с использованием искусственного интеллекта. Проект построен на современном технологическом стеке (Flutter + Node.js + PostgreSQL) с интеграцией передовых AI сервисов (OpenAI GPT-4 и Anthropic Claude).

**Ключевые особенности:**
- 🌐 Кроссплатформенность: работает на всех устройствах
- 🤖 AI-анализ: умная обработка финансовых данных
- 📊 Визуализация: понятные графики и отчеты
- ⚡ Производительность: быстрая обработка данных
- 🔒 Безопасность: защита данных на всех уровнях
FOOTER

echo "✅ PROJECT_MINDMAP.md успешно обновлен!"
