CREATE TABLE Vibe_Clusters (
    cluster_id INT PRIMARY KEY,
    vibe_name VARCHAR(255) NOT NULL
);

CREATE TABLE Tracks (
    track_id VARCHAR(255) PRIMARY KEY,
    cluster_id INT REFERENCES Vibe_Clusters(cluster_id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    artist_name VARCHAR(255) NOT NULL,
    duration_ms INT NOT NULL CHECK (duration_ms > 0),
    preview_url VARCHAR(1024)
);

CREATE TABLE Stages (
    stage_id SERIAL PRIMARY KEY,
    stage_name VARCHAR(255) NOT NULL,
    current_vibe_score INT DEFAULT 0,
    manual_override BOOLEAN DEFAULT FALSE
);

CREATE TABLE Live_Queue (
    queue_id SERIAL PRIMARY KEY,
    stage_id INT REFERENCES Stages(stage_id) ON DELETE CASCADE,
    track_id VARCHAR(255) REFERENCES Tracks(track_id) ON DELETE CASCADE,
    play_order INT NOT NULL,
    status VARCHAR(50) DEFAULT 'QUEUED' CHECK (status IN ('QUEUED', 'PLAYING', 'PLAYED'))
);

CREATE TABLE Live_Votes (
    vote_id SERIAL PRIMARY KEY,
    stage_id INT REFERENCES Stages(stage_id) ON DELETE CASCADE,
    track_id VARCHAR(255) REFERENCES Tracks(track_id) ON DELETE CASCADE,
    vote_value INT NOT NULL CHECK (vote_value IN (-1, 1)),
    vote_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_live_votes_stage_time ON Live_Votes(stage_id, vote_timestamp);

INSERT INTO Stages (stage_name, current_vibe_score) VALUES ('Main Stage', 0);
