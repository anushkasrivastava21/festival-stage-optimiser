const fs = require('fs');
const path = require('path');

const clusters = [
  { id: 1, name: 'Chill Acoustic', energy: 2, bpm: 82 },
  { id: 2, name: 'High Energy EDM', energy: 9, bpm: 130 },
  { id: 3, name: 'Mid-Tempo Groove', energy: 5, bpm: 105 },
  { id: 4, name: 'Upbeat Pop', energy: 7, bpm: 120 },
  { id: 5, name: 'Deep House', energy: 8, bpm: 124 }
];

const adjacencies = [
  [1, 3], [3, 1],
  [3, 4], [4, 3],
  [4, 5], [5, 4],
  [5, 2], [2, 5],
  [1, 4], [4, 1],
  [3, 5], [5, 3]
];

const trackNames = {
  1: [
    ['Sunrise Serenade', 'Acoustic Trio'], ['Mountain Breeze', 'Cedar Strings'],
    ['Coffee & Vinyl', 'Quiet Waves'], ['Driftwood', 'The Folk Meadow'],
    ['Golden Hour Glow', 'Hollow Pine'], ['Sunday Mist', 'Lowland Breeze'],
    ['Barefoot Melody', 'Willow Echoes'], ['Fireside Strum', 'The Campers'],
    ['Autumn Leaves Fall', 'Harvest Moon'], ['River Whispers', 'Acoustic Duo'],
    ['Lakeside Cabin', 'Northbound'], ['Gentle Rain', 'Soft Resonance'],
    ['Warm Embrace', 'Folk Harbor'], ['Twilight Acoustic', 'Solitude Key'],
    ['Dawn Over the Valley', 'Timberline'], ['Paper Boats', 'Riverstone'],
    ['Old Porch Bench', 'Bluebird Road'], ['Strings in the Wind', 'Pinehurst'],
    ['Silent Horizon', 'Wanderlust Acoustic'], ['Peaceful Slumber', 'Nightfall']
  ],
  2: [
    ['Bassline Supernova', 'DJ Nitro'], ['Neon Overdrive', 'CyberPulse'],
    ['Drop the Pressure', 'Viper Beat'], ['Solar Flare Anthem', 'Apex Raves'],
    ['Galactic Surge', 'Hyperdrive'], ['Velocity Shockwave', 'Titan Forge'],
    ['Midnight Laser', 'Frequency 9'], ['Infinite Rave', 'Circuit Breaker'],
    ['Voltage Riot', 'DJ Overkill'], ['Pulse Accelerator', 'Bass Shock'],
    ['Subatomic Impact', 'Dark Matter'], ['Echo Chamber Slam', 'Warp Speed'],
    ['Adrenaline Rush', 'Sonic Blast'], ['Stadium Banger', 'Festival Force'],
    ['Synthetic Euphoria', 'Techno Genesis'], ['Laser Beam Chaos', 'Prism Sound'],
    ['Gravity Drop', 'Orbital'], ['Turbulence 3000', 'Vector X'],
    ['Apex Predator', 'The Eliminator'], ['Supercharged', 'Rave Cannon']
  ],
  3: [
    ['Smooth Operator', 'Velvet Groove'], ['Late Night Funk', 'Brass District'],
    ['City Lights Promenade', 'Metro Funk'], ['Soul Connection', 'The Groove Lab'],
    ['Rhythm & Flow', 'Downtown Sync'], ['Midnight Cruiser', 'Neon Boulevard'],
    ['Sunny Afternoon Strut', 'Brass Machine'], ['Retrofit Jam', 'Analog Crew'],
    ['Velvet Lounge', 'Satin Keys'], ['Urban Wanderer', 'Streetwise Quintet'],
    ['Low-Fi Sunset', 'Tape Deck'], ['Funky Bassline', 'Slap Funkers'],
    ['Coastline Drive', 'Pacific Sunset'], ['Blue Moon Jazz', 'Sax Avenue'],
    ['Downtempo Vibe', 'Chillout Dept'], ['Coffeehouse Rhythm', 'Bossa Nova Club'],
    ['Subtle Elegance', 'The Lounge'], ['Warm Vinyl Beat', 'Crate Diggers'],
    ['Rooftop Sessions', 'Skyline Moods'], ['Step In Time', 'Tempo Kings']
  ],
  4: [
    ['Electric Heartbeat', 'Starlight Echo'], ['Summer Dreamer', 'Luna Ray'],
    ['Dance Till Dawn', 'The Disco Kids'], ['Shining Star', 'Bright Lights'],
    ['Catch the Sun', 'Beachfront Horizon'], ['Colors of the Night', 'Pop Radiance'],
    ['Glitter on the Floor', 'Diamond Pop'], ['Midnight Confetti', 'Sparkle Sound'],
    ['Candy Coated Beat', 'Pastel Harmony'], ['Run Away Together', 'The Wild Ones'],
    ['Party Like 1999', 'Retro Wave'], ['Golden Memories', 'Youth Club'],
    ['Stereo Love', 'Heart & Soul'], ['Higher Love', 'The Vocalists'],
    ['Joyride', 'Speedway Pop'], ['Euphoric Dreams', 'Daybreak'],
    ['Sweet Melody', 'The Chords'], ['Can\'t Stop Moving', 'Rhythm Nation'],
    ['All Night Long', 'Party Animal'], ['Pure Energy', 'Voltage Pop']
  ],
  5: [
    ['Deep Euphoria', 'Klangwelt'], ['Submerged Sub-Bass', 'Sonar Depth'],
    ['Hypnotic Horizon', 'Minimalist Collective'], ['Berlin After Dark', 'Klub 44'],
    ['Shadow Walker', 'Underground Sound'], ['Ocean Trench Groove', 'Abyss'],
    ['Repetitive Motion', 'Modular Synthesis'], ['Warehouse Echoes', 'Industrial Depth'],
    ['Dark Velvet Rhythms', 'Deep Phase'], ['Resonant Filter', 'Analog Pulse'],
    ['Monochrome Lights', 'Techno District'], ['Afterhours Sanctuary', 'Nocturne'],
    ['Low Frequency Soul', 'Sub Harmonic'], ['Ethereal Echoes', 'Ghost Freq'],
    ['The Inner Sphere', 'Synthetik'], ['Atmospheric Drift', 'Cloud Chamber'],
    ['Midnight Protocol', 'Code 5'], ['Deep Groove Syndicate', 'The Basement'],
    ['Minimalist Dream', 'Pulse Train'], ['Vortex Underground', 'Sub-Zero']
  ]
};

let sql = `-- =====================================================================
-- The Crowdsourced Festival Stage Optimizer : Deterministic Seed Data
-- =====================================================================

-- 1. Seed Vibe Clusters
INSERT INTO vibe_clusters (cluster_id, vibe_name, energy_level) VALUES
  (1, 'Chill Acoustic', 2),
  (2, 'High Energy EDM', 9),
  (3, 'Mid-Tempo Groove', 5),
  (4, 'Upbeat Pop', 7),
  (5, 'Deep House', 8)
ON CONFLICT (cluster_id) DO UPDATE SET vibe_name = EXCLUDED.vibe_name, energy_level = EXCLUDED.energy_level;

-- 2. Seed Adjacency Graph
INSERT INTO cluster_adjacency (from_cluster, to_cluster) VALUES
  (1, 3), (3, 1),
  (3, 4), (4, 3),
  (4, 5), (5, 4),
  (5, 2), (2, 5),
  (1, 4), (4, 1),
  (3, 5), (5, 3)
ON CONFLICT DO NOTHING;

-- 3. Seed Stage 1 (Main Stage)
INSERT INTO stages (
  stage_id, stage_name, current_cluster_id, current_vibe_score, total_votes,
  manual_override, threshold, window_seconds, cooldown_seconds, play_seconds, last_pivot_at
) VALUES (
  1, 'Main Stage', 1, 0, 0,
  FALSE, -50, 60, 20, 30, now()
) ON CONFLICT (stage_id) DO UPDATE SET
  current_cluster_id = EXCLUDED.current_cluster_id,
  threshold = EXCLUDED.threshold,
  window_seconds = EXCLUDED.window_seconds,
  cooldown_seconds = EXCLUDED.cooldown_seconds;

-- 4. Seed Tracks
`;

let trackId = 100;
const seededTracks = [];

for (const c of clusters) {
  const tracks = trackNames[c.id];
  for (let i = 0; i < tracks.length; i++) {
    trackId++;
    const [title, artist] = tracks[i];
    const duration = 180000 + (i * 5000);
    const tempo = c.bpm + ((i % 5) * 2);
    sql += `INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (${trackId}, ${c.id}, '${title.replace(/'/g, "''")}', '${artist.replace(/'/g, "''")}', ${duration}, ${tempo}, NULL) ON CONFLICT (track_id) DO NOTHING;\n`;
    if (c.id === 1 && seededTracks.length < 5) {
      seededTracks.push(trackId);
    }
  }
}

sql += `\n-- 5. Seed Live Queue for Stage 1\n`;
sql += `DELETE FROM live_queue WHERE stage_id = 1;\n`;
for (let i = 0; i < seededTracks.length; i++) {
  const status = i === 0 ? 'playing' : 'queued';
  const startedAt = i === 0 ? 'clock_timestamp()' : 'NULL';
  sql += `INSERT INTO live_queue (stage_id, track_id, play_order, status, started_at) VALUES (1, ${seededTracks[i]}, ${i + 1}, '${status}', ${startedAt});\n`;
}

fs.writeFileSync(path.join(__dirname, 'db', 'seed.sql'), sql, 'utf8');
console.log('Successfully generated db/seed.sql with 100 tracks, clusters, adjacency, and live queue.');
