const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ALLOWED_CATEGORIES = new Set(['sugestao', 'bug', 'elogio', 'outro']);
const MAX_MESSAGE_LENGTH = 1500;

function getSupportStorePath() {
  return path.join(process.cwd(), 'data', 'support_messages.json');
}

function normalizeText(value, maxLength = MAX_MESSAGE_LENGTH) {
  return String(value || '')
    .replace(/\r\n/g, '\n')
    .trim()
    .slice(0, maxLength);
}

function normalizeCategory(value) {
  const category = String(value || 'outro').trim().toLowerCase();
  return ALLOWED_CATEGORIES.has(category) ? category : 'outro';
}

function buildSupportRecord(payload = {}, context = {}) {
  const message = normalizeText(payload.mensagem);
  const category = normalizeCategory(payload.categoria);

  return {
    id: `support_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    categoria: category,
    mensagem: message,
    pageUrl: normalizeText(context.pageUrl || payload.pageUrl || '', 500),
    userAgent: normalizeText(context.userAgent || payload.userAgent || '', 500),
    referer: normalizeText(context.referer || payload.referer || '', 500),
    created_at: new Date().toISOString()
  };
}

function readSupportMessages(storePath = getSupportStorePath()) {
  try {
    if (!fs.existsSync(storePath)) return [];
    const parsed = JSON.parse(fs.readFileSync(storePath, 'utf8'));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeSupportMessages(messages, storePath = getSupportStorePath()) {
  const dir = path.dirname(storePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(storePath, JSON.stringify(messages, null, 2), 'utf8');
}

function appendSupportMessage(record, storePath = getSupportStorePath()) {
  const messages = readSupportMessages(storePath);
  messages.push(record);
  writeSupportMessages(messages, storePath);
  return record;
}

function validateSupportPayload(payload = {}) {
  const message = normalizeText(payload.mensagem);
  if (!message) {
    return { error: 'A mensagem não pode ficar vazia.' };
  }

  if (message.length < 3) {
    return { error: 'A mensagem está muito curta.' };
  }

  if (message.length > MAX_MESSAGE_LENGTH) {
    return { error: `A mensagem deve ter no máximo ${MAX_MESSAGE_LENGTH} caracteres.` };
  }

  const categoria = normalizeCategory(payload.categoria);
  return {
    ok: true,
    data: {
      categoria,
      mensagem: message
    }
  };
}

module.exports = {
  appendSupportMessage,
  buildSupportRecord,
  getSupportStorePath,
  normalizeCategory,
  normalizeText,
  readSupportMessages,
  validateSupportPayload,
  writeSupportMessages
};
