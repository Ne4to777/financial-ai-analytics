# 📋 Tasks Directory

Эта директория создана для хранения PRD документов и task lists, генерируемых Cursor Skills.

## Структура

```
tasks/
├── prd-{feature-name}.md      # Product Requirements Documents
├── tasks-{feature-name}.md    # Task breakdowns
└── README.md                  # Этот файл
```

## Как использовать

### 1. Создать PRD

```bash
# В Cursor chat:
@generate-prd Хочу добавить dark mode
```

**Результат:** `tasks/prd-dark-mode.md`

### 2. Разбить на задачи

```bash
@generate-tasks based on tasks/prd-dark-mode.md
```

**Результат:** `tasks/tasks-dark-mode.md`

### 3. Реализовать

```bash
# Автономно (overnight):
@ralph-hybrid

# Или интерактивно:
@ralph-manual
```

## Примеры файлов

### PRD Example: `tasks/prd-dark-mode.md`

```markdown
# Dark Mode Feature

## Goals
- Allow users to switch between light and dark themes
- Persist theme preference
- Support system preference detection

## User Stories
- AS A user, I WANT to toggle dark mode, SO THAT I can reduce eye strain
- AS A user, I WANT my choice to persist, SO THAT I don't need to toggle every time

## Functional Requirements
- P0: Toggle button in navbar
- P0: Dark color scheme for all UI components
- P1: System preference detection
- P1: LocalStorage persistence

## Non-Goals
- Dark mode for external embeds (out of scope)
- Per-component theme customization (future)
```

### Tasks Example: `tasks/tasks-dark-mode.md`

```markdown
# Tasks: Dark Mode

## Phase 1: Parent Tasks
- [ ] 0.0 Create feature branch (feat/dark-mode-20260126)
- [ ] 1.0 Create ThemeProvider component
- [ ] 2.0 Implement theme toggle UI
- [ ] 3.0 Update existing components
- [ ] 4.0 Write tests
- [ ] 5.0 Create PR (see @pr-workflow)

## Phase 2: Detailed Tasks
- [ ] 1.0 Create ThemeProvider component
  - [ ] 1.1 Create ThemeContext.tsx
  - [ ] 1.2 Implement useTheme hook
  - [ ] 1.3 Add system preference detection
  - [ ] 1.4 Setup localStorage sync
```

## Ralph Integration

Если используешь `@ralph-hybrid`, он создаст дополнительные файлы в `scripts/ralph/`:
- `prd.json` — машиночитаемый task list
- `progress.txt` — накопленные learnings
- `ralph.sh` — bash loop для автономного выполнения

Эти файлы **НЕ** коммитятся (в `.gitignore`).

## Best Practices

✅ **DO:**
- Храни PRD и tasks в этой директории
- Используй понятные имена: `prd-{feature}`, `tasks-{feature}`
- Коммить PRD и tasks в git (для team alignment)

❌ **DON'T:**
- Не редактируй tasks вручную во время Ralph execution
- Не коммить `prd.json` или `progress.txt` (Ralph temporary files)

## См. также

- [CURSOR_SKILLS_GUIDE.md](../CURSOR_SKILLS_GUIDE.md) — полное руководство
- [.cursor/rules/actions/](../.cursor/rules/actions/) — установленные skills
