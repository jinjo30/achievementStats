const express = require('express');
const axios = require('axios');
const app = express();
const port = 5000;

app.use(express.json());

const apiKey = '81A832994EA7F803216F40620D4377D5';

app.get('/api/achievements/:steamId', async (req, res) => {
  const { steamId } = req.params;

  try {
    // Fetch owned games
    let response = await axios.get(
      `https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/`,
      {
        params: {
          key: apiKey,
          steamid: steamId,
          include_appinfo: 1,
          include_played_free_games: 1
        }
      }
    );

    let games = response.data.response.games;
    let nonZeroPlaytimeGames = games.filter(game => game.playtime_forever > 0);
    let totalGamesPlayedMoreThanAnHour = nonZeroPlaytimeGames.filter(game => game.playtime_forever >= 60).length;

    // Prepare to fetch achievements for each game
    let achievementsPromises = nonZeroPlaytimeGames.map(game => {
      console.log(`Fetching achievements for appid: ${game.appid}`);
      return axios.get(
        `https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/`,
        {
          params: {
            appid: game.appid,
            key: apiKey,
            steamid: steamId
          }
        }
      ).then(response => {
        // Check for the error in the response
        if (response.data.playerstats.success === false) {
          console.error(`Failed to fetch achievements for appid: ${game.appid}`, response.data.playerstats.error);
          return null; // Return null to handle failed requests gracefully
        }
        // Return the app name and achievements
        return {
          appName: game.name,
          achievements: response.data.playerstats.achievements
        };
      }).catch(err => {
        console.error(`Error fetching achievements for appid: ${game.appid}`, err.response ? err.response.data : err.message);
        return null; // Return null to handle failed requests gracefully
      });
    });

    // Wait for all achievement requests to complete
    let achievementsResponses = await Promise.all(achievementsPromises);

    // Initialize metrics
    let achievementsAchieved = 0;
    let unlockTimes = [];
    let oldestAchievement = { appName: null, unlockTime: Infinity };
    let newestAchievement = { appName: null, unlockTime: -Infinity };

    // Process each response
    achievementsResponses.forEach(response => {
      if (response && response.achievements) { // Check if the response is valid
        let achievements = response.achievements;
        achievementsAchieved += achievements.filter(a => a.achieved === 1).length;
        achievements.forEach(achievement => {
          if (achievement.achieved === 1) {
            let unlockTime = achievement.unlocktime;
            if (unlockTime < oldestAchievement.unlockTime) {
              oldestAchievement = { appName: response.appName, unlockTime };
            }
            if (unlockTime > newestAchievement.unlockTime) {
              newestAchievement = { appName: response.appName, unlockTime };
            }
          }
        });
      } else {
        console.error(`Invalid response for achievements: ${response}`);
      }
    });

    // Convert Unix timestamps to ISO date strings
    let oldestDate = oldestAchievement.unlockTime !== Infinity ? new Date(oldestAchievement.unlockTime * 1000).toISOString() : null;
    let newestDate = newestAchievement.unlockTime !== -Infinity ? new Date(newestAchievement.unlockTime * 1000).toISOString() : null;

    res.json({
      totalAchievementsAchieved: achievementsAchieved,
      oldestAchievement: oldestAchievement.appName ? { name: oldestAchievement.appName, date: oldestDate } : null,
      newestAchievement: newestAchievement.appName ? { name: newestAchievement.appName, date: newestDate } : null,
      totalGamesPlayedMoreThanAnHour: totalGamesPlayedMoreThanAnHour
    });
  } catch (err) {
    console.error('General error:', err);
    res.status(500).json({ error: 'An error occurred while fetching data.' });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
