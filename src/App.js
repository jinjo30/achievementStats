import React, { useState } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [achievements, setAchievements] = useState([]);
  const [steamId, setSteamId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [metrics, setMetrics] = useState({
    totalAchievementsAchieved: 0,
    oldestAchievement: null,
    newestAchievement: null,
    totalGamesPlayedMoreThanAnHour: 0,
  });

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      setError(null);

      let response = await axios.get(`/api/achievements/${steamId}`);
      let { appids, totalAchievementsAchieved, oldestAchievement, newestAchievement, totalGamesPlayedMoreThanAnHour } = response.data;

      // Update metrics
      setMetrics({
        totalAchievementsAchieved,
        oldestAchievement,
        newestAchievement,
        totalGamesPlayedMoreThanAnHour,
      });

      // Optionally handle achievements here if needed
      // setAchievements(achievements);

    } catch (err) {
      setError('An error occurred while fetching data.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchAchievements();
  };

  return (
    <div className="App">
      <h1>Steam Achievement Info</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter Steam ID"
          value={steamId}
          onChange={(e) => setSteamId(e.target.value)}
        />
        <button type="submit">Get Achievements</button>
      </form>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}
      {metrics.oldestAchievement !== null ? (      <><div>
        <h2>Metrics</h2>
        <p>Total Achievements Achieved: {metrics.totalAchievementsAchieved}</p>
        <p>
          Oldest Achievement: {metrics.oldestAchievement ?
            `${metrics.oldestAchievement.name} on ${metrics.oldestAchievement.date}` : 'N/A'}
        </p>
        <p>
          Newest Achievement: {metrics.newestAchievement ?
            `${metrics.newestAchievement.name} on ${metrics.newestAchievement.date}` : 'N/A'}
        </p>
        <p>Total Games Played More Than An Hour: {metrics.totalGamesPlayedMoreThanAnHour}</p>
      </div><ul>
          {achievements.map((achievement, index) => (
            <li key={index}>
              {achievement.name}: {achievement.achieved ? 'Unlocked' : 'Locked'}
            </li>
          ))}
        </ul></>):(<p></p>)}

    </div>
  );
}

export default App;
