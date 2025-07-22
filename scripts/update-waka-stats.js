const axios = require('axios');
const fs = require('fs').promises;

async function main() {
  try {
    console.log('Buscando estatísticas do WakaTime...');
    const stats = await getWakaTimeStats();

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
    headers: {
      Authorization: `Basic ${encodedApiKey}`,
    },
  });

  return response.data.data.languages;
}

async function updateReadme(stats) {
  const readmePath = 'README.md';
  let readmeContent = await fs.readFile(readmePath, 'utf-8');

  const statsBlock = formatStatsBlock(stats);

  const wakaBlockRegex = /(<!--START_SECTION:waka-->)[\s\S]*(<!--END_SECTION:waka-->)/;

  const updatedReadmeContent = readmeContent.replace(
    wakaBlockRegex,
    `$1\n${statsBlock}\n$2`
  );

  await fs.writeFile(readmePath, updatedReadmeContent);
}

function formatStatsBlock(stats) {
  const BAR_LENGTH = 25;

  const maxNameLength = Math.max(...stats.map(s => s.name.length));
  const maxTextLength = Math.max(...stats.map(s => s.text.length));

  const lines = stats.map(lang => {
    const name = lang.name.padEnd(maxNameLength, ' ');
    const time = lang.text.padEnd(maxTextLength, ' ');
    
    const percent = lang.percent;
    const filledBlocks = Math.round((percent / 100) * BAR_LENGTH);
    const emptyBlocks = BAR_LENGTH - filledBlocks;
    
    const bar = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
    const percentString = percent.toFixed(2).padStart(5, '0') + ' %';

    return `${name}  ${time}  ${bar}  ${percentString}`;
  });

  return '```txt\n' + lines.join('\n') + '\n```';
}

main();
