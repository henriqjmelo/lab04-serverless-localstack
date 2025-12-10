#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

/**
 * Script de Setup Inicial
 * 
 * Automatiza o setup completo:
 * 1. Verificar Docker
 * 2. Iniciar LocalStack
 * 3. Instalar dependências
 * 4. Fazer deploy com Serverless
 */

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

function executeCommand(command, args = [], description = '') {
  return new Promise((resolve, reject) => {
    log(colors.yellow, `\n▶️  ${description}`);
    
    const process = spawn(command, args, {
      stdio: 'inherit',
      shell: true
    });

    process.on('close', (code) => {
      if (code === 0) {
        log(colors.green, `✅ ${description} concluído\n`);
        resolve();
      } else {
        log(colors.red, `❌ Erro ao executar: ${description}\n`);
        reject(new Error(`Comando falhou com código ${code}`));
      }
    });

    process.on('error', (error) => {
      log(colors.red, `❌ Erro: ${error.message}\n`);
      reject(error);
    });
  });
}

async function setup() {
  log(colors.blue, '\n════════════════════════════════════════════════════════');
  log(colors.blue, '🚀 SETUP INICIAL - LAB 04 SERVERLESS COM LOCALSTACK');
  log(colors.blue, '════════════════════════════════════════════════════════\n');

  try {
    // Step 1: Verificar Docker
    log(colors.yellow, '[STEP 1/5] Verificando Docker...');
    try {
      await executeCommand('docker', ['--version'], 'Verificando Docker');
    } catch (error) {
      log(colors.red, '❌ Docker não está instalado. Instale Docker Desktop e tente novamente.\n');
      process.exit(1);
    }

    // Step 2: Verificar Docker Compose
    log(colors.yellow, '[STEP 2/5] Verificando Docker Compose...');
    try {
      await executeCommand('docker-compose', ['--version'], 'Verificando Docker Compose');
    } catch (error) {
      log(colors.red, '❌ Docker Compose não está instalado.\n');
      process.exit(1);
    }

    // Step 3: Iniciar LocalStack
    log(colors.yellow, '[STEP 3/5] Iniciando LocalStack...');
    await executeCommand('docker-compose', ['up', '-d'], 'Iniciando LocalStack');
    
    log(colors.yellow, 'Aguardando LocalStack ficar pronto (30 segundos)...');
    await new Promise(resolve => setTimeout(resolve, 30000));

    // Step 4: Instalar dependências
    log(colors.yellow, '[STEP 4/5] Instalando dependências Node.js...');
    await executeCommand('npm', ['install'], 'Instalando dependências');

    // Step 5: Deploy com Serverless
    log(colors.yellow, '[STEP 5/5] Fazendo deploy com Serverless Framework...');
    await executeCommand('npx', ['serverless', 'deploy', '--stage', 'local', '--verbose'], 'Deploy Serverless');

    // Criar diretórios necessários
    const dirs = ['data/input', 'data/output'];
    dirs.forEach(dir => {
      const dirPath = path.join(__dirname, '..', dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    });

    // Tornar scripts executáveis
    const scripts = ['test-pipeline.js', 'setup.js'];
    scripts.forEach(script => {
      const scriptPath = path.join(__dirname, script);
      if (fs.existsSync(scriptPath)) {
        fs.chmodSync(scriptPath, '755');
      }
    });

    // Sucesso!
    log(colors.blue, '\n════════════════════════════════════════════════════════');
    log(colors.green, '✅ SETUP CONCLUÍDO COM SUCESSO!');
    log(colors.blue, '════════════════════════════════════════════════════════\n');

    log(colors.blue, '📋 Próximos passos:\n');
    log(colors.yellow, '1. Testar o pipeline:');
    console.log('   npm test\n');
    log(colors.yellow, '2. Ver logs do LocalStack:');
    console.log('   docker-compose logs -f localstack\n');
    log(colors.yellow, '3. Fazer upload de arquivo CSV:');
    console.log('   aws --endpoint-url=http://localhost:4566 s3 cp data/input/produtos.csv s3://data-processing-bucket/input/\n');
    log(colors.yellow, '4. Verificar dados no DynamoDB:');
    console.log('   aws --endpoint-url=http://localhost:4566 dynamodb scan --table-name ProcessedData\n');

  } catch (error) {
    log(colors.red, `\n❌ Erro durante o setup: ${error.message}\n`);
    process.exit(1);
  }
}

// Executar setup
setup();
