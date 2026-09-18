# The Crowdsourced Festival Stage Optimizer

A 100% Autonomous, ML-Integrated Event Data Engine designed to showcase advanced database engineering (backend heavy-lifting, data integrity, automation, and concurrency control).

## Overview
This project replaces the human DJ with a PostgreSQL database. It uses offline Machine Learning (K-Means) to cluster tracks, and live Two-Phase Locking (2PL) and PL/pgSQL triggers to dynamically rewrite a festival stage's music queue based on crowdsourced voting.

## Documentation
- [Product Requirements (PRD)](PRD.md)
- [Technical Requirements (TRD)](TRD.md)
- [Architecture](ARCHITECTURE.md)
- [Rules & Guidelines](RULES.md)

## Tech Stack
- **Database**: PostgreSQL (Autopilot, 2PL, 3NF Schema)
- **ML**: Python, Scikit-learn (Offline ETL)
- **Backend**: Node.js, Express (Dumb Messenger)
- **Frontend**: React (Audience & Admin Interfaces)

## Setup Instructions (Coming Soon)
- Database schema initialization
- Python ML dataset seeding
- Running the Node.js API
- Running the React UI
