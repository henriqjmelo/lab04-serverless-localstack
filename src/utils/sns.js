const AWS = require('aws-sdk');

/**
 * Helper para notificações SNS
 * 
 * Simplifica publicação de mensagens em tópicos SNS
 */

const snsConfig = {
  endpoint: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
  region: process.env.AWS_REGION || 'us-east-1',
  accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'test',
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'test'
};

const sns = new AWS.SNS(snsConfig);

/**
 * Publicar mensagem em tópico SNS
 * @param {string} topicArn - ARN do tópico
 * @param {string} message - Mensagem a publicar
 * @param {string} subject - Assunto da mensagem
 * @param {Object} attributes - Atributos adicionais
 * @returns {Promise<Object>} Resultado da publicação
 */
async function publishMessage(topicArn, message, subject = 'Notification', attributes = {}) {
  const params = {
    TopicArn: topicArn,
    Message: typeof message === 'object' ? JSON.stringify(message) : message,
    Subject: subject,
    MessageAttributes: {}
  };

  // Adicionar atributos customizados
  Object.keys(attributes).forEach((key) => {
    params.MessageAttributes[key] = {
      DataType: 'String',
      StringValue: String(attributes[key])
    };
  });

  try {
    console.log(`📤 Publicando mensagem no SNS: ${topicArn}`);
    const result = await sns.publish(params).promise();
    console.log(`✅ Mensagem publicada com ID: ${result.MessageId}`);
    return result;
  } catch (error) {
    console.error('❌ Erro ao publicar mensagem SNS:', error);
    throw error;
  }
}

module.exports = {
  publishMessage
};
