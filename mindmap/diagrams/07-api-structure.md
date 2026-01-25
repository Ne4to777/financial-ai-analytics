# 7. Структура API - REST эндпоинты

**REST API спецификация** с HTTP методами, путями и форматами данных.

```mermaid
graph TB
    subgraph health ["🏥 Health Check"]
        h1["<b>GET /health</b><br/>Response 200: status: 'ok'"]
    end
    
    health ~~~ reports
    
    subgraph reports ["📊 Reports Endpoints"]
        direction LR
        r1["<b>POST /reports/upload</b><br/>Body: multipart/form-data<br/>Response 201"]
        r2["<b>GET /reports</b><br/>Query: userId, status?<br/>Response 200"]
        r3["<b>GET /reports/:id</b><br/>Path: id UUID<br/>Response 200/404"]
        r4["<b>DELETE /reports/:id</b><br/>Path: id UUID<br/>Response 204/404"]
        
        r1 ~~~ r2 ~~~ r3 ~~~ r4        
    end
    
    reports ~~~ analysis
    
    subgraph analysis ["🤖 Analysis Endpoints"]
        direction LR
        a1["<b>POST /analysis</b><br/>Body: reportId, aiProvider?<br/>Response 202"]
        a2["<b>GET /analysis/:id</b><br/>Path: id UUID<br/>Response 200/404"]
        a3["<b>GET /analysis/:id/risks</b><br/>Query: severity?, limit?<br/>Response 200"]
        a4["<b>GET /analysis/:id/recommendations</b><br/>Query: priority?, limit?<br/>Response 200"]
        
        a1 ~~~ a2 ~~~ a3 ~~~ a4        
    end
    
    style health fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    style reports fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    style analysis fill:#fff3e0,stroke:#e65100,stroke-width:2px
```

## HTTP коды состояния

- **200** OK - Успешный запрос
- **201** Created - Ресурс создан
- **202** Accepted - Запрос принят в обработку
- **204** No Content - Успешно удалено
- **400** Bad Request - Неверные параметры
- **404** Not Found - Ресурс не найден
- **500** Internal Server Error - Ошибка сервера

## Типы контента (Content Types)

- **Request**: `multipart/form-data` (upload), `application/json` (analysis)
- **Response**: `application/json`
