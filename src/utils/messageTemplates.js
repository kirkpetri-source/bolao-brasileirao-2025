// Message templates utility: categories, templates, builders, validation, normalization

export const MESSAGE_TEMPLATES = {
  'open-round': {
    title: 'Rodada aberta',
    description: 'Aviso de abertura da rodada e convite para palpitar.',
    rich: `🔔 {BRAND}\n\nA rodada de palpites "{RODADA}" está ABERTA!\nAcesse agora e garanta seus palpites: {LINK}\n\n{NOME}, vamos pra cima! 🏆`,
    plain: `AVISO ({BRAND}): rodada "{RODADA}" aberta. Acesse {LINK} e registre seus palpites.`
  },
  'charge-pending': {
    title: 'Cobrança pendente',
    description: 'Lembrete para regularização/pagamento até o prazo.',
    rich: `⚠️ {BRAND} — Cobrança de palpites pendentes\n\nOlá, {NOME}. Conclua sua regularização até {LIMITE}.\nPagamento via PIX: 47415363000\n\nQualquer dúvida, estamos à disposição.`,
    plain: `COBRANÇA ({BRAND}): regularize seus palpites até {LIMITE}. PIX: 47415363000.`
  },
  'round-closed': {
    title: 'Rodada encerrada',
    description: 'Agradecimento e aviso sobre divulgação dos resultados.',
    rich: `✅ {BRAND}\n\nRodada "{RODADA}" fechada! Obrigado pela participação de todos.\nBoa sorte! 🍀\nResultados serão divulgados em {DIVULGACAO}.`,
    plain: `Rodada "{RODADA}" encerrada. Resultados em {DIVULGACAO}.`
  },
  'final-result': {
    title: 'Resultado final',
    description: 'Ranking completo da rodada com chamada para o link.',
    rich: `📣 {BRAND} — Resultado Final\n\nRodada "{RODADA}" finalizada! Parabéns aos vencedores!\nVeja o ranking completo: {RANKING_URL}`,
    plain: `RESULTADO FINAL ({BRAND}): rodada "{RODADA}" finalizada. Ranking: {RANKING_URL}.`
  }
};

export const TEMPLATE_CATEGORIES = [
  {
    id: 'status',
    label: 'Status da rodada',
    items: ['open-round', 'round-closed', 'final-result']
  },
  {
    id: 'finance',
    label: 'Financeiro',
    items: ['charge-pending']
  }
];

const TAG_TO_CONTEXT = {
  NOME: 'userName',
  RODADA: 'roundName',
  LINK: 'link',
  LIMITE: 'deadline',
  DIVULGACAO: 'publish',
  RANKING_URL: 'ranking',
  BRAND: 'brand'
};

const CANONICAL_TAGS = Object.keys(TAG_TO_CONTEXT);

export function buildTemplateText(key, mode = 'rich', context = {}) {
  const tplObj = MESSAGE_TEMPLATES[key];
  if (!tplObj) return '';
  const raw = tplObj[mode] || '';
  return raw.replace(/\{([A-Z_]+)\}/g, (_, tag) => {
    const ctxKey = TAG_TO_CONTEXT[tag];
    const value = ctxKey ? context[ctxKey] : undefined;
    return value != null && String(value).length > 0 ? String(value) : `{${tag}}`;
  });
}

export function validateMessageTags(message = '', context = {}) {
  const tags = Array.from(message.matchAll(/\{([A-Z_]+)\}/g)).map(m => m[1]);
  const unknownTags = tags.filter(tag => !CANONICAL_TAGS.includes(tag));
  const missingTags = tags.filter(tag => {
    const key = TAG_TO_CONTEXT[tag];
    const val = key ? context[key] : undefined;
    return !val || String(val).trim().length === 0;
  });
  return { unknownTags, missingTags };
}

// Normalize common tag variants to canonical tags
export function normalizeTags(message = '') {
  const replacements = [
    // NOME
    [/\{NOME_COMPLETO\}/gi, '{NOME}'],
    [/\{NOME_DO_USUARIO\}/gi, '{NOME}'],
    [/\{USUARIO\}/gi, '{NOME}'],
    // RODADA
    [/\{NOME_DA_RODADA\}/gi, '{RODADA}'],
    [/\{ROUND_NAME\}/gi, '{RODADA}'],
    // LINK
    [/\{URL\}/gi, '{LINK}'],
    [/\{APP_LINK\}/gi, '{LINK}'],
    // LIMITE
    [/\{DEADLINE\}/gi, '{LIMITE}'],
    [/\{PRAZO\}/gi, '{LIMITE}'],
    // DIVULGACAO
    [/\{PUBLICACAO\}/gi, '{DIVULGACAO}'],
    [/\{PUBLISH_DATE\}/gi, '{DIVULGACAO}'],
    // RANKING_URL
    [/\{RANKING\}/gi, '{RANKING_URL}'],
    [/\{RANKING_LINK\}/gi, '{RANKING_URL}'],
    // BRAND
    [/\{MARCA\}/gi, '{BRAND}'],
    [/\{NOME_DO_BOLAO\}/gi, '{BRAND}']
  ];

  let out = String(message);
  for (const [pattern, replacement] of replacements) {
    out = out.replace(pattern, replacement);
  }
  return out;
}