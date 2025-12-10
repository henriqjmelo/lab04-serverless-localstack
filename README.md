# Lab 04: Serverless com LocalStack

> Arquitetura Event-Driven Serverless com AWS Lambda, DynamoDB, S3 e SNS

## 📋 Visão Geral

Este projeto implementa uma **arquitetura serverless completa** para processamento de dados em lote, utilizando serviços AWS emulados localmente com **LocalStack**.

### Funcionalidades

✅ **Pipeline de Processamento de CSV**
- Upload de arquivos CSV para S3
- Processamento automático via Lambda
- Armazenamento em DynamoDB
- Notificações via SNS

✅ **API REST Serverless**
- Endpoint POST `/records` para criar registros
- Validação de dados
- Geração automática de IDs (UUID)
- Resposta em JSON

✅ **Desenvolvimento Local**
- LocalStack para emular AWS
- Sem custos, sem conta AWS necessária
- Testes completos localmente

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                  ARQUITETURA SERVERLESS                 │
└─────────────────────────────────────────────────────────┘

ENTRADA
├── Caminho 1: Upload CSV → S3 Bucket
│   └── Trigger automático → Lambda dataProcessor
│
└── Caminho 2: POST /records → API Gateway
    └── Trigger → Lambda createRecord

PROCESSAMENTO
├── Lambda dataProcessor
│   ├── Lê arquivo CSV do S3
│   ├── Parseia e valida dados
│   ├── Enriquece com metadados
│   └── Salva no DynamoDB
│
└── Lambda createRecord
    ├── Recebe JSON via API
    ├── Valida campos obrigatórios
    ├── Gera UUID e timestamp
    └── Salva no DynamoDB

ARMAZENAMENTO
└── DynamoDB Table (ProcessedData)
    ├── Partition Key: id
    ├── Sort Key: timestamp
    └── Atributos: nome, categoria, preço, estoque, etc.

NOTIFICAÇÕES
└── SNS Topic (DataProcessingTopic)
    ├── Publicado após sucesso
    ├── Publicado após erro
    └── Contém detalhes do processamento

DESENVOLVIMENTO LOCAL
└── LocalStack
    ├── Emula: Lambda, DynamoDB, S3, SNS, API Gateway
    ├── Endpoint: http://localhost:4566
    └── Sem custos, sem conta AWS
```

---

## 📦 Pré-requisitos

### Obrigatório
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop))
- **Node.js 18+** ([Download](https://nodejs.org/))
- **npm 9+** (vem com Node.js)
- **Git** ([Download](https://git-scm.com/))

### Verificar Instalação
```bash
docker --version          # Docker 20.10+
docker-compose --version  # Docker Compose 2.0+
node --version           # v18.0.0+
npm --version            # 9.0.0+
```

---

## 🚀 Guia de Início Rápido

### 1️⃣ Clonar o Repositório

```bash
git clone https://github.com/seu-usuario/lab04-serverless-localstack.git
cd lab04-serverless-localstack
```

### 2️⃣ Instalar Dependências

```bash
npm install
```

### 3️⃣ Iniciar LocalStack

```bash
docker-compose up -d
sleep 30  # Aguardar LocalStack ficar pronto
docker-compose ps  # Verificar se está rodando
```

### 4️⃣ Fazer Deploy da Infraestrutura

```bash
npm run deploy
```

**Saída esperada:**
```
✓ Stack created
✓ Functions deployed
✓ API endpoints created
✓ Resources ready
```

### 5️⃣ Executar Testes

```bash
npm test
```

**Resultado esperado:**
```
✅ LocalStack disponível
✅ Bucket S3 existe
✅ Arquivo CSV enviado
✅ 10 registros processados no DynamoDB
```

---

## 📁 Estrutura do Repositório

```
lab04-serverless-localstack/
│
├── 📄 README.md                    ← Este arquivo
├── 📄 package.json                 ← Dependências e scripts
├── 📄 serverless.yml               ← Configuração da infraestrutura
├── 📄 docker-compose.yml           ← Configuração do LocalStack
├── 📄 .env                         ← Variáveis de ambiente
├── 📄 .gitignore                   ← Arquivos ignorados pelo Git
│
├── 📁 src/
│   ├── 📁 handlers/                ← Funções Lambda
│   │   ├── dataProcessor.js        ← Processa CSV do S3
│   │   └── createRecord.js         ← API REST para criar registros
│   │
│   └── 📁 utils/                   ← Helpers reutilizáveis
│       ├── dynamodb.js             ← Operações DynamoDB
│       ├── s3.js                   ← Operações S3
│       └── sns.js                  ← Publicação SNS
│
├── 📁 scripts/
│   ├── setup.js                    ← Setup automatizado
│   └── test-pipeline.js            ← Testes automatizados
│
├── 📁 tests/
│   ├── test-event.json             ← Evento S3 simulado
│   └── test-api.json               ← Requisição API simulada
│
└── 📁 data/
    └── 📁 input/
        └── produtos.csv            ← Dados de teste (10 produtos)
```

---

## 🔧 Comandos Disponíveis

### Setup e Deploy
```bash
npm run setup              # Setup completo (Docker + npm install + deploy)
npm run deploy             # Deploy da infraestrutura
npm run remove             # Remove infraestrutura
npm run info               # Mostra informações do deploy
```

### Testes
```bash
npm test                   # Executa testes completos
npm run invoke             # Invoca dataProcessor manualmente
npm run invoke:api         # Invoca createRecord manualmente
```

### Debugging
```bash
npm run logs               # Ver logs da Lambda dataProcessor
docker-compose logs -f     # Ver logs do LocalStack
docker-compose ps          # Status dos containers
```

---

## 🧪 Testando Manualmente

### Teste 1: Upload de CSV

```bash
# Fazer upload do arquivo CSV
aws --endpoint-url=http://localhost:4566 s3 cp \
  data/input/produtos.csv \
  s3://data-processing-bucket-local/input/

# Aguardar 15 segundos
sleep 15

# Verificar dados no DynamoDB
aws --endpoint-url=http://localhost:4566 dynamodb scan \
  --table-name ProcessedData-local \
  --query 'Items[*].[id.S, nome.S, preco.N]' \
  --output table
```

### Teste 2: API REST

```bash
# Invocar via Serverless
npx serverless invoke -f createRecord --stage local --path tests/test-api.json

# Ou via curl (após obter URL do API Gateway)
curl -X POST http://localhost:4566/restapis/{api-id}/local/_user_request_/records \
  -H "Content-Type: application/json" \
  -d '{"nome":"Notebook Test","categoria":"Eletrônicos","preco":3500.00,"estoque":10}'
```

### Teste 3: Verificar SNS

```bash
# Listar tópicos
aws --endpoint-url=http://localhost:4566 sns list-topics

# Ver logs do LocalStack
docker-compose logs localstack | grep SNS
```

---

## 🐛 Troubleshooting

### ❌ "Docker não está instalado"
**Solução:** Instale Docker Desktop de https://www.docker.com/products/docker-desktop

### ❌ "LocalStack não inicia"
```bash
# Verificar se porta 4566 está em uso
lsof -i :4566

# Se estiver, matar o processo
kill -9 <PID>

# Tentar novamente
docker-compose up -d
```

### ❌ "npm install falha"
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

### ❌ "Deploy falha"
```bash
# Verificar se LocalStack está pronto
curl http://localhost:4566/_localstack/health

# Ver logs detalhados
npx serverless deploy --stage local --verbose

# Remover deploy anterior
npx serverless remove --stage local
```

### ❌ "Dados não aparecem no DynamoDB"
```bash
# Verificar se Lambda foi invocada
docker-compose logs localstack | grep dataProcessor

# Verificar se arquivo foi enviado ao S3
aws --endpoint-url=http://localhost:4566 s3 ls s3://data-processing-bucket-local/input/

# Verificar tabela DynamoDB
aws --endpoint-url=http://localhost:4566 dynamodb describe-table --table-name ProcessedData-local
```

---

## 📊 Fluxo de Execução

### Cenário 1: Processamento de CSV
```
1. Upload: data/input/produtos.csv → S3
   ↓
2. S3 dispara Lambda dataProcessor
   ↓
3. Lambda:
   ├── Lê arquivo do S3
   ├── Parseia 10 linhas
   ├── Valida dados
   └── Salva 10 registros no DynamoDB
   ↓
4. SNS publica notificação de sucesso
   ↓
5. Resultado: 10 registros no DynamoDB
```

### Cenário 2: Criar via API
```
1. POST /records com JSON
   ↓
2. API Gateway dispara Lambda createRecord
   ↓
3. Lambda:
   ├── Valida JSON
   ├── Gera UUID
   ├── Enriquece com timestamp
   └── Salva no DynamoDB
   ↓
4. SNS publica notificação
   ↓
5. Resultado: 1 novo registro no DynamoDB
```

---

## 📈 Métricas Esperadas

| Métrica | Valor Esperado | Observação |
|---------|---|---|
| **CSV Processing** | 10 registros | Arquivo tem 10 linhas |
| **Processing Time** | 5-15 segundos | Depende da máquina |
| **DynamoDB Items** | 10+ | Após primeiro teste |
| **API Response** | 201 Created | Sucesso |
| **SNS Messages** | 2+ | Uma por processamento |

---

## 🎯 Checklist de Implementação

- [ ] Docker Desktop instalado e rodando
- [ ] Node.js 18+ instalado
- [ ] Repositório clonado
- [ ] `npm install` executado
- [ ] `docker-compose up -d` iniciado
- [ ] LocalStack aguardando 30 segundos
- [ ] `npm run deploy` executado com sucesso
- [ ] `npm test` passou em todos os testes
- [ ] Dados visíveis no DynamoDB
- [ ] API respondendo com 201
- [ ] SNS publicando notificações
- [ ] Documentação revisada

---

## 📚 Recursos Adicionais

### Documentação Oficial
- [AWS Lambda](https://docs.aws.amazon.com/lambda/)
- [DynamoDB](https://docs.aws.amazon.com/dynamodb/)
- [S3](https://docs.aws.amazon.com/s3/)
- [SNS](https://docs.aws.amazon.com/sns/)
- [LocalStack](https://docs.localstack.cloud/)
- [Serverless Framework](https://www.serverless.com/framework/docs)

### Conceitos Importantes
- **Event-driven Architecture**: Funções disparadas por eventos
- **Infrastructure as Code**: Definir infraestrutura em YAML
- **Serverless**: Sem gerenciar servidores, pague por execução
- **Microservices**: Pequenas funções independentes

---

## 📝 Notas Importantes

- **LocalStack é apenas para desenvolvimento**: Não use em produção
- **Dados são perdidos ao parar LocalStack**: Para manter dados, use `PERSISTENCE=1` no docker-compose.yml
- **Custos**: Zero! LocalStack é gratuito
- **Escalabilidade**: LocalStack tem limitações, use AWS real para produção

---

## 🤝 Contribuindo

Para contribuir com melhorias:

1. Faça um fork do repositório
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto é licenciado sob a MIT License - veja o arquivo LICENSE para detalhes.

---

## ✅ Conclusão

Após seguir este guia, você terá:
- ✅ Uma arquitetura serverless completa funcionando
- ✅ Dois pipelines de dados operacionais
- ✅ Experiência prática com AWS services
- ✅ Código pronto para produção
- ✅ Documentação completa

**Tempo estimado**: 30-45 minutos (primeira vez)

---

## 🚀 Bom trabalho!

Se tiver dúvidas ou encontrar problemas, verifique a seção **Troubleshooting** acima.

**Desenvolvido com ❤️ para aprender Serverless com AWS**
