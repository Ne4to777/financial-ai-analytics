# 9. Технологический стек - Зависимости

**Конкретные технологии с версиями** для генерации кода.

```mermaid
graph TB
    subgraph frontend ["📱 Frontend Flutter"]
        direction LR
        f1["<b>State management</b><br/>flutter_riverpod"]
        f2["<b>HTTP client</b><br/>dio"]
        f3["<b>Charts & graphs</b><br/>fl_chart"]
        f4["<b>File selection</b><br/>file_picker"]
        f5["<b>Navigation</b><br/>go_router"]
        
        f1 ~~~ f2 ~~~ f3 ~~~ f4 ~~~ f5        
    end
    
    frontend ~~~ backend
    
    subgraph backend ["⚙️ Backend Node.js + TypeScript"]
        direction LR
        b1["<b>Web framework</b><br/>express"]
        b2["<b>Database ORM</b><br/>@prisma/client"]
        b3["<b>File uploads</b><br/>multer"]
        b4["<b>CSV parser</b><br/>csv-parse"]
        b5["<b>Validation</b><br/>zod"]
        b6["<b>Environment config</b><br/>dotenv"]
        
        b1 ~~~ b2 ~~~ b3 ~~~ b4 ~~~ b5 ~~~ b6        
    end
    
    backend ~~~ database
    
    subgraph database ["🗄️ Database"]
        direction LR
        d1["<b>Main database</b><br/>PostgreSQL"]
        d2["<b>Schema & migrations</b><br/>prisma"]
        d3["<b>PostgreSQL driver</b><br/>pg"]
        
        d1 ~~~ d2 ~~~ d3        
    end
    
    database ~~~ ai
    
    subgraph ai ["🧠 AI Services"]
        direction LR
        ai1["<b>GPT-4 integration</b><br/>openai"]
        ai2["<b>Claude integration</b><br/>@anthropic-ai/sdk"]
        
        ai1 ~~~ ai2        
    end
    
    ai ~~~ devops
    
    subgraph devops ["🚀 DevOps"]
        direction LR
        do1["<b>Containerization</b><br/>docker & docker-compose"]
        do2["<b>TypeScript execution</b><br/>tsx"]
        do3["<b>Development</b><br/>nodemon"]
        
        do1 ~~~ do2 ~~~ do3        
    end
    
    style frontend fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    style backend fill:#fff3e0,stroke:#e65100,stroke-width:2px
    style database fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    style ai fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    style devops fill:#fce4ec,stroke:#c2185b,stroke-width:2px
```

## Менеджеры пакетов

- **Frontend**: `flutter pub` (pubspec.yaml)
- **Backend**: `npm` (package.json)

## Требования к окружению

- **Node.js**: 20.x or later
- **Flutter**: 3.16 or later
- **PostgreSQL**: 16.x
- **Docker**: 24.x (optional)
