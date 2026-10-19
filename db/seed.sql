-- =====================================================================
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
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (101, 1, 'Sunrise Serenade', 'Acoustic Trio', 180000, 82, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (102, 1, 'Mountain Breeze', 'Cedar Strings', 185000, 84, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (103, 1, 'Coffee & Vinyl', 'Quiet Waves', 190000, 86, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (104, 1, 'Driftwood', 'The Folk Meadow', 195000, 88, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (105, 1, 'Golden Hour Glow', 'Hollow Pine', 200000, 90, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (106, 1, 'Sunday Mist', 'Lowland Breeze', 205000, 82, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (107, 1, 'Barefoot Melody', 'Willow Echoes', 210000, 84, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (108, 1, 'Fireside Strum', 'The Campers', 215000, 86, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (109, 1, 'Autumn Leaves Fall', 'Harvest Moon', 220000, 88, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (110, 1, 'River Whispers', 'Acoustic Duo', 225000, 90, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (111, 1, 'Lakeside Cabin', 'Northbound', 230000, 82, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (112, 1, 'Gentle Rain', 'Soft Resonance', 235000, 84, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (113, 1, 'Warm Embrace', 'Folk Harbor', 240000, 86, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (114, 1, 'Twilight Acoustic', 'Solitude Key', 245000, 88, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (115, 1, 'Dawn Over the Valley', 'Timberline', 250000, 90, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (116, 1, 'Paper Boats', 'Riverstone', 255000, 82, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (117, 1, 'Old Porch Bench', 'Bluebird Road', 260000, 84, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (118, 1, 'Strings in the Wind', 'Pinehurst', 265000, 86, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (119, 1, 'Silent Horizon', 'Wanderlust Acoustic', 270000, 88, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (120, 1, 'Peaceful Slumber', 'Nightfall', 275000, 90, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (121, 2, 'Bassline Supernova', 'DJ Nitro', 180000, 130, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (122, 2, 'Neon Overdrive', 'CyberPulse', 185000, 132, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (123, 2, 'Drop the Pressure', 'Viper Beat', 190000, 134, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (124, 2, 'Solar Flare Anthem', 'Apex Raves', 195000, 136, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (125, 2, 'Galactic Surge', 'Hyperdrive', 200000, 138, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (126, 2, 'Velocity Shockwave', 'Titan Forge', 205000, 130, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (127, 2, 'Midnight Laser', 'Frequency 9', 210000, 132, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (128, 2, 'Infinite Rave', 'Circuit Breaker', 215000, 134, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (129, 2, 'Voltage Riot', 'DJ Overkill', 220000, 136, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (130, 2, 'Pulse Accelerator', 'Bass Shock', 225000, 138, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (131, 2, 'Subatomic Impact', 'Dark Matter', 230000, 130, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (132, 2, 'Echo Chamber Slam', 'Warp Speed', 235000, 132, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (133, 2, 'Adrenaline Rush', 'Sonic Blast', 240000, 134, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (134, 2, 'Stadium Banger', 'Festival Force', 245000, 136, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (135, 2, 'Synthetic Euphoria', 'Techno Genesis', 250000, 138, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (136, 2, 'Laser Beam Chaos', 'Prism Sound', 255000, 130, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (137, 2, 'Gravity Drop', 'Orbital', 260000, 132, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (138, 2, 'Turbulence 3000', 'Vector X', 265000, 134, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (139, 2, 'Apex Predator', 'The Eliminator', 270000, 136, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (140, 2, 'Supercharged', 'Rave Cannon', 275000, 138, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (141, 3, 'Smooth Operator', 'Velvet Groove', 180000, 105, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (142, 3, 'Late Night Funk', 'Brass District', 185000, 107, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (143, 3, 'City Lights Promenade', 'Metro Funk', 190000, 109, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (144, 3, 'Soul Connection', 'The Groove Lab', 195000, 111, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (145, 3, 'Rhythm & Flow', 'Downtown Sync', 200000, 113, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (146, 3, 'Midnight Cruiser', 'Neon Boulevard', 205000, 105, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (147, 3, 'Sunny Afternoon Strut', 'Brass Machine', 210000, 107, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (148, 3, 'Retrofit Jam', 'Analog Crew', 215000, 109, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (149, 3, 'Velvet Lounge', 'Satin Keys', 220000, 111, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (150, 3, 'Urban Wanderer', 'Streetwise Quintet', 225000, 113, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (151, 3, 'Low-Fi Sunset', 'Tape Deck', 230000, 105, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (152, 3, 'Funky Bassline', 'Slap Funkers', 235000, 107, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (153, 3, 'Coastline Drive', 'Pacific Sunset', 240000, 109, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (154, 3, 'Blue Moon Jazz', 'Sax Avenue', 245000, 111, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (155, 3, 'Downtempo Vibe', 'Chillout Dept', 250000, 113, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (156, 3, 'Coffeehouse Rhythm', 'Bossa Nova Club', 255000, 105, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (157, 3, 'Subtle Elegance', 'The Lounge', 260000, 107, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (158, 3, 'Warm Vinyl Beat', 'Crate Diggers', 265000, 109, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (159, 3, 'Rooftop Sessions', 'Skyline Moods', 270000, 111, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (160, 3, 'Step In Time', 'Tempo Kings', 275000, 113, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (161, 4, 'Electric Heartbeat', 'Starlight Echo', 180000, 120, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (162, 4, 'Summer Dreamer', 'Luna Ray', 185000, 122, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (163, 4, 'Dance Till Dawn', 'The Disco Kids', 190000, 124, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (164, 4, 'Shining Star', 'Bright Lights', 195000, 126, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (165, 4, 'Catch the Sun', 'Beachfront Horizon', 200000, 128, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (166, 4, 'Colors of the Night', 'Pop Radiance', 205000, 120, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (167, 4, 'Glitter on the Floor', 'Diamond Pop', 210000, 122, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (168, 4, 'Midnight Confetti', 'Sparkle Sound', 215000, 124, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (169, 4, 'Candy Coated Beat', 'Pastel Harmony', 220000, 126, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (170, 4, 'Run Away Together', 'The Wild Ones', 225000, 128, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (171, 4, 'Party Like 1999', 'Retro Wave', 230000, 120, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (172, 4, 'Golden Memories', 'Youth Club', 235000, 122, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (173, 4, 'Stereo Love', 'Heart & Soul', 240000, 124, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (174, 4, 'Higher Love', 'The Vocalists', 245000, 126, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (175, 4, 'Joyride', 'Speedway Pop', 250000, 128, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (176, 4, 'Euphoric Dreams', 'Daybreak', 255000, 120, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (177, 4, 'Sweet Melody', 'The Chords', 260000, 122, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (178, 4, 'Can''t Stop Moving', 'Rhythm Nation', 265000, 124, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (179, 4, 'All Night Long', 'Party Animal', 270000, 126, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (180, 4, 'Pure Energy', 'Voltage Pop', 275000, 128, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (181, 5, 'Deep Euphoria', 'Klangwelt', 180000, 124, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (182, 5, 'Submerged Sub-Bass', 'Sonar Depth', 185000, 126, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (183, 5, 'Hypnotic Horizon', 'Minimalist Collective', 190000, 128, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (184, 5, 'Berlin After Dark', 'Klub 44', 195000, 130, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (185, 5, 'Shadow Walker', 'Underground Sound', 200000, 132, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (186, 5, 'Ocean Trench Groove', 'Abyss', 205000, 124, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (187, 5, 'Repetitive Motion', 'Modular Synthesis', 210000, 126, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (188, 5, 'Warehouse Echoes', 'Industrial Depth', 215000, 128, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (189, 5, 'Dark Velvet Rhythms', 'Deep Phase', 220000, 130, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (190, 5, 'Resonant Filter', 'Analog Pulse', 225000, 132, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (191, 5, 'Monochrome Lights', 'Techno District', 230000, 124, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (192, 5, 'Afterhours Sanctuary', 'Nocturne', 235000, 126, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (193, 5, 'Low Frequency Soul', 'Sub Harmonic', 240000, 128, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (194, 5, 'Ethereal Echoes', 'Ghost Freq', 245000, 130, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (195, 5, 'The Inner Sphere', 'Synthetik', 250000, 132, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (196, 5, 'Atmospheric Drift', 'Cloud Chamber', 255000, 124, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (197, 5, 'Midnight Protocol', 'Code 5', 260000, 126, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (198, 5, 'Deep Groove Syndicate', 'The Basement', 265000, 128, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (199, 5, 'Minimalist Dream', 'Pulse Train', 270000, 130, NULL) ON CONFLICT (track_id) DO NOTHING;
INSERT INTO tracks (track_id, cluster_id, title, artist_name, duration_ms, tempo, audio_url) VALUES (200, 5, 'Vortex Underground', 'Sub-Zero', 275000, 132, NULL) ON CONFLICT (track_id) DO NOTHING;

-- 5. Seed Live Queue for Stage 1
DELETE FROM live_queue WHERE stage_id = 1;
INSERT INTO live_queue (stage_id, track_id, play_order, status, started_at) VALUES (1, 101, 1, 'playing', clock_timestamp());
INSERT INTO live_queue (stage_id, track_id, play_order, status, started_at) VALUES (1, 102, 2, 'queued', NULL);
INSERT INTO live_queue (stage_id, track_id, play_order, status, started_at) VALUES (1, 103, 3, 'queued', NULL);
INSERT INTO live_queue (stage_id, track_id, play_order, status, started_at) VALUES (1, 104, 4, 'queued', NULL);
INSERT INTO live_queue (stage_id, track_id, play_order, status, started_at) VALUES (1, 105, 5, 'queued', NULL);
