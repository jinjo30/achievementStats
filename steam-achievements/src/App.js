import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [achievements, setAchievements] = useState([]);
  const [steamId, setSteamId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      setError(null);
  
      let response = await axios.get(`/api/achievements/${steamId}`);
      let { appids, achievements } = response.data;
  
      console.log(appids);
  
      if (achievements) {
        // setAchievements(achievements);
      } else {
        setError("Couldn't retrieve achievements.");
      }
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
      <ul>
        {achievements.map((achievement, index) => (
          <li key={index}>
            {achievement.name}: {achievement.achieved ? 'Unlocked' : 'Locked'}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
