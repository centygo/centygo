const axios = require('axios');
const fs = require('fs').promises;

async function main() {
  try {
    console.log('Buscando estatísticas do Todoist...');
    const stats = await getTodoistStats();
    
    console.log('Estatísticas recebidas. Atualizando o README.md...');
    await updateReadme(stats);
    
    console.log('README.md atualizado com sucesso!');
  } catch (error) {
    console.error('Ocorreu um erro:', error.message);
    process.exit(1);
  }
}

async function getTodoistStats() {
  const apiToken = process.env.TODOIST_API_KEY;

  if (!apiToken) {
    throw new Error('Secret TODOIST_API_KEY não encontrado!');
  }

  const response = await axios.post(
    'https://api.todoist.com/sync/v9/sync',
    {
      sync_token: '*',
      resource_types: '["user", "stats"]',
    },
    {
      headers: {
        Authorization: `Bearer ${apiToken}`,
      },
    }
  );

  const userData = response.data.user;
  const statsData = response.data.stats;

  return {
    karma: userData.karma,
    completedToday: statsData.days_items.find(item => item.date === new Date().toISOString().slice(0, 10))?.total_completed || 0,
    completedTotal: statsData.completed_count,
    longestStreak: statsData.longest_streak?.count ?? 0,
  };
}

async function updateReadme(stats) {
  const readmePath = 'README.md';
  let readmeContent = await fs.readFile(readmePath, 'utf-8');

  const newStatsBlock = `🏆  ${stats.karma.toLocaleString('pt-BR')} Karma Points
🌸  Completed ${stats.completedToday} tasks today
✅  Completed ${stats.completedTotal.toLocaleString('pt-BR')} tasks so far
⏳  Longest streak is ${stats.longestStreak} days
`;

  const updatedReadmeContent = readmeContent.replace(
    /[\s\S]*/,
    newStatsBlock
  );

  await fs.writeFile(readmePath, updatedReadmeContent);
}

main();
