import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
import os
import requests
import time

def fetch_itunes_tracks():
    print("Fetching tracks from iTunes API...")
    # We will search for different genres to synthesize stats
    genres = {
        'edm': {'energy': (0.8, 1.0), 'tempo': (120, 150), 'acousticness': (0.0, 0.2)},
        'pop': {'energy': (0.6, 0.9), 'tempo': (100, 130), 'acousticness': (0.1, 0.4)},
        'acoustic': {'energy': (0.2, 0.5), 'tempo': (70, 100), 'acousticness': (0.6, 1.0)},
        'hiphop': {'energy': (0.6, 0.8), 'tempo': (80, 110), 'acousticness': (0.0, 0.3)},
        'classical': {'energy': (0.1, 0.3), 'tempo': (60, 90), 'acousticness': (0.8, 1.0)}
    }
    
    tracks_data = []
    
    for genre, stats in genres.items():
        try:
            url = f"https://itunes.apple.com/search?term={genre}&entity=song&limit=30"
            res = requests.get(url, timeout=10)
            if res.status_code == 200:
                data = res.json()
                for item in data.get('results', []):
                    if 'previewUrl' not in item:
                        continue
                        
                    # Synthesize features based on genre archetype so K-Means works flawlessly
                    energy = np.random.uniform(stats['energy'][0], stats['energy'][1])
                    tempo = np.random.uniform(stats['tempo'][0], stats['tempo'][1])
                    acousticness = np.random.uniform(stats['acousticness'][0], stats['acousticness'][1])
                    
                    tracks_data.append({
                        'track_id': str(item['trackId']),
                        'title': item['trackName'],
                        'artist_name': item['artistName'],
                        'duration_ms': item.get('trackTimeMillis', 30000),
                        'preview_url': item['previewUrl'],
                        'energy': energy,
                        'tempo': tempo,
                        'acousticness': acousticness
                    })
            time.sleep(1) # Be polite to the API
        except Exception as e:
            print(f"Error fetching {genre}: {e}")
            
    return pd.DataFrame(tracks_data).drop_duplicates(subset=['track_id'])

df = fetch_itunes_tracks()

if len(df) == 0:
    print("Failed to fetch from iTunes. Creating 100 dummy tracks.")
    np.random.seed(42)
    df = pd.DataFrame({
        'track_id': [f'track_{i}' for i in range(1, 101)],
        'title': [f'Festival Anthem {i}' for i in range(1, 101)],
        'artist_name': [f'DJ Autopilot {i%10}' for i in range(1, 101)],
        'duration_ms': np.random.randint(150000, 300000, 100),
        'energy': np.random.rand(100),
        'tempo': np.random.uniform(80, 180, 100),
        'acousticness': np.random.rand(100),
        'preview_url': [f'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-{i%16+1}.mp3' for i in range(1, 101)]
    })

print(f"Loaded {len(df)} tracks.")

features = df[['energy', 'tempo', 'acousticness']].copy()
# Normalize tempo roughly to 0-1
features['tempo'] = (features['tempo'] - 60) / 100

print("Running K-Means clustering...")
kmeans = KMeans(n_clusters=5, random_state=42, n_init=10)
df['cluster_id'] = kmeans.fit_predict(features) + 1  # 1-indexed for SQL

vibe_names = {
    1: 'Chill Acoustic',
    2: 'High Energy EDM',
    3: 'Mid-Tempo Groove',
    4: 'Upbeat Pop',
    5: 'Deep House'
}

# Generate seed.sql
sql_file_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'db', 'seed.sql'))

with open(sql_file_path, 'w', encoding='utf-8') as f:
    f.write("-- Seed Vibe_Clusters\n")
    for cluster_id, name in vibe_names.items():
        f.write(f"INSERT INTO Vibe_Clusters (cluster_id, vibe_name) VALUES ({cluster_id}, '{name}') ON CONFLICT DO NOTHING;\n")
        
    f.write("\n-- Seed Tracks\n")
    for _, row in df.iterrows():
        title = str(row['title']).replace("'", "''")
        artist = str(row['artist_name']).replace("'", "''")
        f.write(f"INSERT INTO Tracks (track_id, cluster_id, title, artist_name, duration_ms, preview_url) ")
        f.write(f"VALUES ('{row['track_id']}', {row['cluster_id']}, '{title}', '{artist}', {row['duration_ms']}, '{row['preview_url']}') ON CONFLICT DO NOTHING;\n")

    f.write("\n-- Seed Live_Queue for Main Stage with Cluster 1\n")
    f.write("INSERT INTO Live_Queue (stage_id, track_id, play_order, status) \n")
    f.write("SELECT 1, track_id, row_number() over (order by random()), 'QUEUED' \n")
    f.write("FROM Tracks WHERE cluster_id = 1 LIMIT 5;\n")
    
    f.write("\n-- Set first track to PLAYING\n")
    f.write("UPDATE Live_Queue SET status = 'PLAYING' WHERE queue_id = (SELECT queue_id FROM Live_Queue ORDER BY play_order LIMIT 1);\n")

print(f"Clustering complete. Output written to {sql_file_path}")
