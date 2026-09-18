import pandas as pd
import numpy as np
from sklearn.cluster import KMeans
import os
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
import time

# Use Environment variables for Spotify Credentials
# SPOTIPY_CLIENT_ID='your_client_id'
# SPOTIPY_CLIENT_SECRET='your_client_secret'

def get_mock_data():
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
        'preview_url': [f'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-{i%16+1}.mp3' for i in range(1, num_tracks + 1)]
    }
    return pd.DataFrame(data)

def get_spotify_data():
    try:
        # Requires SPOTIPY_CLIENT_ID and SPOTIPY_CLIENT_SECRET in env
        auth_manager = SpotifyClientCredentials()
        sp = spotipy.Spotify(auth_manager=auth_manager)
        
        # We will fetch tracks from a few distinct playlists (EDM, Pop, Acoustic)
        playlists = [
            '37i9dQZF1DX4dyzvuaRJ0n', # Mint (EDM)
            '37i9dQZF1DXcBWIGoYBM5M', # Today's Top Hits (Pop)
            '37i9dQZF1DWWEJlAGA9SR0'  # Chill Hits (Acoustic/Chill)
        ]
        
        tracks_data = []
        for pl in playlists:
            results = sp.playlist_tracks(pl, limit=40)
            for item in results['items']:
                track = item['track']
                if not track or not track['preview_url']:
                    continue
                tracks_data.append({
                    'track_id': track['id'],
                    'title': track['name'],
                    'artist_name': track['artists'][0]['name'],
                    'duration_ms': track['duration_ms'],
                    'preview_url': track['preview_url']
                })
        
        # Get audio features
        df = pd.DataFrame(tracks_data).drop_duplicates(subset=['track_id'])
        # Spotipy audio_features has a limit of 100 per request
        track_ids = df['track_id'].tolist()
        features_data = []
        for i in range(0, len(track_ids), 100):
            batch = track_ids[i:i+100]
            features_data.extend(sp.audio_features(batch))
            
        features_df = pd.DataFrame([f for f in features_data if f is not None])
        
        # Merge
        df = pd.merge(df, features_df[['id', 'energy', 'tempo', 'acousticness']], left_on='track_id', right_on='id', how='inner')
        return df
    except Exception as e:
        print("Failed to fetch Spotify data (are SPOTIPY_CLIENT_ID and SPOTIPY_CLIENT_SECRET set?). Falling back to mock data.")
        print(f"Error: {e}")
        return get_mock_data()

df = get_spotify_data()

features = df[['energy', 'tempo', 'acousticness']].copy()
# Normalize tempo roughly to 0-1
features['tempo'] = (features['tempo'] - 80) / 100

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
