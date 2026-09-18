import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
import os

# Create 100 mock tracks
num_tracks = 100
np.random.seed(42)

data = {
    'track_id': [f'track_{i}' for i in range(1, num_tracks + 1)],
    'title': [f'Festival Anthem {i}' for i in range(1, num_tracks + 1)],
    'artist_name': [f'DJ Autopilot {i%10}' for i in range(1, num_tracks + 1)],
    'duration_ms': np.random.randint(150000, 300000, num_tracks),
    'energy': np.random.rand(num_tracks),
    'tempo': np.random.uniform(80, 180, num_tracks),
    'acousticness': np.random.rand(num_tracks),
    # Using public domain test MP3s for reliable preview URLs
    'preview_url': [f'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-{i%16+1}.mp3' for i in range(1, num_tracks + 1)]
}

df = pd.DataFrame(data)

# Extract features for clustering
features = df[['energy', 'tempo', 'acousticness']].copy()

# Normalize tempo roughly to 0-1
features['tempo'] = (features['tempo'] - 80) / 100

# Run K-Means
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

with open(sql_file_path, 'w') as f:
    f.write("-- Seed Vibe_Clusters\n")
    for cluster_id, name in vibe_names.items():
        f.write(f"INSERT INTO Vibe_Clusters (cluster_id, vibe_name) VALUES ({cluster_id}, '{name}') ON CONFLICT DO NOTHING;\n")
        
    f.write("\n-- Seed Tracks\n")
    for _, row in df.iterrows():
        title = row['title'].replace("'", "''")
        artist = row['artist_name'].replace("'", "''")
        f.write(f"INSERT INTO Tracks (track_id, cluster_id, title, artist_name, duration_ms, preview_url) ")
        f.write(f"VALUES ('{row['track_id']}', {row['cluster_id']}, '{title}', '{artist}', {row['duration_ms']}, '{row['preview_url']}') ON CONFLICT DO NOTHING;\n")

    f.write("\n-- Seed Live_Queue for Main Stage with Cluster 1\n")
    f.write("INSERT INTO Live_Queue (stage_id, track_id, play_order, status) \n")
    f.write("SELECT 1, track_id, row_number() over (order by random()), 'QUEUED' \n")
    f.write("FROM Tracks WHERE cluster_id = 1 LIMIT 5;\n")
    
    f.write("\n-- Set first track to PLAYING\n")
    f.write("UPDATE Live_Queue SET status = 'PLAYING' WHERE queue_id = (SELECT queue_id FROM Live_Queue ORDER BY play_order LIMIT 1);\n")

print(f"Clustering complete. Output written to {sql_file_path}")
