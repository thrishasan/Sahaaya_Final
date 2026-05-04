DEPLOYED : https://thrishasan.github.io/Sahaaya_Final/



# Sahaaya - Smart Healthcare Assistant

---

## Project Overview

Sahaaya is a smart healthcare assistant web application designed to provide an integrated digital healthcare management system. It combines medicine tracking, smart reminders, emergency SOS alerts, health record management, voice assistant support, and healthcare provider discovery into a single platform.
The system is built using a full-stack architecture with Node.js backend, SQLite database, and a responsive frontend interface.

---

## Key Features (Brief Overview)

### Medicine Management
- Add, update, and delete medicines
- Track medicine schedules
- Stored using SQLite database

### Smart Reminder System
- Create time-based reminders with repeat options
- Edit, disable, and delete reminders
- Automatic scheduler triggers reminders in real-time

### Emergency SOS System
- Add emergency contacts (caretakers)
- Sends WhatsApp SOS alerts with live location
- Maintains SOS history logs

### Health Records Management
- Store medical records such as blood pressure, sugar, heart rate, temperature, and allergies
- Add notes and date-wise tracking

### Voice Assistant
- Voice-based interaction for application control
- Supports multiple languages (English, Tamil, Hindi)
- Includes fallback system for unrecognized commands
- Provides intelligent responses even when input is unclear

### Healthcare Provider System
- Register doctors, clinics, and hospitals
- Admin verification workflow
- Search and interaction with providers

---

## How to Run the Project Locally

Follow the steps below to run the Sahaaya project on a local system.

---

### Step 1: Extract or Clone the Project
If downloaded as a ZIP file, extract it.
OR
Clone the repository using Git:
```bash id="clone2"
git clone https://github.com/your-username/Sahaaya_Final.git

### step 2 : Install Dependencies = npm install

### step 3 : Start the Backend Server = node server.js
Run the server using Node.js: After successful execution, you will see a message like:
Server running at http://localhost:3000

### Step 4: Open the Application
Open a browser and go to:
http://localhost:3000/
This will load the Sahaaya application.


## Additional Information for Evaluation
- The project follows a modular full-stack architecture with separate backend route files for each feature (medicines, reminders, SOS, voice assistant, and voice commands).
- The backend is built using Node.js and Express.js, and all APIs are handled through RESTful routes.
- SQLite is used as the local database, and tables are created/managed automatically when the server runs.
- The Smart Reminder System includes a scheduler that continuously runs in the background to trigger reminders at the correct time.
- The Emergency SOS module integrates geolocation and generates a WhatsApp message link for sending live location to caretakers.
- The Voice Assistant supports multilingual interaction (English, Tamil, Hindi) and includes a fallback mechanism to handle unrecognized commands gracefully. It responds intelligently instead of failing.
- The frontend and backend are fully integrated when running locally through http://localhost:3000/.
- GitHub Pages deployment is used only for frontend demonstration; full functionality requires local backend execution.
- The system is designed to simulate a real-world healthcare assistant application with practical use cases such as medicine tracking, emergency response, and patient record management.
- All sensitive files such as node_modules, .env, and database files are excluded using .gitignore for security and clean repository structure.
