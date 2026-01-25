# 00. Навигация по системе

**Интерактивная карта** всех диаграмм проекта - кликните на любой блок для перехода.

```mermaid
graph TB
    start["🎯 Финансовый AI Аналитик<br/><b>СТАРТ ЗДЕСЬ</b>"]
    
    start --> business
    start --> technical
    
    subgraph business ["💼 Бизнес-обоснование"]
        direction TB
        b1["01. Обзор продукта<br/>Что и для кого"]
        b2["13. ROI и ценность<br/>Сколько стоит"]
        b3["14. Доказательства<br/>Case studies"]
        b4["17. vs Конкуренты<br/>Почему мы"]
        b5["16. Безопасность<br/>Как защищены данные"]
        b6["15. Интеграции<br/>Совместимость"]
        b7["18. Внедрение<br/>Как начать"]
        
        b1 --> b2 --> b3 --> b4
        b4 --> b5 --> b6 --> b7
    end
    
    subgraph technical ["⚙️ Техническая реализация"]
        direction TB
        t1["02. Архитектура<br/>Как устроено"]
        t2["03. База данных<br/>Схема и модели"]
        t3["04. Поток данных<br/>Sequence diagram"]
        t4["08. AI процесс<br/>Как работает ИИ"]
        t5["05. Flutter<br/>Структура фронтенда"]
        t6["06. Экраны<br/>UI/UX"]
        t7["07. API<br/>REST эндпоинты"]
        
        t1 --> t2 --> t3 --> t4
        t4 --> t5 --> t6 --> t7
    end
    
    subgraph tech ["🔧 Технологии"]
        direction LR
        tech1["09. Tech Stack<br/>Зависимости"]
        tech2["11. Безопасность<br/>Инструменты"]
        tech3["12. Производительность<br/>Оптимизация"]
        tech4["10. Roadmap<br/>План развития"]
        
        tech1 ~~~ tech2 ~~~ tech3 ~~~ tech4
    end
    
    business --> tech
    technical --> tech
    
    click b1 "?diagram=01" "Обзор продукта"
    click b2 "?diagram=13" "ROI и ценность"
    click b3 "?diagram=14" "Доказательства"
    click b4 "?diagram=17" "Конкурентные преимущества"
    click b5 "?diagram=16" "Безопасность и комплаенс"
    click b6 "?diagram=15" "Интеграции"
    click b7 "?diagram=18" "Внедрение"
    
    click t1 "?diagram=02" "Архитектура системы"
    click t2 "?diagram=03" "База данных"
    click t3 "?diagram=04" "Поток данных"
    click t4 "?diagram=08" "AI процесс"
    click t5 "?diagram=05" "Flutter структура"
    click t6 "?diagram=06" "Экраны"
    click t7 "?diagram=07" "API"
    
    click tech1 "?diagram=09" "Tech Stack"
    click tech2 "?diagram=11" "Безопасность"
    click tech3 "?diagram=12" "Производительность"
    click tech4 "?diagram=10" "Roadmap"
    
    style start fill:#667eea,stroke:#5568d3,stroke-width:4px,color:#fff
    style business fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    style technical fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    style tech fill:#fff3e0,stroke:#e65100,stroke-width:2px
    
    style b1 fill:#fff,stroke:#2e7d32,stroke-width:2px,cursor:pointer
    style b2 fill:#fff,stroke:#2e7d32,stroke-width:2px,cursor:pointer
    style b3 fill:#fff,stroke:#2e7d32,stroke-width:2px,cursor:pointer
    style b4 fill:#fff,stroke:#2e7d32,stroke-width:2px,cursor:pointer
    style b5 fill:#fff,stroke:#2e7d32,stroke-width:2px,cursor:pointer
    style b6 fill:#fff,stroke:#2e7d32,stroke-width:2px,cursor:pointer
    style b7 fill:#fff,stroke:#2e7d32,stroke-width:2px,cursor:pointer
    
    style t1 fill:#fff,stroke:#1565c0,stroke-width:2px,cursor:pointer
    style t2 fill:#fff,stroke:#1565c0,stroke-width:2px,cursor:pointer
    style t3 fill:#fff,stroke:#1565c0,stroke-width:2px,cursor:pointer
    style t4 fill:#fff,stroke:#1565c0,stroke-width:2px,cursor:pointer
    style t5 fill:#fff,stroke:#1565c0,stroke-width:2px,cursor:pointer
    style t6 fill:#fff,stroke:#1565c0,stroke-width:2px,cursor:pointer
    style t7 fill:#fff,stroke:#1565c0,stroke-width:2px,cursor:pointer
    
    style tech1 fill:#fff,stroke:#e65100,stroke-width:2px,cursor:pointer
    style tech2 fill:#fff,stroke:#e65100,stroke-width:2px,cursor:pointer
    style tech3 fill:#fff,stroke:#e65100,stroke-width:2px,cursor:pointer
    style tech4 fill:#fff,stroke:#e65100,stroke-width:2px,cursor:pointer
```

## 🗺️ Как пользоваться

### Для бизнеса (менеджеры, владельцы):
1. **Начните с [01. Обзор продукта](#)** - что это и зачем
2. **[13. ROI и ценность](#)** - финансовое обоснование
3. **[14. Доказательства](#)** - реальные кейсы
4. **[18. Внедрение](#)** - как начать работать

### Для технических специалистов:
1. **[02. Архитектура](#)** - общая структура
2. **[03. База данных](#)** - Prisma схемы
3. **[08. AI процесс](#)** - как работает ИИ
4. **[09. Tech Stack](#)** - используемые технологии

### Навигация:
- 🖱️ **Кликните на любой блок** для перехода к диаграмме
- ← **Sidebar** - полный список всех диаграмм
- 🔍 **Zoom/Pan** - для детального просмотра
