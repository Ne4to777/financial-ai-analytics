# 🚀 Cursor Skills & Rules — Руководство для FinAI Analytics

> **Статус:** Установлено 26 января 2026  
> **Версия:** 1.0  
> **Проект:** FinAI Analytics (финансовая аналитика)

---

## 📦 Установленные Skills & Rules

### 1. ✅ **Ralph Wiggum Skills** (Autonomous Coding)

**Расположение:** `.cursor/rules/actions/*.mdc`

**Что установлено:**
- ✅ `@generate-prd` — Создание PRD через структурированный диалог
- ✅ `@generate-tasks` — Разбивка PRD на actionable задачи
- ✅ `@ralph-hybrid` — Полностью автономное кодирование (overnight/AFK)
- ✅ `@ralph-manual` — Интерактивное кодирование (human-in-the-loop)
- ✅ `@pr-workflow` — Comprehensive PR lifecycle management
- ✅ `@setup-local-dev` — Persistent dev server с pm2
- ✅ `@multi-agent-branching` — Изоляция concurrent агентов (auto-applied)
- ✅ `@opus-planning-subagents` — Использование Opus для sub-agents
- ✅ `@Animation` — Design engineering principles (Emil Kowalski)

**Источник:** https://github.com/daniel-scrivner/cursor-skills

---

### 2. ✅ **Next.js + TypeScript + Tailwind Rules**

**Расположение:** `.cursorrules`

**Tech Stack:**
- Framework: Next.js (React)
- Language: TypeScript
- UI: shadcn/ui (Radix UI primitives)
- Styling: Tailwind CSS
- Icons: Lucide React

**Источник:** https://github.com/PatrickJS/awesome-cursorrules

---

### 3. ✅ **Python FastAPI Rules**

**Расположение:** `.cursor/rules/python-fastapi.cursorrules`

**Stack:**
- Framework: FastAPI
- Validation: Pydantic v2
- Async: asyncpg / aiomysql
- ORM: SQLAlchemy 2.0

**Источник:** https://github.com/PatrickJS/awesome-cursorrules

---

### 4. ✅ **UI UX Pro Max Skill** (уже был установлен)

**Расположение:** `.cursor/commands/ui-ux-pro-max.md`, `.shared/ui-ux-pro-max/`

**Возможности:**
- 57 UI styles
- 95 color palettes
- 56 font combinations
- 98 UX best practices
- AI-powered Design System Generator

**Источник:** https://github.com/nextlevelbuilder/ui-ux-pro-max-skill

---

## 🎯 Как использовать Skills

### **Полный Workflow: От идеи до PR**

```mermaid
graph LR
    A[Идея фичи] --> B[@generate-prd]
    B --> C[PRD документ]
    C --> D[@generate-tasks]
    D --> E[Список задач]
    E --> F{Режим работы?}
    F -->|Автономно| G[@ralph-hybrid]
    F -->|Интерактивно| H[@ralph-manual]
    G --> I[Готовый код]
    H --> I
    I --> J[@pr-workflow]
    J --> K[Merged PR]
```

---

## 📚 Детальное руководство по каждому skill

### 1️⃣ **@generate-prd** — Создание Product Requirements Document

**Когда использовать:** В начале работы над новой фичей

**Как работает:**
1. Ты описываешь фичу в свободной форме
2. AI задаёт 3-5 уточняющих вопросов с вариантами ответов
3. Ты отвечаешь: `1A, 2C, 3B`
4. AI генерирует полный PRD

**Пример:**
```
USER: @generate-prd Хочу добавить dark mode в приложение

AI: Отлично! Задам несколько вопросов:

1. Переключение режима:
   A) Toggle кнопка в navbar
   B) Автоматически по системным настройкам
   C) Оба варианта

2. Сохранение выбора:
   A) LocalStorage
   B) User preferences API
   C) Не сохранять

3. Scope:
   A) Только UI компоненты
   B) UI + charts/graphs
   C) Full app + все external embeds

USER: 1C, 2A, 3B

AI: Создаю PRD...
✅ Сохранено в: tasks/prd-dark-mode.md
```

**Структура PRD:**
- **Goals & Success Metrics** (что хотим достичь)
- **User Stories** (AS A... I WANT... SO THAT...)
- **Functional Requirements** (P0/P1/P2 priority)
- **Non-Goals** (что явно НЕ входит в scope)
- **Technical Considerations** (архитектурные решения)

---

### 2️⃣ **@generate-tasks** — Разбивка на задачи

**Когда использовать:** После утверждения PRD

**Как работает:**
1. **Phase 1:** Генерация parent tasks
2. Ты подтверждаешь: `Go`
3. **Phase 2:** Разбивка на sub-tasks

**Пример:**
```
USER: @generate-tasks based on tasks/prd-dark-mode.md

AI: 
Parent tasks:
- [ ] 0.0 Create feature branch (feat/dark-mode-20260126)
- [ ] 1.0 Create ThemeProvider component
- [ ] 2.0 Implement theme toggle UI
- [ ] 3.0 Update existing components
- [ ] 4.0 Add color scheme for charts
- [ ] 5.0 Write tests
- [ ] 6.0 Create PR and merge (see @pr-workflow)

Подтвердить? (скажи "Go")

USER: Go

AI:
✅ Breaking down into sub-tasks...

- [ ] 1.0 Create ThemeProvider component
  - [ ] 1.1 Create context (ThemeContext.tsx)
  - [ ] 1.2 Implement useTheme hook
  - [ ] 1.3 Add system preference detection
  - [ ] 1.4 Setup localStorage sync
  
✅ Сохранено в: tasks/tasks-dark-mode.md
```

**Принципы:**
- **Всегда** включает создание feature branch
- **Всегда** включает PR task с ссылкой на `@pr-workflow`
- Задачи достаточно мелкие (one context window)
- Написаны для junior developer (explicit, actionable)

---

### 3️⃣ **@ralph-hybrid** — Автономное кодирование (Overnight)

**Когда использовать:** 
- AFK работа (уходишь спать / на встречу)
- Хочешь проснуться с готовым кодом
- Есть чёткий task list

**Требования:**
- ✅ Установлен Claude CLI (`brew install anthropics/claude/claude`)
- ✅ Есть файл `tasks/prd.json` или `tasks/tasks-*.md`

**Как работает:**
```bash
# 1. Инициализировать Ralph
@ralph-hybrid

# 2. Отредактировать task list (опционально)
vim scripts/ralph/prd.json

# 3. Запустить (25 iterations)
./scripts/ralph/ralph.sh 25

# 4. Идти спать 😴

# 5. Утром проверить результат
git log --oneline
cat scripts/ralph/progress.txt
```

**Структура файлов:**
```
scripts/ralph/
├── ralph.sh              # Bash loop
├── prd.json             # Task list (что делать)
├── progress.txt         # Learnings (patterns, gotchas)
└── README.md            # Инструкции
```

**Что делает Ralph в цикле:**
```python
while tasks_remain and iterations < MAX:
    task = pick_next_task_from(prd.json)
    implement(task)
    if tests_pass():
        git_commit(task)
        mark_done_in(prd.json)
        log_learnings_to(progress.txt)
    else:
        log_failure()
        retry_or_skip()
```

**Пример `prd.json`:**
```json
{
  "stories": [
    {
      "id": "US-001",
      "title": "Create ThemeProvider",
      "passes": false,
      "files": ["components/ThemeProvider.tsx"]
    },
    {
      "id": "US-002", 
      "title": "Add theme toggle button",
      "passes": false,
      "files": ["components/ThemeToggle.tsx"]
    }
  ]
}
```

**Важно:**
- ✅ Задачи должны быть **маленькими** (fit in one context window)
- ✅ Ralph учится на ошибках (сохраняет в `progress.txt`)
- ✅ Каждая задача = один commit
- ❌ Не запускай на критических фичах без review

---

### 4️⃣ **@ralph-manual** — Интерактивное кодирование

**Когда использовать:**
- Учишься работать с Ralph
- Хочешь контроль после каждой задачи
- Сложная фича, требующая steering

**Как работает:**
```
# 1. Инициализировать
@ralph-manual

# 2. Повторять для каждой задачи
@ralph-manual   # Делает US-001, коммитит, останавливается
# Проверяешь код, всё ОК?
@ralph-manual   # Делает US-002, коммитит, останавливается
# Проверяешь, всё ОК?
@ralph-manual   # Делает US-003...
```

**Разница с @ralph-hybrid:**

| Аспект | @ralph-hybrid | @ralph-manual |
|--------|---------------|---------------|
| Запуск | Bash loop + Claude CLI | Cursor chat invocations |
| Автономность | Полная (overnight) | После каждой задачи |
| Контроль | Review в конце | Review после каждой |
| Требования | Claude CLI | Только Cursor |
| Best for | AFK work | Learning, steering |

---

### 5️⃣ **@pr-workflow** — Comprehensive PR Management

**Когда использовать:** Всегда, когда создаёшь PR

**Что делает:**

#### **Phase 1: Pre-PR Checks**
```bash
✓ pnpm typecheck
✓ pnpm test
✓ Security scan (no hardcoded secrets/paths)
✓ Find and use PR template (.github/pull_request_template.md)
```

#### **Phase 2: Autonomous Monitoring**
```
┌─────────────────────────────────┐
│ Poll every 30-60s:              │
│ • Check mergeable_state         │
│ • Read ALL bot comments         │
│ • Address EVERY feedback        │
│ • Push fixes                    │
│ • Reply to comments             │
│ • Wait for re-validation        │
└─────────────────────────────────┘
```

#### **Phase 3: Merge (only when mergeable_state = "clean")**
```
✓ All CI checks passed
✓ Zero unaddressed comments
✓ All review threads resolved
→ Execute merge
```

**CRITICAL INSIGHT:**
```
❌ mergeable: true          → Only means "no git conflicts"
✅ mergeable_state: "clean" → Means "all checks passed"

NEVER merge on mergeable alone! Use mergeable_state.
```

**Пример:**
```
USER: @pr-workflow

AI:
🔍 Running pre-PR checks...
✅ Typecheck passed
✅ Tests passed  
✅ No hardcoded secrets
✅ Found PR template

📝 Creating PR...
✅ PR created: #123

🤖 Monitoring PR (polling every 60s)...
⏳ Waiting for CI checks...

❌ Linter found 3 issues
🔧 Fixing issues...
✅ Pushed fixes

⏳ Waiting for re-validation...
✅ All checks passed (mergeable_state: "clean")

🎉 Merging PR #123...
✅ Merged successfully!
```

---

### 6️⃣ **@setup-local-dev** — Persistent Dev Server

**Когда использовать:** В начале каждой coding сессии

**Проблема:**
- Dev server умирает при закрытии терминала
- Нет auto-restart при краше
- Логи теряются или загромождают context window

**Решение: pm2**
```bash
USER: @setup-local-dev

AI:
🔍 Checking if dev server already running...
❌ Not running

📦 Pulling latest changes...
✅ git pull completed

🚀 Starting dev server with pm2...
✅ Server started on http://localhost:3000

📊 Server status:
  Name: finai-dev
  Status: online
  CPU: 0%
  Memory: 45MB
  Uptime: 2s
```

**Доступные команды:**
```bash
pnpm pm2:start    # Start dev server (persistent)
pnpm pm2:stop     # Stop dev server
pnpm pm2:restart  # Restart dev server
pnpm pm2:logs     # View last 100 lines
pnpm pm2:status   # Check if running
```

**Для AI agents (efficient log search):**
```bash
pm2 logs --lines 50 --nostream              # Quick status
pm2 logs --lines 200 --nostream | grep -i "error"  # Find errors
```

---

### 7️⃣ **@multi-agent-branching** — Safe Concurrent Work

**Что делает:** Автоматически применяется ко **всем** сессиям (auto-applied)

**Проблема:**
```
Agent A коммитит в main
Agent B (не знает об Agent A) коммитит в main
→ Agent B перезаписывает код Agent A
→ Chaos
```

**Решение:**
```
✓ Проверяет branch перед ЛЮБЫМ редактированием
✓ Создаёт уникальный feature branch если на main/master
✓ Использует timestamps для уникальности имён
✓ Merge только через PRs
```

**Workflow:**
```bash
# 1. git branch --show-current
# ↓
# 2. На main/master? → git checkout -b feat/dark-mode-20260126-223015
# ↓
# 3. Делает изменения, коммитит в feature branch
# ↓
# 4. git push -u origin HEAD
# ↓
# 5. Создаёт PR через @pr-workflow
```

**Key Rules:**
- ✅ MUST: Create branch BEFORE any code changes
- ✅ MUST: Use unique names (timestamps)
- ❌ NEVER: Commit directly to main/master
- ❌ NEVER: Force push without explicit permission

---

### 8️⃣ **@Animation** — Design Engineering Principles

**Автор:** Emil Kowalski

**Когда использовать:**
- Создание UI компонентов
- Добавление animations
- Работа с forms
- Accessibility (a11y)

**Темы:**
- Timing functions (ease-in, ease-out)
- Spring physics
- Gesture interactions
- Loading states
- Micro-interactions

---

### 9️⃣ **@opus-planning-subagents** — Opus for Planning

**Что делает:** Auto-applied для всех planning mode sub-agents

**Использует Claude Opus** вместо Sonnet для:
- Architectural decisions
- Task breakdown
- PRD generation
- System design

---

## 🎬 Complete Workflow Examples

### **Example 1: Новая UI фича (Dark Mode)**

```bash
# 1. DEFINE
@generate-prd Хочу добавить dark mode
# → tasks/prd-dark-mode.md

# 2. PLAN
@generate-tasks based on tasks/prd-dark-mode.md
# → tasks/tasks-dark-mode.md

# 3. IMPLEMENT (выбираешь один из вариантов)

## Option A: Overnight (autonomous)
@ralph-hybrid
./scripts/ralph/ralph.sh 25
# → Идёшь спать, утром готовый код

## Option B: Interactive (human-in-loop)
@ralph-manual   # US-001
@ralph-manual   # US-002
@ralph-manual   # US-003
# → Контроль после каждой задачи

# 4. MERGE
@pr-workflow
# → Автоматически создаёт PR, мониторит, мержит
```

---

### **Example 2: Backend API endpoint**

```bash
# 1. PRD
@generate-prd Создать API endpoint для upload файлов

# 2. Tasks
@generate-tasks based on tasks/prd-file-upload-api.md

# 3. Switch to Python FastAPI rules
# (просто упомяни в chat что работаешь с Python)

# 4. Implement
@ralph-manual

# 5. PR
@pr-workflow
```

---

### **Example 3: UI Design improvement**

```bash
# 1. Analyze current design
@ui-ux-pro-max Analyze landing page design

# 2. Get recommendations
python3 .shared/ui-ux-pro-max/scripts/search.py "fintech dashboard" --domain style

# 3. Apply improvements
@ralph-manual Implement design recommendations
```

---

## 📁 File Structure

```
/Users/nybble/projects/ident/
├── .cursor/
│   ├── commands/
│   │   └── ui-ux-pro-max.md           # UI/UX skill
│   └── rules/
│       ├── actions/                    # Ralph Wiggum skills
│       │   ├── Animation.mdc
│       │   ├── generate-prd.mdc
│       │   ├── generate-tasks.mdc
│       │   ├── multi-agent-branching.mdc
│       │   ├── opus-planning-subagents.mdc
│       │   ├── pr-workflow.mdc
│       │   ├── ralph-hybrid.mdc
│       │   ├── ralph-manual.mdc
│       │   └── setup-local-dev.mdc
│       └── python-fastapi.cursorrules  # Python rules
│
├── .shared/
│   └── ui-ux-pro-max/                  # UI/UX data
│       ├── data/
│       └── scripts/
│
├── .cursorrules                        # Next.js TypeScript rules
│
├── tasks/                              # Generated by skills
│   ├── prd-*.md
│   └── tasks-*.md
│
└── scripts/
    └── ralph/                          # Generated by @ralph-hybrid
        ├── ralph.sh
        ├── prd.json
        └── progress.txt
```

---

## 🎯 Best Practices

### ✅ DO:

1. **Start with PRDs**  
   Don't jump to coding. `@generate-prd` предотвращает переделки.

2. **Break tasks small**  
   Каждая задача = one context window. При сомнении — split.

3. **Let learnings compound**  
   Ralph становится умнее с каждой задачей (`progress.txt`).

4. **Trust completion promise**  
   Не помечай done, пока не готово. Two-phase verification не зря.

5. **Review diffs**  
   Даже с autonomous coding — проверь перед merge.

6. **Use persistent dev server**  
   `@setup-local-dev` в начале каждой сессии.

### ❌ DON'T:

1. ❌ Commit directly to main (используй `@multi-agent-branching`)
2. ❌ Skip tests before PR (используй `@pr-workflow`)
3. ❌ Make tasks too big (one context window rule)
4. ❌ Merge on `mergeable: true` (используй `mergeable_state: "clean"`)
5. ❌ Run Ralph hybrid на critical features без review

---

## 🔧 Troubleshooting

### **Ralph не запускается**

**Проблема:** `./scripts/ralph/ralph.sh: command not found`

**Решение:**
```bash
# 1. Проверь, что файл существует
ls -la scripts/ralph/ralph.sh

# 2. Если нет, инициализируй Ralph
@ralph-hybrid

# 3. Дай права на выполнение
chmod +x scripts/ralph/ralph.sh
```

---

### **PR workflow не может смержить**

**Проблема:** "CI checks still running"

**Решение:**
```bash
# Проверь mergeable_state (НЕ mergeable!)
gh pr view 123 --json mergeableState

# Если "BLOCKED" → проверь что блокирует
gh pr view 123 --json statusCheckRollup

# Ralph будет ждать, пока не станет "clean"
```

---

### **Dev server не стартует**

**Проблема:** `pm2 start` fails

**Решение:**
```bash
# 1. Проверь, что pm2 установлен
pm2 --version

# 2. Если нет
npm install -g pm2

# 3. Проверь ecosystem.config.cjs
cat ecosystem.config.cjs

# 4. Попробуй запустить вручную
pnpm dev
```

---

## 📚 Дополнительные ресурсы

### **Документация:**
- [Cursor Documentation](https://cursor.sh/docs)
- [Ralph Wiggum Technique](https://ghuntley.com/ralph/)
- [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)
- [Awesome Cursorrules](https://github.com/PatrickJS/awesome-cursorrules)

### **Videos:**
- [Matt Pocock on Ralph Technique](https://www.youtube.com/watch?v=...)
- [Cursor Agent Skills Hub](https://www.cursorhow.com/agent-skills-hub)

---

## 🎉 Quick Start Checklist

- [x] ✅ Ralph Wiggum skills установлены (`.cursor/rules/actions/`)
- [x] ✅ Next.js TypeScript rules установлены (`.cursorrules`)
- [x] ✅ Python FastAPI rules установлены (`.cursor/rules/python-fastapi.cursorrules`)
- [x] ✅ UI UX Pro Max установлен (`.cursor/commands/`, `.shared/`)
- [ ] ⏭️ Установить Claude CLI для `@ralph-hybrid` (опционально)
- [ ] ⏭️ Установить pm2 для `@setup-local-dev`
- [ ] ⏭️ Создать first PRD с `@generate-prd`
- [ ] ⏭️ Попробовать `@ralph-manual` на простой задаче

---

## 🆘 Нужна помощь?

**В Cursor chat просто спроси:**
```
@generate-prd help
@ralph-manual help
@pr-workflow help
```

**Или напрямую:**
```
Как использовать @ralph-hybrid?
Что делать если Ralph застрял?
Как создать PRD для новой фичи?
```

---

**Последнее обновление:** 26 января 2026  
**Автор:** AI Assistant (Cursor + Claude Sonnet 4.5)  
**Версия:** 1.0
