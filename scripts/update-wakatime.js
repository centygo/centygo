const axios = require('axios');
const fs = require('fs').promises;

async function main() {
  try {
    console.log('Buscando estatísticas do WakaTime...');
    const stats = await getWakaTimeStats();

    if (!stats || stats.length === 0) {
      console.log('Nenhuma estatística do WakaTime foi encontrada para atualizar.');
      return;
    }

    console.log('Estatísticas recebidas. Atualizando o README.md...');
    await updateReadme(stats);

    console.log('Seção do WakaTime no README.md atualizada com sucesso!');
  } catch (error) {
    console.error('Ocorreu um erro no script do WakaTime:', error.message);
    process.exit(1);
  }
}

async function getWakaTimeStats() {
  const apiKey = process.env.WAKATIME_API_KEY;
  if (!apiKey) {
    throw new Error('Secret WAKATIME_API_KEY não encontrado!');
  }

  const encodedApiKey = Buffer.from(apiKey).toString('base64');
  const url = 'https://wakatime.com/api/v1/users/current/stats/last_7_days';

  const response = await axios.get(url, {
    headers: { Authorization: `Basic ${encodedApiKey}` },
  });

  return response.data.data.languages;
}

function formatStatsBlock(stats) {
  const BAR_LENGTH = 25;
  const filteredStats = stats.filter(s => s.total_seconds > 0);

  if (filteredStats.length === 0) {
    return '```text\nNão foi possível buscar as estatísticas do WakaTime.\n```';
  }

  const lines = filteredStats.map(lang => {
    const name = lang.name.padEnd(11, ' ');
    const time = lang.text.padEnd(14, ' ');
    const percent = lang.percent;
    const filledBlocks = Math.round((percent / 100) * BAR_LENGTH);
    const bar = '█'.repeat(filledBlocks) + '░'.repeat(BAR_LENGTH - filledBlocks);
    const percentString = `${percent.toFixed(2)}%`.padStart(7, ' ');
    return `${name}${time}${bar} ${percentString}`;
  });

  return '```txt\n' + lines.join('\n') + '\n```';
}

async function updateReadme(stats) {
  const readmePath = 'README.md';
  const startComment = '';
  const endComment = '';

  const readmeContent = await fs.readFile(readmePath, 'utf-8');

  const startIndex = readmeContent.indexOf(startComment);
  const endIndex = readmeContent.indexOf(endComment);

  if (startIndex === -1 || endIndex === -1) {
    console.error('Marcadores de início/fim não encontrados no README.md. Verifique se e existem.');
    return;
  }

  const newReadmeContent = [
    readmeContent.substring(0, startIndex + startComment.length),
    '\n',
    formatStatsBlock(stats),
    '\n',
    readmeContent.substring(endIndex)
  ].join('');

  await fs.writeFile(readmePath, newReadmeContent);
}

main();