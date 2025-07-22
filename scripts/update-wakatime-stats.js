const fs = require('fs');
const path = require('path');
const axios = require('axios');

require('dotenv').config();

const { WAKA_API_KEY } = process.env;

const WAKATIME_API_ENDPOINT = "https://wakatime.com/api/v1/users/current/stats/last_7_days";

const padRight = (str, length) => {
    return str.length < length ? str + " ".repeat(length - str.length) : str;
};

const getWakaTimeStats = async () => {
    try {
        const response = await axios.get(WAKATIME_API_ENDPOINT, {
            headers: {
                Authorization: `Basic ${Buffer.from(WAKA_API_KEY).toString('base64')}`
            }
        });

        const stats = response.data.data;
        const { languages, editors, operating_systems } = stats;

        let lines = [];

        if (languages && languages.length > 0) {
            lines.push('📊 **Languages**');
            lines.push('```text');
            languages.slice(0, 5).forEach(lang => {
                lines.push(`${padRight(lang.name, 18)}${lang.text}`);
            });
            lines.push('```');
            lines.push('');
        }
        
        if (editors && editors.length > 0) {
            lines.push('💻 **Editors**');
            lines.push('```text');
            editors.slice(0, 3).forEach(editor => {
                lines.push(`${padRight(editor.name, 18)}${editor.text}`);
            });
            lines.push('```');
            lines.push('');
        }

        if (operating_systems && operating_systems.length > 0) {
            lines.push('OS');
            lines.push('```text');
            operating_systems.slice(0, 3).forEach(os => {
                lines.push(`${padRight(os.name, 18)}${os.text}`);
            });
            lines.push('```');
        }

        return lines.join('\n').trim();

    } catch (error) {
        console.error('Error fetching WakaTime stats:', error.response ? error.response.data : error.message);
        return null;
    }
};


const updateReadme = async () => {
    const stats = await getWakaTimeStats();

    if (!stats) {
        console.log('Could not generate stats. Exiting.');
        return;
    }

    const readmePath = path.join(__dirname, '..', 'README.md');
    let readmeContent;

    try {
        readmeContent = fs.readFileSync(readmePath, 'utf-8');
    } catch (err) {
        console.error('Error reading README.md:', err);
        return;
    }

    const regex = /([\s\S]*)/;
    const newBlock = `\n\n${stats}\n\n`;
    const newReadmeContent = readmeContent.replace(regex, newBlock);

    if (newReadmeContent === readmeContent) {
        console.error('Could not find waka:start/waka:end tags in README.md. Please add them.');
        return;
    }

    try {
        fs.writeFileSync(readmePath, newReadmeContent);
        console.log('Successfully updated README.md with WakaTime stats.');
    } catch (err) {
        console.error('Error writing to README.md:', err);
    }
};

updateReadme();
