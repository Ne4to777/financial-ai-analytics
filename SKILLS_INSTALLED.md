# ✅ Установленные AI Coding Skills

**Дата:** 26 января 2026  
**Проект:** FinAI Analytics

---

## 🎉 Что установлено

### 1. **Ralph Wiggum Skills** (Autonomous Coding)

📍 **Расположение:** `.cursor/rules/actions/*.mdc` (локально, не в git)

**9 skills для автономной разработки:**

| Skill | Invoke | Назначение |
|-------|--------|-----------|
| 🎯 PRD Generator | `@generate-prd` | Создание PRD через диалог |
| 📋 Task Breakdown | `@generate-tasks` | Разбивка PRD на задачи |
| 🤖 Autonomous Coding | `@ralph-hybrid` | Overnight/AFK кодирование |
| 👨‍💻 Interactive Coding | `@ralph-manual` | Human-in-loop разработка |
| 🔄 PR Management | `@pr-workflow` | Полный lifecycle PR |
| 🚀 Dev Server | `@setup-local-dev` | Persistent server (pm2) |
| 🌿 Safe Branching | `@multi-agent-branching` | Multi-agent изоляция |
| 🧠 Opus Planning | `@opus-planning-subagents` | Opus для sub-agents |
| ✨ Animation | `@Animation` | Design engineering |

**Источник:** https://github.com/daniel-scrivner/cursor-skills

---

### 2. **Next.js TypeScript Tailwind Rules**

📍 **Расположение:** `.cursorrules` (в git)

**Stack:**
- Framework: Next.js (React)
- Language: TypeScript
- UI: shadcn/ui (Radix primitives)
- Styling: Tailwind CSS
- Icons: Lucide React

**Применяется автоматически** ко всем файлам проекта.

**Источник:** https://github.com/PatrickJS/awesome-cursorrules

---

### 3. **Python FastAPI Rules**

📍 **Расположение:** `.cursor/rules/python-fastapi.cursorrules` (локально)

**Stack:**
- Framework: FastAPI
- Validation: Pydantic v2
- Async: asyncpg / aiomysql
- ORM: SQLAlchemy 2.0

**Применяется** когда работаешь с Python backend.

**Источник:** https://github.com/PatrickJS/awesome-cursorrules

---

### 4. **UI UX Pro Max** (уже был установлен ранее)

📍 **Расположение:** `.cursor/commands/`, `.shared/ui-ux-pro-max/` (локально)

**Возможности:**
- 57 UI styles
- 95 color palettes  
- 56 font combinations
- 98 UX best practices
- Design System Generator

**Источник:** https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

---

## 🚀 Quick Start

### **Пример 1: Новая фича**

```bash
# 1. Создать PRD
@generate-prd Хочу добавить dashboard с метриками

# 2. Разбить на задачи  
@generate-tasks based on tasks/prd-dashboard.md

# 3. Реализовать
@ralph-manual   # Интерактивно (шаг за шагом)
# ИЛИ
@ralph-hybrid   # Автономно (overnight)

# 4. Создать PR
@pr-workflow
```

---

### **Пример 2: Улучшить UI**

```bash
# Анализ текущего дизайна
@ui-ux-pro-max Analyze landing page

# Получить рекомендации
python3 .shared/ui-ux-pro-max/scripts/search.py "fintech dashboard" --domain style

# Применить
@ralph-manual Implement design recommendations
```

---

## 📚 Документация

### **Главный гайд**
👉 **[CURSOR_SKILLS_GUIDE.md](CURSOR_SKILLS_GUIDE.md)** — полное руководство (500+ строк)

**Содержит:**
- Детальное описание каждого skill
- 3 полных workflow examples
- Best practices & troubleshooting
- File structure
- Quick start checklist

### **Другие файлы**
- `tasks/README.md` — как работать с PRD и tasks
- `README.md` — обновлён с секцией AI Skills

---

## 🔧 Что дальше?

### **Опционально (для расширенных возможностей):**

1. **Установить Claude CLI** (для `@ralph-hybrid`)
   ```bash
   brew install anthropics/claude/claude
   ```

2. **Установить pm2** (для `@setup-local-dev`)
   ```bash
   npm install -g pm2
   ```

3. **Попробовать первый PRD**
   ```bash
   @generate-prd Хочу добавить страницу профиля пользователя
   ```

---

## ✅ Что уже работает (без дополнительной установки)

- ✅ `@generate-prd` — создание PRD
- ✅ `@generate-tasks` — разбивка на задачи
- ✅ `@ralph-manual` — интерактивное кодирование
- ✅ `@pr-workflow` — управление PR
- ✅ `@multi-agent-branching` — безопасная работа (auto-apply)
- ✅ Next.js TypeScript rules — применяются автоматически
- ✅ Python FastAPI rules — применяются для Python файлов

---

## 🆘 Помощь

**В Cursor chat:**
```
@generate-prd help
@ralph-manual help
@pr-workflow help
```

**Или спроси напрямую:**
- "Как использовать Ralph Wiggum?"
- "Покажи пример PRD"
- "Как создать автономное кодирование?"

---

**Удачи в разработке!** 🚀

_Все skills установлены и готовы к использованию._
