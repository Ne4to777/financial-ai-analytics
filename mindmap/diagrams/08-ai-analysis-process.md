# 8. AI Analysis Process - Детали реализации

**Детальный процесс анализа** с промптами и параметрами для AI.

```mermaid
graph TB
    subgraph input ["📥 Входные данные"]
        direction LR
        start["<b>POST /analysis</b><br/>reportId, aiProvider?"]
        fetch["<b>Get data from DB</b><br/>FinancialData table"]
        transform["<b>Transform to JSON</b><br/>группировка по категориям"]
        
        start ~~~ fetch ~~~ transform
    end
    
    input --> aiSelect
    
    subgraph aiSelect ["🤖 Выбор AI провайдера"]
        direction LR
        openai["<b>OpenAI GPT-4</b><br/>gpt-4-turbo-preview"]
        claude["<b>Anthropic Claude</b><br/>claude-3-sonnet"]
        
        openai ~~~ claude
    end
    
    aiSelect --> processing
    
    subgraph processing ["⚙️ Обработка"]
        direction LR
        buildPrompt["<b>Build System Prompt</b><br/>Financial analyst role"]
        callAI["<b>Call AI API</b><br/>timeout 30s, retry 3x"]
        parseResp["<b>Parse JSON Response</b><br/>summary, risks[], recommendations[]"]
        validate["<b>Validate with Zod</b><br/>схема валидации"]
        
        buildPrompt ~~~ callAI ~~~ parseResp ~~~ validate
    end
    
    processing --> output
    
    subgraph output ["💾 Сохранение результата"]
        direction LR
        save["<b>Save to Database</b><br/>Transaction: Analysis + Risks + Recommendations"]
        respond["<b>Response 200 OK</b><br/>analysisId, status"]
        
        save ~~~ respond
    end
    
    style input fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    style aiSelect fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
    style processing fill:#fff3e0,stroke:#e65100,stroke-width:2px
    style output fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
```

## Детали реализации

### API Endpoint
```
POST /api/analysis
Body: { reportId: UUID, aiProvider?: 'openai' | 'anthropic' }
Response: { analysisId: UUID, status: 'processing' }
```

### AI Models
- **OpenAI**: gpt-4-turbo-preview, max tokens 4096, temperature 0.3
- **Anthropic**: claude-3-sonnet, max tokens 4096, temperature 0.3

### Процесс
1. **GET data** - Получить финансовые данные из FinancialData table
2. **Transform** - Преобразовать в JSON, сгруппировать по категориям
3. **Select AI** - Выбор OpenAI или Anthropic (default: openai)
4. **Build Prompt** - Создать system prompt для financial analyst
5. **Call AI** - POST к AI API с timeout 30s
6. **Parse** - Извлечь summary, risks[], recommendations[]
7. **Validate** - Zod schema validation
8. **Save** - Transaction: INSERT Analysis, Risks, Recommendations
9. **Respond** - Return analysisId

### System Prompt Template

```javascript
const SYSTEM_PROMPT = `You are an expert financial analyst. 
Analyze the provided financial data and return a JSON response with:
{
  "summary": "Brief overview (200 words max)",
  "risks": [{
      "category": "string",
      "severity": "high|medium|low",
      "description": "Detailed explanation",
      "impact": number,
      "priority": number
    }],
  "recommendations": [{
      "type": "optimization|cost_reduction|revenue_growth",
      "description": "Actionable advice",
      "expectedImprovement": number,
      "priority": "high|medium|low",
      "actionItems": ["step1", "step2"]
    }]
}`;
```

### Обработка ошибок
- **Timeout**: 30 секунд
- **Retry**: 3 попытки с exponential backoff (1s, 2s, 4s)
- **Fallback**: Переключение на другой AI провайдер при сбое
- **Validation**: Строгая валидация JSON схемы через Zod
