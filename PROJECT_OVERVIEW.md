# How It Was Built: Festival Stage Optimizer

This document explains how this project works, what pieces of software were used to build it, and how they talk to each other—in simple, everyday English!

## What is this project?
Normally, a DJ reads the crowd and decides what music to play next. This project replaces the human DJ with an automated database. The crowd votes on their phones in real time, and when the crowd starts to hate the current "vibe", the system automatically notices and switches the stage's music queue to a completely different style of music.

## The Software Pieces (What they are and their purpose)

### 1. PostgreSQL (The "Brain" & Database)
* **What it is:** A highly reliable system for storing data.
* **Its purpose:** It acts as the brain of the operation. It stores all the songs, tracks the current score of the crowd, and records every vote. More importantly, we gave it special "rules" (called triggers and procedures). When the crowd's score drops too low, the database automatically kicks in and changes the music to a new vibe. It does all the heavy lifting!

### 2. Node.js (The "Messenger" Backend)
* **What it is:** A program that runs on a server and handles requests over the internet.
* **Its purpose:** It acts as a bridge. The database isn't allowed to talk directly to web browsers for security reasons. So, Node.js listens for votes coming from the audience's phones, passes those votes to the database, and when the database changes the music, Node.js broadcasts that update back to all the screens. It doesn't make decisions; it just delivers messages quickly.

### 3. React (The "Face" Frontend)
* **What it is:** A tool for building user interfaces (websites and apps).
* **Its purpose:** This is what you actually see on your screen. 
  * The **Audience View** is designed for phones so people can see the current song and tap a button to vote if they dislike it.
  * The **Admin View** is a dashboard for a laptop or iPad, showing the stage manager the live score plummeting and recording the exact moment the system decides to switch the vibe.

### 4. Python (The "Organizer" Machine Learning)
* **What it is:** A popular programming language great for data analysis.
* **Its purpose:** Before the festival even starts, we feed Python thousands of songs. Python uses a Machine Learning technique (called clustering) to group songs that sound similar—grouping high-energy dance tracks together, and slow acoustic tracks together. It creates the different "vibes" so the database knows what to play next.

### 5. Docker (The "Shipping Container")
* **What it is:** A tool that packages software into neat, standardized boxes.
* **Its purpose:** Setting up a database, a backend server, and a frontend website on a new computer usually takes hours of configuring. Docker wraps all these pieces into one package so the entire project can be started on any computer with a single command. 

---

## User Flow & Communication During Operation

Here is the exact journey of a vote and how the system communicates when people are actively using the application:

### Scenario 1: The Crowd Rejects the Music (Automated Autopilot)
1. **Action (User Flow):** An audience member doesn't like the song playing. They look at their phone (React Frontend) and tap the "Hate this vibe" button.
2. **Communication (Network):** That tap travels instantly over the Wi-Fi to the server (Node.js Backend), sending a message: *"User X downvoted the current song."*
3. **Processing (The Brain):** The server hands the vote to the database (PostgreSQL). The database lowers the current "vibe score".
4. **The Pivot Decision:** As more people vote, the score drops. Once it hits a critical low point (the threshold, usually -50), the database's automated rules instantly trigger. The database clears the upcoming songs in the queue and replaces them with a completely different style of music.
5. **The Broadcast (Communication):** The server (Node.js) is constantly monitoring the queue. When it sees that the database has changed the music, it broadcasts a signal back out to every phone and laptop connected to the system. 
6. **Result (User Flow):** The Admin Dashboard flashes with a new log entry showing an "Autopilot Pivot" just occurred, and all the Audience screens instantly update to show the new song playing.

### Scenario 2: The Stage Manager Takes Control (Manual Override)
1. **Action (User Flow):** The Stage Manager decides they want to stick with the current music style regardless of the crowd's votes. They tick the "Manual override" box on the Admin Dashboard.
2. **Communication (Network):** The Admin Dashboard tells the Node.js server to update the database, flipping the override switch to "ON".
3. **Processing (The Brain):** The crowd keeps voting "Hate this vibe". The score plummets well past the -50 threshold. However, because the manual override switch is ON, the database's automated rules see the override and *refuse* to change the music. 
4. **Action (User Flow):** The Stage Manager decides they want to manually change the genre. They click "Force a vibe" on the Admin Dashboard and select a new style.
5. **Communication & Result:** The server commands the database to change the queue immediately. The database complies, the server broadcasts the change, and all the Audience screens update to the manager's chosen song.
