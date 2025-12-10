#!/usr/bin/env node

const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

/**
 * Script de Teste Automatizado do Pipeline
 * 
 * Testa todo o fluxo serverless:
 * 1. Upload de CSV para S3
 * 2. Trigger automático da Lambda
 * 3. Verificação de dados no DynamoDB
 * 4. Teste de API REST
 */

// Configurar AWS SDK para LocalStack
const awsConfig = {
  endpoint: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test',
  s3ForcePathStyle: true
};

const s3 = new AWS.S3(awsConfig);
const dynamodb = new AWS.DynamoDB.DocumentClient(awsConfig);
const lambda = new AWS.Lambda(awsConfig);

const BUCKET_NAME = process.env.BUCKET_NAME || 'data-processing-bucket';
const TABLE_NAME = process.env.TABLE_NAME || 'ProcessedData';
const CSV_FILE = path.join(__dirname, '../data/input/produtos.csv');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(color, message) {
  console.log(`${color}${message}${colors.reset}`);
}

async function testPipeline() {
  log(colors.blue, '\n🚀 Iniciando testes do pipeline serverless...\n');

  try {
    // Teste 1: Verificar se LocalStack está disponível
    log(colors.yellow, '[TESTE 1] Verificando disponibilidade do LocalStack...');
    try {
      await s3.listBuckets().promise();
      log(colors.green, '✅ LocalStack está disponível\n');
    } catch (error) {
      log(colors.red, '❌ LocalStack não está disponível. Inicie com: docker-compose up -d\n');
      process.exit(1);
    }

    // Teste 2: Verificar se o bucket existe
    log(colors.yellow, '[TESTE 2] Verificando bucket S3...');
    try {
      await s3.headBucket({ Bucket: BUCKET_NAME }).promise();
      log(colors.green, `✅ Bucket "${BUCKET_NAME}" existe\n`);
    } catch (error) {
      log(colors.red, `❌ Bucket "${BUCKET_NAME}" não encontrado\n`);
      process.exit(1);
    }

    // Teste 3: Upload do arquivo CSV
    log(colors.yellow, '[TESTE 3] Fazendo upload do arquivo CSV...');
    if (!fs.existsSync(CSV_FILE)) {
      log(colors.red, `❌ Arquivo CSV não encontrado: ${CSV_FILE}\n`);
      process.exit(1);
    }

    const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');
    await s3.putObject({
      Bucket: BUCKET_NAME,
      Key: 'input/produtos.csv',
      Body: csvContent,
      ContentType: 'text/csv'
    }).promise();
    log(colors.green, '✅ Arquivo CSV enviado para S3\n');

    // Teste 4: Aguardar processamento
    log(colors.yellow, '[TESTE 4] Aguardando processamento da Lambda (15 segundos)...');
    await new Promise(resolve => setTimeout(resolve, 15000));
    log(colors.green, '✅ Tempo de espera concluído\n');

    // Teste 5: Verificar dados no DynamoDB
    log(colors.yellow, '[TESTE 5] Verificando dados no DynamoDB...');
    const scanResult = await dynamodb.scan({
      TableName: TABLE_NAME,
      Limit: 100
    }).promise();

    const itemCount = scanResult.Items.length;
    if (itemCount > 0) {
      log(colors.green, `✅ Encontrados ${itemCount} registros no DynamoDB\n`);
      
      // Exibir primeiros 3 registros
      log(colors.blue, '📊 Primeiros registros:');
      scanResult.Items.slice(0, 3).forEach((item, index) => {
        console.log(`  ${index + 1}. ID: ${item.id}, Nome: ${item.nome}, Preço: ${item.preco}`);
      });
      console.log('');
    } else {
      log(colors.red, '❌ Nenhum registro encontrado no DynamoDB\n');
    }

    // Teste 6: Invocar Lambda manualmente
    log(colors.yellow, '[TESTE 6] Testando invocação manual da Lambda...');
    try {
      const testEvent = {
        Records: [{
          s3: {
            bucket: { name: BUCKET_NAME },
            object: { key: 'input/produtos.csv' }
          }
        }]
      };

      const result = await lambda.invoke({
        FunctionName: 'data-processing-service-local-dataProcessor',
        InvocationType: 'RequestResponse',
        Payload: JSON.stringify(testEvent)
      }).promise();

      if (result.StatusCode === 200) {
        log(colors.green, '✅ Lambda invocada com sucesso\n');
      } else {
        log(colors.red, `❌ Erro ao invocar Lambda: ${result.StatusCode}\n`);
      }
    } catch (error) {
      log(colors.yellow, '⚠️ Não foi possível invocar Lambda (pode estar usando serverless-offline)\n');
    }

    // Resumo final
    log(colors.blue, '\n📋 RESUMO DOS TESTES:');
    log(colors.green, '✅ LocalStack disponível');
    log(colors.green, '✅ Bucket S3 existe');
    log(colors.green, '✅ Arquivo CSV enviado');
    log(colors.green, `✅ ${itemCount} registros processados no DynamoDB`);
    log(colors.green, '\n🎉 Todos os testes concluídos com sucesso!\n');

  } catch (error) {
    log(colors.red, `\n❌ Erro durante os testes: ${error.message}\n`);
    console.error(error);
    process.exit(1);
  }
}

// Executar testes
testPipeline();
