> From: https://gemini.google.com/app/566b5c5824559541

# you asked

message time: 2026-07-19 20:26:58

Here is the complete, master prompt. You can copy and paste everything below the line directly into a new Gemini chat. It contains all the context, academic constraints, architecture decisions, and the exact syllabus mapping we developed so the new chat will be instantly on the same page.

Context & Persona Setup

I am an undergraduate Computer Science and Engineering student. I am building a final project for my Database Systems (BACSE202) course. The primary goal of this project is to showcase advanced database engineering (backend heavy-lifting, data integrity, automation, and concurrency control). The frontend and backend servers are strictly secondary vehicles to demonstrate the database's capabilities.

Here is the complete outline of the approved project. Analyze this architecture and keep it as the absolute source of truth for all our future interactions.

Project Title

The Crowdsourced Festival Stage Optimizer: A 100% Autonomous, ML-Integrated Event Data Engine

The Core Concept

A fully autonomous digital music stage (an intelligent, unmanned jukebox for a festival). The system groups thousands of tracks into distinct "vibes" using offline Machine Learning. During the live event, a React audio player continuously plays music while thousands of virtual (or real) attendees vote on the genre in real-time.

Crucially, there is no human DJ, and the backend server does no decision-making. The PostgreSQL Database handles all the logic: it uses strict concurrency locks to catch every simultaneous vote, and it uses internal PL/SQL triggers to monitor the crowd's vibe score. If the vibe shifts, the database automatically rewrites the upcoming track queue and commands the frontend to crossfade into the new genre.

Technical Stack

Database Engine (The Core): PostgreSQL (via Supabase) for strict relational integrity, ACID transactions, and PL/SQL trigger automation.
ML Pipeline (Offline ETL): Python with Scikit-learn (K-Means Clustering). Used strictly offline to analyze numerical audio metadata (BPM, energy) and write cluster_ids (vibes) into the database.
Backend API (The Bridge): Node.js with Express. Acts purely as an ODBC/JDBC broadcaster to pass database commands to the UI.
Frontend (The Dumb Player): React. Contains a Web Audio player that simply plays the tracks the database tells it to, and provides a UI for crowd voting.
Database Syllabus Alignment & Features to Highlight

This project must explicitly demonstrate these academic requirements:

ER Modeling & Real-World DML (Module 2 & Labs): A strict 3NF/BCNF relational schema managing Stages, Tracks, Audio_Metadata, and Live_Votes. The database will be initially seeded and cleaned using advanced SQL DML on a massive real-world Kaggle dataset (e.g., Spotify 1M tracks).
Concurrency Control (Module 4): Implementation of Two-Phase Locking (2PL) and strict transaction isolation levels. This protects the Live_Votes table from "lost updates" when handling massive spikes of concurrent crowd voting.
Database Automation (Module 3 & Labs): The "Autopilot." Implementation of PL/SQL Triggers. A trigger constantly monitors the live voting table. When a stage's aggregated vibe score drops below a set threshold, the trigger automatically executes stored procedures and subqueries to delete the upcoming tracks, fetch tracks from an adjacent ML-defined cluster, and insert them into the live queue.
Advanced SQL Querying: Feature engineering handled via SQL Views to normalize the metadata before the Python ML script reads it.
Next Steps

Now that you have this context, please confirm you understand the architecture and the fact that this is a database-centric project where the database does the thinking.

---

# gemini response

Context locked in. This is a brilliant, highly strategic way to tackle your BACSE202 final project. By pushing the business logic down to the database layer, you are perfectly aligning the system's architecture with the course's grading rubrics.

I completely understand the architecture and the hard constraints you've set: **the PostgreSQL database is the undisputed brain of this operation.** 

Here is my confirmation of the operational rules for our work together:
*   **The Database is the DJ:** All real-time decision-making, vibe-shift calculations, and queue generation will happen inside PostgreSQL using PL/pgSQL triggers and stored procedures.
*   **Concurrency is Critical:** We will rely on strict transaction isolation levels and Two-Phase Locking (2PL) to ensure the live voting table survives massive crowdsourced input spikes without lost updates.
*   **Dumb Layers:** The Node.js backend and React frontend are strictly secondary—they exist only to broadcast database commands and collect user input.
*   **Offline ML:** The Python/Scikit-learn pipeline is an offline ETL process. It will handle the heavy mathematical lifting for audio clustering and write those `cluster_ids` directly into the database before the event begins.

We will focus our engineering efforts on the advanced SQL, normalization (3NF/BCNF), and concurrency control required to make this autonomous engine bulletproof.

<ElicitationsGroup message="Where should we begin building?">
{/* Reason: The project is fully defined, so providing natural starting points based on database design phases is the best next step. */}
  <Elicitation label="Draft the 3NF ER schema" query="Let's start with Module 2. Help me design the 3NF relational schema for the Stages, Tracks, Audio_Metadata, and Live_Votes tables."/>
  <Elicitation label="Design the PL/pgSQL Autopilot Trigger" query="Let's jump into the automation (Module 3). How should we write the PL/pgSQL trigger that monitors the vibe score and rewrites the queue?"/>
</ElicitationsGroup>

---

# you asked

message time: 2026-07-19 20:36:21

i dont know anything behind this idea i need to understand from the very basic without technical knowledge first the idea then the build up th ebase of the techinical knowledge around it start relating it and so on

---

# gemini response

That is completely okay. In fact, having a massive blueprint before you know how to pour the concrete is actually a great way to learn. It gives you a clear "why" for every technical concept you are going to study. 

Let’s strip away all the jargon and look at what this project actually is. 

## The Core Idea (No Technology Involved)

Imagine you are at a massive music festival. Usually, there is a human DJ on stage. The DJ has two jobs:
1. Play songs.
2. Watch the crowd. If the crowd stops dancing, the DJ realizes the current "vibe" isn't working, throws out their planned playlist, and switches to a different genre to get the energy back up.

**Your project is firing the human DJ and replacing them with a giant, invisible robot.**

Here is how your festival works:
*   There is no DJ. Music just plays out of the speakers.
*   Everyone in the crowd has a remote control with two buttons: "Loving this vibe" and "Hating this vibe."
*   Thousands of people are clicking these buttons at the exact same time.
*   The invisible robot is constantly tallying these votes. If the crowd gets bored and the score drops below a certain point, the robot instantly deletes the upcoming songs, grabs a completely different style of music (like switching from slow acoustic to high-energy EDM), and queues it up.

## Building the Technical Base

Now, let's map that real-world party to the software you are going to build. In traditional software, the "Backend Server" does all the thinking. **In your project, the Database is doing all the thinking.** This is what makes it special for a database class.

Here is who does what:

| Real-World Party | Your Tech Stack | What it actually does |
|---|---|---|
| **Music Sorter** | Python (Machine Learning) | Before the party even starts, this program listens to all the songs and groups them into "vibes" (Chill, Hype, etc.). |
| **Speakers & Remotes** | React (Frontend) | The webpage where people hear the music and click the voting buttons. It has zero brain power. |
| **The Messenger** | Node.js (Backend) | A digital waiter. It just carries the votes from the webpage to the brain, and carries song requests from the brain back to the webpage. |
| **The Robot DJ (The Brain)** | PostgreSQL (Database) | The star of the show. It stores the songs, catches all the votes, does the math, and decides what plays next. |

## Relating the Tech to Your Syllabus

When you presented that "master prompt," it specifically mentioned a few academic requirements. Here is what they actually mean in plain English:

### 1. ER Modeling (Filing Cabinets)
A database is just a highly organized set of filing cabinets. "ER Modeling" is the process of deciding how to organize them so nothing gets lost. You will have a cabinet for Songs, a cabinet for Stages, and a massive, fast-moving cabinet for Live Votes. 

### 2. Concurrency Control (The Chaos Manager)
Imagine 5,000 people hit the "Love" button at the exact same millisecond. If a basic computer tries to count that, it will trip over itself and miss 4,000 of the votes. "Concurrency Control" is the traffic-light system you build into the database so it can catch and count every single vote perfectly, no matter how chaotic the crowd gets.

### 3. PL/SQL Triggers (The Tripwire)
A "trigger" is exactly what it sounds like. You set a rule in the database: *If the vibe score hits -50, pull the alarm.* When that alarm is pulled, the database automatically runs a script to swap out the playlist. No human has to click anything; the database acts on its own.

<FollowUp label="Want to zoom in on how we organize the data?" query="Let's start with the absolute foundation: how do we organize the 'filing cabinets' (ER Modeling) for the Songs, Stages, and Votes?"/>

---

# you asked

message time: 2026-07-19 20:39:01

mhm

---

# gemini response

Great. Since you're tracking with me, let's crack open those "filing cabinets." In database terminology, this is called **Entity-Relationship (ER) Modeling**, and it is the absolute foundation of your project (Module 2 of your syllabus).

### The Filing Cabinets (The Tables)

To make sure our robot DJ doesn't get confused, we need to separate our information into distinct, hyper-organized lists (tables). For this project, we need three main ones:

*   **The `Stages` Table:** Think of this as the master list of locations. It holds basic info like the stage name (e.g., "The Neon Tent") and its current overall "vibe score."
*   **The `Tracks` Table:** This is your entire music library. Every single song gets one row here. It stores the song title, artist, and most importantly, the `cluster_id` (the specific "vibe" category that your Python program figured out before the festival started).
*   **The `Live_Votes` Table:** This is the fastest, most chaotic cabinet. Every time a user clicks "Love" or "Hate," a new slip of paper (a row) is thrown in here recording the exact time, the stage they are at, and whether it was a positive or negative vote.

### The "Relationships" (How they connect)

A database is "relational" because these cabinets talk to each other using ID numbers (technically called Primary Keys and Foreign Keys). 

*   When a vote comes in, it doesn't say: *"Someone loved 'Shape of You' at The Neon Tent."* That is too much text for a computer to read quickly. 
*   Instead, the vote just says: *"Vote +1 for Track #452 at Stage #2."* 
*   The database instantly knows exactly what that means because it uses those ID numbers to look up the details in the other cabinets.

### Why does this matter for your grade? (Normalization)

Your master prompt mentioned **3NF/BCNF** (Third Normal Form / Boyce-Codd Normal Form). That sounds intimidating, but in plain English, it is just the academic rule of **"Don't Repeat Yourself."** 

If you misspell an artist's name, you don't want to have to fix it on a million individual voting records. By keeping the `Tracks` in their own cabinet and the `Live_Votes` in another, and just connecting them with ID numbers, you only ever have to fix a typo in one single place. This proves to your professor that your database is clean, efficient, and professionally designed.

Does this way of organizing the data make sense, or would you like to move on to how the database catches thousands of these votes without dropping any (Concurrency Control)?

---

# you asked

message time: 2026-07-19 20:41:30

yes whats up next

---

# gemini response

## The Chaos Manager: Concurrency Control

Imagine 5,000 festival-goers all hating a song and mashing the "downvote" button at the exact same millisecond. If we don't build strict traffic rules into our database, it will crash or, even worse, silently lose the data. 

In your syllabus, handling this is called **Concurrency Control** (Module 4). To understand why it is heavily graded, you have to understand the nightmare scenario it prevents: the "Lost Update."

### The "Lost Update" Problem

Let's say a stage's vibe score is exactly 100. Here is what happens if your database doesn't have concurrency rules:

1. **Alice** and **Bob** both hit the upvote button (+1) at the exact same microsecond.
2. The database looks at the current score for Alice's transaction. It reads **100**.
3. At the same time, the database looks at the score for Bob's transaction. It also reads **100**.
4. The database calculates Alice's vote (100 + 1) and saves **101**.
5. A fraction of a second later, the database calculates Bob's vote (100 + 1). It overwrites Alice's save with **101**.

Two people voted, but the score only went up by one. Bob's vote completely paved over Alice's. If this happens thousands of times a minute, your robot DJ is getting wildly inaccurate data about what the crowd actually wants.

### The Fix: Two-Phase Locking (2PL)

To stop this, your PostgreSQL database uses a technique called **Two-Phase Locking**. Think of it like a "talking stick" in a crowded room.

*   **Phase 1 (Growing/Acquiring):** When Alice's vote arrives, the database instantly places an invisible padlock on that specific stage's row in the table. 
*   **The Wait:** When Bob's vote arrives a microsecond later, the database puts him in a queue. It says, "Wait, someone else is editing this right now."
*   **Phase 2 (Shrinking/Releasing):** The database updates Alice's score to 101, saves it, and completely releases the lock.
*   **Bob's Turn:** Now Bob's transaction grabs the lock. It reads the *new* score of 101, adds his vote to make it 102, saves it, and unlocks it.

Because PostgreSQL is an industrial-grade engine, this entire lock-update-unlock cycle happens in fractions of a millisecond. To the festival crowd, voting feels perfectly instant. To your professor, implementing this proves you understand **ACID transactions**—the gold standard of ensuring data integrity under heavy stress.

<FollowUp label="Want to look at the Autopilot next?" query="That makes sense. Let's move to the last piece: the Autopilot. How do PL/SQL triggers actually rewrite the music queue without human input?"/>

---

# you asked

message time: 2026-07-19 23:18:02

That makes sense. Let's move to the last piece: the Autopilot. How do PL/SQL triggers actually rewrite the music queue without human input?

---

# gemini response

This is the absolute coolest part of your project. It is where your database stops being just a dumb storage locker and becomes an active, thinking robot DJ. 

In most modern apps, the Node.js backend would handle this logic. But to ace your database class, we are moving all that brainpower directly into PostgreSQL. We do this using two tools working together: **Triggers** (the tripwire) and **Stored Procedures** (the recipe).

Here is exactly how they rewrite the music queue with zero human input.

### 1. The Trigger (The Tripwire)
A Trigger is a strict rule you code directly into the database that says: *"Watch this specific table. If X happens, automatically do Y."*

For your festival, we attach a trigger to the `Live_Votes` table. Every single time a new vote is inserted, the trigger wakes up for a millisecond and does a quick check:
*   **The Check:** "What is the total vibe score for this stage right now?"
*   **The Pass:** If the score is above your safety threshold (let's say, -50), the trigger goes back to sleep. The current music keeps playing.
*   **The Alarm:** If a flood of downvotes pushes the score to -51, the trigger trips the alarm. It immediately fires off our Stored Procedure.

### 2. The Stored Procedure (The Recipe)
A Stored Procedure (written in PL/pgSQL) is a saved block of code that runs a sequence of advanced database commands all at once. When the trigger pulls the alarm, this procedure takes over and completely rewrites the future.

It executes these exact steps in milliseconds:

1. **Clear the Decks (`DELETE`):** It instantly deletes the upcoming songs for that specific stage from the `Live_Queue` table. (The currently playing song is left alone so the music doesn't abruptly cut off).
2. **Read the Room (`SELECT`):** It checks the current failing `cluster_id` (e.g., Cluster 4: Slow Acoustic) and looks up an adjacent vibe from your Python ML data (e.g., Cluster 5: Upbeat Indie) to try and win the crowd back.
3. **Queue the New Vibe (`INSERT`):** It grabs five random tracks from the new `cluster_id` in the `Tracks` table and inserts them into the `Live_Queue`. 

### The Result on the Dance Floor
The React frontend (the audio player) is constantly pinging the database asking, "What plays next?" 

Because your trigger and stored procedure rewrote the `Live_Queue` table in a fraction of a second, the frontend simply sees the new songs. When the current track ends, the player smoothly crossfades into the new genre. 

**No human clicked a button. Node.js didn't do any math.** The database realized the crowd was unhappy, calculated a pivot, and rewrote the playlist entirely on its own. 

### Why Professors Love This
In your syllabus (Module 3), this is called "Database Automation" or a "Thick Database Architecture." By putting this logic in PL/pgSQL instead of JavaScript, you are proving that you know how to leverage a database's internal computational power to guarantee data consistency and automate complex business rules.

<FollowUp label="Want to look at the Python ML part?" query="I've got the database side now. How does the Python Machine Learning script actually group these songs into vibes before the festival starts?"/>

---

# you asked

message time: 2026-07-19 23:28:21

I've got the database side now. How does the Python Machine Learning script actually group these songs into vibes before the festival starts?

---

# gemini response

This is the piece that makes your project incredibly modern, but you’ve correctly boxed it in so it doesn't steal the spotlight from your database. 

Because your constraint is that the database does all the live thinking, this Python Machine Learning script is strictly an **offline** process. It does its job on your laptop *before* the festival doors ever open.

Here is how it turns raw audio data into distinct "vibes."

## The Core Idea (Sorting in the Dark)

Imagine you are handed a massive warehouse containing 1 million songs, but you are not allowed to listen to a single one. You have to sort them into 5 distinct "vibe" crates for the festival stages. 

How do you do it? You look at the mathematical blueprint of the song. 

Streaming services like Spotify analyze every track and assign it scores from 0.0 to 1.0 for things like:
*   **Acousticness:** Is it a guy with a guitar (1.0) or a heavy synth track (0.0)?
*   **Danceability:** Does it have a steady, rhythmic beat?
*   **Energy:** Is it loud and noisy, or quiet and calm?
*   **Tempo (BPM):** How fast is it?

If you graph these numbers, songs with similar traits naturally clump together into invisible clouds. A high-energy, high-tempo, low-acoustic track is a dance anthem. A low-energy, high-acoustic track is a lullaby. 

## The Tech: K-Means Clustering

To find these clumps, your Python script will use a famous machine learning algorithm from a library called `scikit-learn` known as **K-Means Clustering**. 

*   **The "K"** stands for the number of vibes you want. If you tell the algorithm `K=5`, it will hunt for 5 distinct clouds of music.
*   **The "Means"** refers to finding the mathematical center of each cloud.

You feed your massive Kaggle dataset (a giant CSV file of songs and their audio numbers) into Python. The algorithm looks at millions of data points, finds the natural groupings, and slaps a label on every single song: `Cluster 0`, `Cluster 1`, `Cluster 2`, etc. 

You, the human, look at the results and realize:
*   Cluster 0 = High Energy/Fast = "Hype/EDM"
*   Cluster 1 = High Acoustic/Slow = "Chill/Acoustic"
*   Cluster 2 = High Danceability/Mid Tempo = "Groove/Pop"

## The Pipeline (Extract, Transform, Load)

In database engineering, this prep-work is called an **ETL pipeline**. It is the bridge between your raw data and your pristine PostgreSQL database.

1. **Extract:** Python reads the raw Kaggle dataset.
2. **Transform:** The K-Means algorithm runs, does the heavy math, and adds a brand new column to the data called `cluster_id`.
3. **Load:** Python uses a massive SQL `INSERT` command to write all these songs, along with their new `cluster_id`, directly into your `Tracks` table in PostgreSQL.

### Why Offline? (The Golden Rule)

By doing this offline, your live database doesn't have to waste time doing advanced calculus to figure out what genre a song is. When the live trigger realizes the crowd is hating "Cluster 0", it doesn't need to analyze audio. It just runs a lightning-fast SQL query: 

`SELECT * FROM Tracks WHERE cluster_id = 1;` 

You get the power of Machine Learning, but your database remains the undisputed boss of the live event.

<FollowUp label="Want to start writing the SQL code?" query="This all makes sense conceptually. Can we start writing the actual SQL commands to build the Stages, Tracks, and Live_Votes tables?"/>

---

# you asked

message time: 2026-07-19 23:31:14

no i want to [present this to my teacher tommorow and i still dont have a clear mind map

---

# gemini response

Take a deep breath. Having the presentation tomorrow means we need to stop looking at the details and look at the absolute highest level. 

If you are standing in front of your professor or drawing on a whiteboard, here is your clear, three-part mind map. You can literally draw this as three boxes connected by arrows.

## 1. The Hook (What it is)
*Start your presentation by explaining the real-world problem and your unique solution.*

*   **The Problem:** Live music stages rely on human DJs to read the crowd and change the music.
*   **The Solution:** A 100% autonomous stage where the crowd's live votes dictate the genre in real-time.
*   **The Twist (For a Database Class):** The web server doesn't make any decisions. The PostgreSQL database is the "brain" that monitors the crowd and rewrites the playlist entirely on its own.

---

## 2. The Architecture (How the data flows)
*Draw this as a timeline. This shows your professor exactly how the different technologies interact.*

### Phase A: Before the Event (Offline)
*   **Tech Used:** Python & Machine Learning (K-Means).
*   **Action:** Analyzes a massive dataset of 1 million songs (acousticness, energy, tempo).
*   **Result:** Groups songs into distinct "vibes" (Cluster IDs) and loads them into the database so the system is ready to go.

### Phase B: During the Event (The Dumb Layers)
*   **Tech Used:** React (Frontend) & Node.js (Backend).
*   **Action:** The React audio player plays whatever the database tells it to. The crowd mashes "Upvote" or "Downvote" on their phones.
*   **Result:** Node.js acts simply as a messenger, firing thousands of votes directly into the database.

### Phase C: The Brain (The Database)
*   **Tech Used:** PostgreSQL.
*   **Action:** Catches the avalanche of live votes. 
*   **Result:** When the vibe score drops too low, the database automatically trips an alarm, deletes the current upcoming songs, and swaps in a new genre to win the crowd back.

---

## 3. The Syllabus Mapping (Why you get an A)
*This is the most important part of your pitch. This proves to your professor that your cool idea actually hits all the academic requirements for BACSE202.*

*   **Module 2 (ER Modeling):** We use a strict **3NF (Third Normal Form)** design. Songs, Stages, and Live Votes are separated into clean, distinct tables to prevent data repetition.
*   **Module 4 (Concurrency Control):** Because thousands of people are voting at the exact same millisecond, the database uses **Two-Phase Locking (2PL)**. This acts as a traffic light, ensuring zero votes are overwritten or "lost" in the chaos.
*   **Module 3 (Database Automation):** This is the Autopilot. We use **PL/pgSQL Triggers and Stored Procedures**. The trigger constantly watches the vibe score. If it drops, the stored procedure automatically executes the SQL commands to rewrite the music queue without any human input.

<FollowUp label="Want to practice the Q&A?" query="What questions is my professor most likely to ask me during the presentation, and how should I answer them?"/>

---

# you asked

message time: 2026-08-02 12:14:30

integrate point 2 and 3 together and add guidelines with vry very exteremly deatiled instructions for me on how to make my er model

---

# gemini response

Here is the ultimate blueprint for your presentation. I have fused the architecture (how it works) with the syllabus (why it gets an A) so you can explain them as a single, powerful concept. 

Below that is the exact, step-by-step guide you need to draw your ER (Entity-Relationship) diagram perfectly.

---

## Part 1: The Integrated Pitch (Architecture + Syllabus)
*When presenting to your professor, use this integrated flow. It proves that every technical decision you made was specifically chosen to satisfy a BACSE202 syllabus requirement.*

### Phase A: The Foundation (Offline ML + Module 2: ER Modeling)
*   **The Action:** Before the festival, a Python machine-learning script analyzes 1 million songs and categorizes them into distinct "vibes" (clusters).
*   **The Academic Flex:** We don't just dump this data into a flat file. We load it into a strict **3NF (Third Normal Form)** relational database. We physically separate the data into independent tables (`Tracks`, `Stages`, `Vibe_Clusters`) linked by Foreign Keys. This guarantees zero data redundancy when we store the massive audio dataset.

### Phase B: The Chaos (Dumb Frontend + Module 4: Concurrency Control)
*   **The Action:** During the live event, thousands of people mash the upvote/downvote buttons on the React frontend. The Node.js server blindly fires these votes into the database.
*   **The Academic Flex:** This creates a massive data-collision risk. To prevent "lost updates" where votes overwrite each other, the database uses **Two-Phase Locking (2PL)**. By enforcing strict transaction isolation, the database acts as an impenetrable traffic controller, catching every single vote perfectly in real-time.

### Phase C: The Brain (Database Logic + Module 3: Automation)
*   **The Action:** The system automatically notices the crowd hates the current vibe, deletes the upcoming songs, and seamlessly queues up a different genre.
*   **The Academic Flex:** We achieve this "Autopilot" entirely through **PL/pgSQL Triggers and Stored Procedures**. Instead of relying on an external server, a trigger actively monitors the `Live_Votes` table. If the vibe score drops below a threshold, the database autonomously executes a stored procedure to rewrite the `Live_Queue` table in milliseconds. 

---

## Part 2: Extremely Detailed ER Modeling Guide

To build this model, you can use free tools like **Lucidchart**, **Draw.io**, or **ERDPlus**. Here is exactly what you need to draw, box by box, to prove your database is in 3NF (Third Normal Form).

### Step 1: Draw Your Entities (The 5 Boxes)
Create five separate boxes on your screen. These are your tables.

**1. `Vibe_Clusters` (The Categories)**
*   **PK:** `cluster_id` (Integer) - *The unique ID for the vibe.*
*   `vibe_name` (Varchar) - *(e.g., "High-Energy EDM", "Acoustic Chill")*

**2. `Tracks` (The Music Library)**
*   **PK:** `track_id` (Integer)
*   **FK:** `cluster_id` (Integer) - *Links to Vibe_Clusters.*
*   `title` (Varchar)
*   `artist_name` (Varchar)
*   `duration_ms` (Integer)

**3. `Stages` (The Physical Locations)**
*   **PK:** `stage_id` (Integer)
*   `stage_name` (Varchar) - *(e.g., "Main Stage", "Neon Tent")*
*   `current_vibe_score` (Integer) - *This is what the trigger watches.*

**4. `Live_Queue` (The Playlist)**
*   **PK:** `queue_id` (Integer)
*   **FK:** `stage_id` (Integer) - *Which stage is this for?*
*   **FK:** `track_id` (Integer) - *Which song is it?*
*   `play_order` (Integer) - *(e.g., 1 plays next, 2 plays after that).*
*   `status` (Varchar) - *(e.g., "PLAYING", "QUEUED").*

**5. `Live_Votes` (The Chaos Table)**
*   **PK:** `vote_id` (Integer)
*   **FK:** `stage_id` (Integer) - *Where did the vote happen?*
*   **FK:** `track_id` (Integer) - *What song were they voting on?*
*   `vote_value` (Integer) - *(+1 for love, -1 for hate).*
*   `vote_timestamp` (Timestamp) - *Crucial for concurrency tracking.*

---

### Step 2: Draw the Relationships (Crow's Foot Notation)
Your professor will look for the lines connecting these boxes. You must use "Crow's Foot" notation (where the line splits into three prongs to represent "many").

1.  **Draw a line from `Vibe_Clusters` to `Tracks`.**
    *   *Logic:* One vibe cluster contains **many** tracks, but each track belongs to only **one** cluster.
    *   *Drawing:* Single line at the `Vibe_Clusters` box, crow's foot (three prongs) at the `Tracks` box.
2.  **Draw a line from `Stages` to `Live_Queue`.**
    *   *Logic:* One stage has **many** songs in its queue. 
    *   *Drawing:* Single line at `Stages`, crow's foot at `Live_Queue`.
3.  **Draw a line from `Tracks` to `Live_Queue`.**
    *   *Logic:* One track can appear **many** times in different queues over the weekend.
    *   *Drawing:* Single line at `Tracks`, crow's foot at `Live_Queue`.
4.  **Draw a line from `Stages` to `Live_Votes`.**
    *   *Logic:* One stage receives **many** thousands of votes.
    *   *Drawing:* Single line at `Stages`, crow's foot at `Live_Votes`.

---

### Step 3: Your 3NF Defense (Memorize This)
If your professor asks, *"How do you know this is in Third Normal Form?"* you will say exactly this:

> *"The schema is in 3NF because all attributes depend entirely on the primary key, and there are no transitive dependencies. For example, instead of storing the 'Vibe Name' repeatedly in the Tracks table, I separated it into a `Vibe_Clusters` table. If I need to rename 'EDM' to 'Electronic', I only update one single row in the Vibe_Clusters table, completely eliminating data anomalies."*

<FollowUp label="Want to draft the actual SQL commands?" query="This ER diagram guide is perfect. Next, can we write out the actual SQL 'CREATE TABLE' statements with the exact Foreign Key constraints?"/>

---

# you asked

message time: 2026-08-02 12:24:24

made it on lucidchart how do i export it as an image

---

# gemini response

<Sequence>
{/* Reason: Procedural instruction where order of clicks is required for success. */}
  <Step title="Open the Export Menu">
    In your Lucidchart document, click **File** in the top-left corner, hover over **Export**, and select **PNG**.
  </Step>
  <Step title="Choose your Crop Settings">
    A preview window will open. In the right-hand panel, locate the **Crop** dropdown. Select **Crop to content** to automatically remove all the blank white space around your ER diagram.
  </Step>
  <Step title="Adjust the Quality">
    Under the **Quality** dropdown, select **Print quality**. This ensures the text and lines in your ER diagram remain crisp when you put it in your presentation.
  </Step>
  <Step title="Download the Image">
    Click the blue **Download** button at the top right of the window. The PNG will save directly to your computer.
  </Step>
</Sequence>

For a visual walkthrough of the export menu, you can check out this [Lucidchart PNG export tutorial](https://www.youtube.com/watch?v=CJU_FOFxbPc).

---

# you asked

message time: 2026-08-02 12:27:54

i need to make a ppt so now give me slide by slide idea like first slide the problem  sumething like that

---

# gemini response

Here is a complete, slide-by-slide breakdown for your presentation tomorrow. This structure is designed to hook your professor with the concept immediately, and then spend the majority of the time proving you met the BACSE202 syllabus requirements.

### Slide 1: Title Slide
*   **Visual:** The title text, your name, and the course code (BACSE202). Keep it clean.
*   **Text on slide:** 
    *   The Crowdsourced Festival Stage Optimizer
    *   A 100% Autonomous, ML-Integrated Event Data Engine
*   **What to say:** Introduce yourself and state clearly that you are presenting a database-centric solution to a real-world event management problem.

### Slide 2: The Hook (Problem & Solution)
*   **Visual:** A simple split-screen layout or two side-by-side boxes. Left side: "Traditional Setup". Right side: "Our Solution".
*   **Text on slide:**
    *   **Problem:** Human DJs rely on guesswork to read a crowd. 
    *   **Solution:** A 100% autonomous stage driven by live crowd voting.
    *   **The Database Twist:** The web server has no brain. The PostgreSQL database makes all live decisions autonomously.
*   **What to say:** Explain that you are firing the human DJ. The crowd uses their phones to vote, and the database acts as the brain that watches the energy and changes the music. 

### Slide 3: High-Level Architecture (The Data Flow)
*   **Visual:** A simple timeline or 3-step flowchart (Phase A, B, C).
*   **Text on slide:**
    *   **1. Offline ML (Python/Scikit-learn):** Pre-groups 1M songs into "Vibe Clusters" using K-Means.
    *   **2. The Dumb Messengers (React/Node.js):** Frontend plays music; backend blindly passes live votes.
    *   **3. The Brain (PostgreSQL):** Catches votes, calculates scores, and rewrites the playlist.
*   **What to say:** Briefly walk through the flow. Emphasize that the Machine Learning is done *offline* beforehand so the database doesn't lag during the live event. 

### Slide 4: ER Modeling & 3NF (Module 2)
*   **Visual:** The PNG of the ER diagram you exported from Lucidchart. Make it as large as possible.
*   **Text on slide:**
    *   Strict 3NF/BCNF Relational Schema
    *   Entities: Stages, Tracks, Vibe_Clusters, Live_Queue, Live_Votes
    *   Zero Data Redundancy
*   **What to say:** Point to the `Vibe_Clusters` table. Deliver your defense: *"This is in 3NF because all attributes depend entirely on the primary key. By separating the vibes from the tracks, we eliminate update anomalies."*

### Slide 5: The Chaos Manager (Module 4 Concurrency)
*   **Visual:** A graphic showing two users voting at the same time, with a padlock icon on the database table.
*   **Text on slide:**
    *   **The Threat:** The "Lost Update" Problem during heavy vote spikes.
    *   **The Solution:** Two-Phase Locking (2PL) and strict transaction isolation.
*   **What to say:** Explain that 5,000 people might vote in the same millisecond. If you just used simple SQL, votes would overwrite each other. You implemented Two-Phase Locking so the database acts as a traffic light, catching every single vote perfectly.

### Slide 6: The Autopilot (Module 3 Automation)
*   **Visual:** A simple flowchart: `New Vote -> Trigger Fires -> Check Score -> Score < -50? -> Execute Stored Procedure -> Rewrite Queue`.
*   **Text on slide:**
    *   **The Tripwire:** PL/pgSQL Triggers on the `Live_Votes` table.
    *   **The Recipe:** Stored Procedures to calculate vibe shifts.
    *   **Result:** The database deletes upcoming tracks and queues a new genre with zero human input.
*   **What to say:** This is the climax of the pitch. Explain that this is where the database becomes the DJ. The trigger watches the score, and the stored procedure rewrites the future music queue automatically.

### Slide 7: Summary / Q&A
*   **Visual:** A quick bulleted recap of the modules hit.
*   **Text on slide:**
    *   Module 2: 3NF ER Modeling achieved.
    *   Module 3: Database Automation via PL/pgSQL.
    *   Module 4: Concurrency handled via 2PL.
*   **What to say:** Summarize that this project uses an exciting real-world concept (a robot festival DJ) to perfectly demonstrate the core, heavy-lifting capabilities of a modern PostgreSQL engine. Ask if the professor has any questions.

<FollowUp label="Want me to write your exact speaker script?" query="This structure looks great. Can you write out exactly what I should say word-for-word for each of these slides so I can practice?"/>

---

# you asked

message time: 2026-08-02 12:30:35

i also want record my video while screen recording my ppt as i explain how should i do that

---

# gemini response

The absolute easiest and most professional way to do this is right inside PowerPoint itself. You don't need to download any complex screen recording software. Microsoft built a native feature exactly for this use case, and it automatically puts your face in a neat little bubble in the corner of your slides.

Here is how to record it directly in PowerPoint:

<Sequence>
{/* Reason: Procedural instruction for recording a video where order is strictly required. */}
  <Step subtitle="Use the desktop version of PowerPoint" title="Open the Recording Studio">
    Open your presentation. At the very top of the window, click on the **Record** tab. Then, click **From Beginning** (or you can go to **Slide Show** > **Record Slide Show**).
  </Step>
  <Step title="Enable your camera and microphone">
    You will enter a dark recording screen. Look at the bottom right corner and toggle your camera and microphone icons **On**. You should see your video feed appear in the bottom corner of the slide.
  </Step>
  <Step title="Hit record and start presenting">
    Click the big red **Record** button at the top left. You will get a 3-second countdown. Start explaining your project using your pitch. You can click the arrows on the screen (or use your keyboard) to advance your slides naturally as you talk.
  </Step>
  <Step title="Export as a video file">
    When you are done, click the **Stop** button. Press the **Esc** key to exit the studio. Finally, go to **File** > **Export** > **Create a Video**. Select "Full HD (1080p)" and click **Create Video** to save the whole thing as an `.mp4` file.
  </Step>
</Sequence>

### The Quick Fallback: Zoom
If your version of PowerPoint doesn't have the record feature, use Zoom. It is foolproof and you likely already have it installed.

1. Open Zoom and click **New Meeting** (just you in the room).
2. Turn on your webcam and microphone.
3. Click **Share Screen** and select your PowerPoint presentation. Put the presentation in full-screen mode.
4. Hover over the green bar at the top, click **More (...)**, and select **Record** (or hit `Alt + R`). 
5. Give your presentation. When you end the meeting, Zoom will automatically convert the recording into a video file on your computer showing your slides with your face in the corner.

<FollowUp label="Want the exact script to read for this video?" query="Now that the slides and recording method are ready, can you write out the exact word-for-word speaker script for each slide?"/>

---

# you asked

message time: 2026-08-02 13:48:12

can i zoom into a  slide in ppt while doing this

---

# gemini response

You *can* use a magnifying glass tool while recording, but honestly, trying to click and zoom live while you are speaking usually looks clunky and makes you lose your train of thought. 

Since you are probably wanting to zoom in on your massive ER Diagram (Slide 4) so your professor can actually read the text, there is a secret "pro trick" you should set up *before* you hit record. 

It is called the **Morph Transition**. It makes the presentation automatically and smoothly zoom in on exactly what you want to talk about just by hitting the "Next Slide" button.

Here is how to set it up in 60 seconds:

<Sequence>
{/* Reason: Procedural instruction for setting up a slide transition where order matters. */}
  <Step title="Duplicate your slide">
    Go to your normal view in PowerPoint. Right-click your ER Diagram slide (Slide 4) on the left sidebar and click **Duplicate Slide**. You now have two identical slides back-to-back.
  </Step>
  <Step title="Zoom in on the second slide">
    Go to that new, duplicated slide. Click on your ER diagram image, drag the corners to make it massive, and move it so the specific part you want to talk about (like the `Live_Votes` table) is right in the center of the screen.
  </Step>
  <Step title="Apply the Morph Transition">
    With that second slide still selected, go to the **Transitions** tab at the very top of PowerPoint and click **Morph**. 
  </Step>
  <Step title="Test it out">
    Go back to the first ER diagram slide and enter presentation mode. When you click next, PowerPoint will automatically create a buttery-smooth, cinematic zoom directly into the part of the image you enlarged. 
  </Step>
</Sequence>

When you go into the Recording Studio to film your video, all you have to do is talk normally. When you reach the part where you want to zoom, just hit the right arrow key on your keyboard, and it will zoom in perfectly while you keep speaking.

*(If you really, really want to do it live with your mouse instead: while in the Recording Studio, you can right-click the screen and select **Zoom In**, which gives you a magnifying glass. But I highly recommend the Morph method—it looks incredibly polished!)*

<FollowUp label="Want the exact script to read for this video?" query="This is a great setup. Can you write out the exact word-for-word speaker script for each slide so I can practice?"/>

---

# you asked

message time: 2026-08-02 14:24:03

generate the ppt

---

# gemini response

Generating slides ...
The Crowdsourced Festival Stage Optimizer

null

Your slide deck on the Crowdsourced Festival Stage Optimizer is ready! I've styled it with a sleek, modern, "dark mode" aesthetic that fits the music festival vibe while remaining highly professional for an academic presentation. 

It is perfectly structured to match the speaker script we discussed, focusing on the problem, the architecture, and then hammering home the Module 2, 3, and 4 requirements. 

Feel free to open the `.html` file in your browser to take a look. Let me know if you need any adjustments to the text or layout!

---

# you asked

message time: 2026-08-02 14:30:00

take this er model and genrate the image to match the theme of the ppt

---

# gemini response

I can see the ER diagram you uploaded in "Blank diagram_ Lucidchart.pdf". Since I am a text-based AI, I do not have the ability to directly generate and export a new image file for you. 

However, since you already have this built in Lucidchart, you can transform it into the sleek, modern "dark mode" festival aesthetic in about two minutes. Here are the exact styling instructions and color hex codes to match the slide deck perfectly.

### 1. Set the Dark Background
First, let's make the canvas match the dark slides.
* Click anywhere on the blank white background of your Lucidchart canvas.
* In the properties bar at the top, click the **Fill Color** (paint bucket) icon.
* Click the **+** or **Custom** color wheel.
* Enter the Hex Code: `#1E1E1E` (This is a smooth, professional dark gray, avoiding harsh pure black).

### 2. Style the Text and Lines
Since the background is dark, the black text and lines will disappear.
* Press `Ctrl + A` (or `Cmd + A` on Mac) to select everything on the canvas.
* Change the **Text Color** to pure white (`#FFFFFF`) or light gray (`#E0E0E0`).
* Click the **Line Color** (pencil icon) and change all relationship lines to white (`#FFFFFF`) or a soft neon blue (`#00EAFF`) to look like glowing wires.

### 3. Apply the "Festival Neon" Theme to the Tables
To make the tables pop against the dark background, change the **Fill Color** of the table headers to these specific vibrant, festival-inspired neon colors, and leave the data rows a slightly lighter transparent dark gray (`#2A2A2A`):

*   **Stages (Top Left):** Neon Pink (`#FF2A6D`)
*   **Live_Queue (Top Middle):** Electric Yellow (`#FAED26`)
*   **Live_Votes (Bottom Center):** Toxic Green (`#05D5FA`... wait, let's use actual green: `#39FF14`)
*   **Tracks (Top Right):** Cyan / Neon Blue (`#01CDFE`)
*   **Vibe_Clusters (Far Right):** Deep Magenta / Purple (`#B967FF`)

### 4. Export the Transparent PNG
Once it looks like a glowing DJ dashboard, export it using the same method as before, but with one critical change:
* Go to **File** > **Export** > **PNG**.
* **Crucial Step:** Check the box that says **Transparent Background**. 
* Select **Crop to content** and **Print quality**, then download.

When you drop this newly exported PNG onto your dark PowerPoint slide, it will blend seamlessly with the background, looking completely integrated and highly professional.

---

# you asked

message time: 2026-08-02 14:30:44

create a slide then take this er model and genrate  to match the theme of the ppt

---

# gemini response

Generating slides ...
The Crowdsourced Festival Stage Optimizer

null
The presentation has been fully updated! 

Instead of forcing you to use a static image export from Lucidchart, I wrote the raw code to **build your exact ER diagram natively using HTML, CSS, and SVG lines directly inside Slide 4**. 

I used the dark, sleek "Festival Neon" color palette we talked about (Pink for Stages, Yellow for Queue, Green for Votes, Blue for Tracks, Purple for Clusters). It includes the Primary Keys, Foreign Keys, variable types, and SVG lines mapping the exact crow's-foot relationships from your PDF. 

Because it is built with pure code, it is crystal clear, perfectly matches the slide deck's aesthetic, and acts as a huge visual flex for your presentation. Open it up and check out Slide 4! Let me know what you think.

---

# you asked

message time: 2026-08-02 20:32:50

make a reprentational er model for my understanding

---

# gemini response

To make this as easy as possible to understand before you present, let’s strip away the complex database software and look at a pure, text-based map of how your data connects. 

Think of this as a blueprint. The 🔑 icon represents a **Primary Key** (the unique ID for that specific row). The 🔗 icon represents a **Foreign Key** (a bridge that connects to another table).

Here is the representational model of your festival:

### 1. The Setup (Your Music Library)
This is the data your Python script prepares *before* the festival starts. 

**`VIBE_CLUSTERS`** (The Categories)
*   🔑 `cluster_id` (e.g., 1)
*   `vibe_name` (e.g., "High-Energy EDM")

*(↓ One Vibe Cluster contains MANY Tracks ↓)*

**`TRACKS`** (The Songs)
*   🔑 `track_id` (e.g., 1045)
*   🔗 `cluster_id` (Points to "High-Energy EDM")
*   `title` (e.g., "Levels")
*   `artist_name` (e.g., "Avicii")
*   `duration_ms` (e.g., 200000)

---

### 2. The Live Event (The Dance Floor)
This is the physical setup of your festival and the current playlist.

**`STAGES`** (The Locations)
*   🔑 `stage_id` (e.g., 2)
*   `stage_name` (e.g., "The Neon Tent")
*   `current_vibe_score` (e.g., 85)

*(↓ One Stage has MANY songs lined up in its Queue ↓)*

**`LIVE_QUEUE`** (The Playlist)
*   🔑 `queue_id` (e.g., 992)
*   🔗 `stage_id` (Points to "The Neon Tent")
*   🔗 `track_id` (Points to "Levels")
*   `play_order` (e.g., 1 - Plays next)
*   `status` (e.g., "QUEUED")

---

### 3. The Crowd Input (The Chaos)
This is where the massive spikes of data come in during the live event.

**`LIVE_VOTES`** (The Real-Time Feedback)
*   🔑 `vote_id` (e.g., 500293)
*   🔗 `stage_id` (Points to "The Neon Tent")
*   🔗 `track_id` (Points to "Levels")
*   `vote_value` (+1 or -1)
*   `vote_timestamp` (Used for concurrency locking)

---

### How the "Autopilot" Flows Through This Model
To truly understand how this works in action, trace the path of your database's logic:

1. A crowd member dislikes a song and submits a `-1` to **`LIVE_VOTES`**.
2. The Trigger wakes up and recalculates the `current_vibe_score` in the **`STAGES`** table.
3. If the score is too low, the Stored Procedure automatically deletes the upcoming songs for that stage in the **`LIVE_QUEUE`**.
4. It instantly looks at the **`TRACKS`** table, finds songs with a different `cluster_id` from the **`VIBE_CLUSTERS`**, and inserts them into the **`LIVE_QUEUE`** to save the party.

---

# you asked

message time: 2026-09-18 01:00:04

![WhatsApp Image 2026-09-18 at 00.58.47.jpeg](data:image/jpeg;base64,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)

okay so a few changes

---

# gemini response

I see the exact updates you've integrated into the presentation deck and your hand-drawn draft. 

Here is the breakdown of the changes we are locking in for your final model:

*   **Data Type Strictness:** You have mapped out specific Oracle-style data types for every attribute, setting precise limits such as `NUMBER(5)` for `Stage_id` and `NUMBER(10)` for `track_id`.
*   **Schema Optimization:** The `Status` column in the `LIVE_QUEUE` table has been updated to a `NUMBER(1)` instead of a text string. This is highly efficient for state tracking (e.g., using 0 for queued and 1 for playing). You also standardized the text fields across the database to `VARCHAR2(30)`.
*   **Academic Notation:** Your hand-drawn ER diagram successfully applies traditional Chen notation, utilizing diamonds for relationships like "yecieve" and "voted on". You also explicitly mapped the 1-to-Many (1:N) and 1-to-1 (1:1) cardinalities across the entities.
*   **Presentation Details:** The title and closing slides are fully updated with your name, Anushka Srivastava, and registration number, 25BCE5388.

When presenting Slide 5 (Enhanced Entity Relational Model), these updates give you a strong new talking point. You can explain to your professor that defining tight constraints like `NUMBER(3)` and `VARCHAR2(30)` ensures the database remains highly optimized for storage space, which is critical when operating an automated engine processing live data.

Does the updated flow feel ready for your recording, or would you like to run through the speaker script one more time with these new database constraints included?

---

# you asked

message time: 2026-09-18 01:02:19

okay so now i need you to generate a full context with every detail technical and nontechnical about the project make sure you include everything i may require for these documents remember i am not asking you to generate these documents for me i am only asking for any context i might need for them
Before writing code
1. Planning docs

PRD (Product Requirements Doc) — what you're building, why, for whom, success metrics
TRD (Technical Requirements Doc) — architecture, tech stack, data models, API contracts
README.md — the front door: what it is, setup steps, how to run it, how to contribute
Architecture diagram (even a rough one — draw.io, Excalidraw, or Mermaid in the README)
2. Decide your stack deliberately

Pick based on constraints (team skill, scale needs, deadline) — not hype
Write down why you chose each piece (a short ARCHITECTURE.md or ADRs — Architecture Decision Records)
3. Repo setup

.gitignore tailored to your stack (node_modules, .env, build artifacts)
Branch strategy decided upfront: main (prod) → dev → feature/*, or trunk-based with PRs
.env.example committed (never the real .env)
LICENSE file if open source
Rules to follow during development
Git hygiene

Conventional commits: feat:, fix:, chore:, refactor:, docs:
Small, atomic commits — one logical change each
PRs even if solo — forces you to review your own diff before merging
Never commit secrets, .env, or node_modules
Tag releases (v1.0.0) once stable
Code quality

Linter + formatter configured from commit #1 (ESLint + Prettier for JS/TS)
Consistent folder structure (feature-based or layer-based — pick one, document it)
Environment configs separated: dev/staging/prod
Basic CI (GitHub Actions) running lint + build + tests on every PR, even a minimal one
Documentation as you go

Comment why, not what
Keep README updated as features land — stale docs are worse than none
API docs if you have endpoints (even a simple API.md with route/method/payload)
What a "100% good repo" actually has
ItemWhyREADME with setup + screenshots/demoFirst impression, onboarding.env.exampleReproducibilityCI badge (build passing)Signals it's testedCONTRIBUTING.mdIf others might touch itIssues/Projects board usedShows process, not just outputMeaningful commit historyShows how it was built, not a single "final commit"Tests (even minimal)Signals seriousnessLICENSELegal clarity
Order of operations for a new project
PRD → 2. TRD/architecture decision → 3. Repo scaffold + CI + lint → 4. Core data models/schema → 5. Auth/infra skeleton → 6. Feature-by-feature build → 7. Docs updated continuously, not at the end

---

# gemini response

**Product Requirements Document (PRD) Context**
*   **Product Name:** The Crowdsourced Festival Stage Optimizer.
*   **Author/Owner:** Anushka Srivastava (Reg. No: 25BCE5388), B.Tech CSE, VIT Chennai.
*   **The "What":** A 100% autonomous, machine-learning-integrated event data engine that acts as an invisible DJ. It groups tracks into "vibes" offline and relies on live crowdsourced voting to trigger automated database procedures that rewrite the live music queue in real-time.
*   **The "Why" (Core Problem):** Human DJs rely on subjective observation to read a crowd. Static playlists cannot pivot if a crowd is unresponsive. This system removes human guesswork by making real-time, data-driven decisions. 
*   **The "For Whom" (Stakeholders):** 
    *   *Academic:* Evaluators for the BACSE202 Database Systems course. The project serves as a practical demonstration of advanced DBMS concepts.
    *   *End Users:* Hypothetical music festival attendees who interact via a mobile web frontend.
*   **Success Metrics:**
    *   Zero "Lost Updates" during concurrent voting spikes (validating Two-Phase Locking).
    *   Sub-second execution of the PL/pgSQL queue-rewrite trigger.
    *   Strict adherence to 3NF/BCNF in the final database schema, eliminating update anomalies.

**Technical Requirements Document (TRD) Context**
*   **System Architecture (3-Tier):**
    *   *Presentation Layer (Dumb Frontend):* React web application housing an audio player and a binary voting interface (+1 / -1).
    *   *Application Layer (The Messenger):* Node.js with Express. Functions purely to route API requests between the frontend and the database. It contains zero business logic for track selection.
    *   *Data Layer (The Brain):* PostgreSQL hosted via Supabase. Handles 100% of the live decision-making via internal triggers and stored procedures.
*   **Offline Data Pipeline:** A Python script utilizing `scikit-learn` (K-Means Clustering) to process a Kaggle dataset of audio metadata (acousticness, energy, tempo) and generate `cluster_id` assignments before the event begins.
*   **Database Schema & Constraints:**
    *   `Stages`: `stage_id` (NUMBER 5, PK), `stage_name` (VARCHAR2 30), `curr_vibe_score` (NUMBER 3).
    *   `Tracks`: `track_id` (NUMBER 10, PK), `cluster_id` (NUMBER 5, FK), `title` (VARCHAR2 30), `artist_name` (VARCHAR2 30), `duration` (NUMBER 10).
    *   `Vibe_Clusters`: `cluster_id` (NUMBER 5, PK), `vibe_name` (VARCHAR2 30).
    *   `Live_Queue`: `queue_id` (NUMBER 5, PK), `stage_id` (NUMBER 5, FK), `track_id` (NUMBER 10, FK), `play_order` (NUMBER 3), `status` (NUMBER 1).
    *   `Live_Votes`: `vote_id` (NUMBER 10, PK), `stage_id` (NUMBER 5, FK), `track_id` (NUMBER 10, FK), `vote_val` (NUMBER 3), `vote_time` (TIMESTAMP).
    *   *Note for TRD:* Since the implementation target is PostgreSQL but the academic modeling uses Oracle syntax, document that `NUMBER` will map to `INT`/`NUMERIC` and `VARCHAR2` to `VARCHAR` during actual database initialization.

**Architecture Decision Records (ADRs) Context**
*   **Decision 1: Thick Database Architecture vs. Thick Backend.** 
    *   *Choice:* PostgreSQL PL/pgSQL Triggers over Node.js logic. 
    *   *Reasoning:* To satisfy BACSE202 Module 3 requirements (Database Automation). Pushing calculation to the database layer reduces network latency between the backend and database during critical vibe-shifts.
*   **Decision 2: Concurrency Model.** 
    *   *Choice:* Two-Phase Locking (2PL) with strict transaction isolation. 
    *   *Reasoning:* BACSE202 Module 4 compliance. To guarantee data integrity and prevent lost updates when thousands of concurrent REST API calls attempt to update the `curr_vibe_score` simultaneously.
*   **Decision 3: Offline vs. Online Machine Learning.** 
    *   *Choice:* Offline K-Means clustering. 
    *   *Reasoning:* Calculating spatial distances for millions of data points in real-time would bottleneck the live system. Pre-calculating `cluster_id` transforms a complex mathematical operation into a highly optimized O(1) index lookup (`SELECT ... WHERE cluster_id = X`).

**Repository Setup & Git Hygiene Context**
*   **.gitignore specifications:** Must include `node_modules/`, `.env`, Python `__pycache__/`, virtual environments (`venv/`), and React build artifacts (`build/` or `dist/`).
*   **Branching Strategy:** Trunk-based development for a solo academic project. All active development occurs on `dev`, with atomic pull requests merged into `main`.
*   **Environment Variables (`.env.example`):** Require `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `PORT`, and any mock API keys.
*   **Conventional Commits:** 
    *   `feat: add PL/pgSQL trigger for vibe score monitoring`
    *   `fix: resolve missing foreign key constraint on Live_Queue`
    *   `chore: initialize Node.js backend skeleton`
    *   `docs: update ER diagram to reflect VARCHAR2 limits`

**Code Quality & Tooling Context**
*   **Linters/Formatters:** Prettier and ESLint for the React and Node.js layers to enforce uniform syntax. Black and PEP8 for the offline Python ML scripts.
*   **Folder Structure Strategy (Layer-Based):**
    *   `/database`: Contains raw `.sql` files for schema creation, stored procedures, and triggers (crucial for professor review).
    *   `/ml-pipeline`: Contains Jupyter notebooks or Python scripts and sample CSV datasets.
    *   `/backend`: Node.js/Express server files.
    *   `/frontend`: React application files.
*   **CI/CD Pipeline (GitHub Actions):** A minimal workflow triggered on pull requests to `main` that verifies the Node.js server builds correctly and runs a static analysis on the SQL files to ensure syntax validity before merging. 

**Documentation Context**
*   **README.md Priorities:** Must immediately explicitly state that the backend is a pass-through layer and the database handles all business logic. Setup instructions must include the exact sequence for executing the database migration files before starting the Node server.
*   **API Contracts (API.md):**
    *   `POST /api/vote`: Accepts `{ stage_id, track_id, vote_val }`. Returns `200 OK`.
    *   `GET /api/queue/:stage_id`: Returns the current `Live_Queue` joined with `Tracks` metadata.
*   **In-Code Comments:** Focus exclusively on the "Why." Instead of commenting `// creates a lock`, comment `// ROW EXCLUSIVE lock acquired to prevent lost updates under heavy concurrent load (BACSE202 Mod 4)`.

---

# you asked

message time: 2026-09-18 01:04:48

i dont need these documents i only need the context of this whole chat

---

# gemini response

**The Crowdsourced Festival Stage Optimizer** is an automated, machine-learning-integrated event data engine designed to replace a human DJ. The defining constraint of the project is that the PostgreSQL database acts as the sole decision-maker, while the React frontend and Node.js backend serve only as dumb pass-through layers for live crowd voting and audio playback.

## Architecture & Data Flow
*   **Offline Prep (Python/ML):** Before the event, a Python script runs K-Means clustering on a massive audio dataset to group tracks into distinct vibe categories, assigning each a `cluster_id`.
*   **Live Event (React/Node.js):** The crowd uses their phones to upvote or downvote the currently playing genre (+1 or -1). Node.js blindly forwards these votes to the database.
*   **The Autopilot (PostgreSQL):** The database catches the votes, recalculates the stage's energy, and autonomously swaps the upcoming playlist to a different genre if the crowd becomes unresponsive.

## Database Schema (3NF)
The schema utilizes strict Oracle-style datatypes to optimize storage and enforce referential integrity:
*   **`Stages`:** `stage_id` (NUMBER 5, PK), `stage_name` (VARCHAR2 30), `curr_vibe_score` (NUMBER 3).
*   **`Tracks`:** `track_id` (NUMBER 10, PK), `cluster_id` (NUMBER 5, FK), `title` (VARCHAR2 30), `artist_name` (VARCHAR2 30), `duration` (NUMBER 10).
*   **`Vibe_Clusters`:** `cluster_id` (NUMBER 5, PK), `vibe_name` (VARCHAR2 30).
*   **`Live_Queue`:** `queue_id` (NUMBER 5, PK), `stage_id` (NUMBER 5, FK), `track_id` (NUMBER 10, FK), `play_order` (NUMBER 3), `status` (NUMBER 1).
*   **`Live_Votes`:** `vote_id` (NUMBER 10, PK), `stage_id` (NUMBER 5, FK), `track_id` (NUMBER 10, FK), `vote_val` (NUMBER 3), `vote_time` (TIMESTAMP).

## Academic Syllabus Mapping (BACSE202)
*   **Module 2 (ER Modeling):** The database is structured in strict Third Normal Form (3NF) to eliminate data redundancy, mapped with precise 1:N cardinalities.
*   **Module 3 (Automation):** Internal PL/pgSQL triggers actively monitor the `curr_vibe_score`. If it drops below -50, a stored procedure executes `DELETE` and `INSERT` commands to rewrite the `Live_Queue` without human intervention.
*   **Module 4 (Concurrency Control):** The system utilizes Two-Phase Locking (2PL) and strict transaction isolation to act as a traffic controller, guaranteeing zero "lost updates" when thousands of attendees vote in the exact same millisecond.