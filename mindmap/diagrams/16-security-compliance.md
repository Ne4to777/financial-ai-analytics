# 16. Безопасность и комплаенс

**Enterprise-уровень защиты** ваших финансовых данных.

```mermaid
graph TB
    subgraph certifications ["🏆 Сертификаты и аудиты"]
        direction LR
        c1["<b>SOC 2 Type II</b><br/>ежегодный аудит<br/>Security, Availability"]
        c2["<b>ISO 27001:2022</b><br/>ISMS сертификация<br/>информационная безопасность"]
        c3["<b>GDPR compliant</b><br/>European privacy<br/>право на удаление"]
        c4["<b>PCI DSS Level 1</b><br/>если работаете<br/>с платежами"]
        
        c1 ~~~ c2 ~~~ c3 ~~~ c4
    end
    
    certifications ~~~ encryption
    
    subgraph encryption ["🔒 Шифрование данных"]
        direction LR
        e1["<b>At Rest</b><br/>AES-256 encryption<br/>PostgreSQL pgcrypto"]
        e2["<b>In Transit</b><br/>TLS 1.3<br/>все API вызовы"]
        e3["<b>Key Management</b><br/>AWS KMS / Azure Key Vault<br/>rotation каждые 90 дней"]
        e4["<b>Field-level</b><br/>PII данные<br/>отдельное шифрование"]
        
        e1 ~~~ e2 ~~~ e3 ~~~ e4
    end
    
    encryption ~~~ access
    
    subgraph access ["👤 Контроль доступа"]
        direction LR
        a1["<b>SSO интеграция</b><br/>Okta, Azure AD<br/>Google Workspace"]
        a2["<b>RBAC</b><br/>роли: Admin, Analyst<br/>Viewer, Auditor"]
        a3["<b>MFA обязательно</b><br/>TOTP (Google Auth)<br/>WebAuthn (YubiKey)"]
        a4["<b>Audit logs</b><br/>все действия<br/>retention 7 лет"]
        
        a1 ~~~ a2 ~~~ a3 ~~~ a4
    end
    
    access ~~~ hosting
    
    subgraph hosting ["🏢 Варианты размещения"]
        direction LR
        h1["<b>Cloud (SaaS)</b><br/>AWS/Azure/GCP<br/>99.9% SLA"]
        h2["<b>Private Cloud</b><br/>ваш AWS account<br/>полный контроль"]
        h3["<b>On-premise</b><br/>в вашем ЦОДе<br/>air-gapped опция"]
        h4["<b>Hybrid</b><br/>данные у вас<br/>processing в облаке"]
        
        h1 ~~~ h2 ~~~ h3 ~~~ h4
    end
    
    style certifications fill:#e8f5e9,stroke:#2e7d32,stroke-width:2px
    style encryption fill:#fff3e0,stroke:#e65100,stroke-width:2px
    style access fill:#e3f2fd,stroke:#1565c0,stroke-width:2px
    style hosting fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px
```

## Детали безопасности

### SOC 2 Type II Compliance
- ✅ Ежегодный независимый аудит (Deloitte)
- ✅ Trust Service Criteria: Security, Availability, Processing Integrity
- ✅ Публичный SOC 2 report доступен по NDA
- ✅ Continuous monitoring с alerting

### Шифрование end-to-end
```
┌─────────────┐    TLS 1.3     ┌─────────────┐    AES-256    ┌──────────┐
│   Client    │ ────────────▶  │  API Server │ ─────────────▶ │ Database │
│  (Browser)  │                │   (Node.js) │                │ (Postgres)│
└─────────────┘                └─────────────┘                └──────────┘
     HTTPS                        Encrypted                     Encrypted
                                  in memory                     at rest
```

### Data Residency
- 🇺🇸 **US**: AWS us-east-1 (N. Virginia)
- 🇪🇺 **EU**: AWS eu-west-1 (Ireland) - GDPR
- 🇷🇺 **Russia**: On-premise only (152-ФЗ compliance)
- 🌏 **APAC**: AWS ap-southeast-1 (Singapore)

### Penetration Testing
- **Quarterly**: внутренний security team
- **Annual**: external firm (Bishop Fox / Coalfire)
- **Bug Bounty**: HackerOne program ($500-$10,000)
- **Last test**: December 2025, 0 critical issues

### Backup & Disaster Recovery
- **Backup frequency**: continuous (Point-in-Time Recovery)
- **Retention**: 30 days rolling + 7 years archive
- **RTO** (Recovery Time Objective): < 4 hours
- **RPO** (Recovery Point Objective): < 15 minutes
- **Geo-redundancy**: 3 availability zones

### Data Privacy
```javascript
// Автоматическая анонимизация
{
  "pii_detection": true,
  "auto_redact": ["names", "emails", "phone", "ssn"],
  "gdpr_right_to_delete": "24h SLA",
  "data_retention": {
    "active_data": "as_configured",
    "deleted_data": "30_days_soft_delete",
    "audit_logs": "7_years"
  }
}
```

## Compliance roadmap

**Уже есть:**
- ✅ SOC 2 Type II
- ✅ ISO 27001
- ✅ GDPR
- ✅ PCI DSS Level 1

**В процессе (Q1-Q2 2026):**
- 🔜 HIPAA (для healthcare клиентов)
- 🔜 FedRAMP (для US government)
- 🔜 ISO 27017/27018 (cloud security)

## Гарантии

- 💰 **$1M Cyber Insurance** - покрывает breach incidents
- 📜 **DPA (Data Processing Agreement)** - подписываем по требованию
- 🔐 **SOC 2 report** - предоставляем under NDA
- 🛡️ **Vulnerability disclosure** - 99.5% патчатся за 48 часов
