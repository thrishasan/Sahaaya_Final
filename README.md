
DEPLOYED URL:
https://thrishasan.github.io/Sahaaya_Final/

# SAHAAYA – Smart Healthcare Assistant

---

## PROJECT OVERVIEW

Sahaaya is a full-stack smart healthcare assistant application designed to help users manage medicines, reminders, emergency SOS alerts, health records, and healthcare providers in a unified system.

It supports multiple user roles and real-world healthcare workflows including automation, emergency response, and doctor verification.

The system is built using:
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js + Express.js
- Database: SQLite
- Mobile Deployment: Capacitor + Android Studio

---

## KEY FEATURES

---

### 1. ROLE-BASED LOGIN SYSTEM
- Supports multiple roles:
  - Senior Citizen (primary user)
  - Caregiver
  - Admin
  - Healthcare Provider
- Each role has access to specific features based on permissions

---

### 2. MEDICINE MANAGEMENT SYSTEM
- Add, update, delete medicines
- Track dosage and schedules
- Stored in SQLite database

---

### 3. SMART REMINDER SYSTEM
- Time-based reminders with repeat options
- Edit, disable, delete functionality
- Background scheduler runs continuously in Node.js backend
- Real-time alert triggering system

---

### 4. EMERGENCY SOS SYSTEM
- Add emergency contacts (caretakers)
- One-click SOS activation
- Sends WhatsApp message with live location
- Stores SOS history with timestamp and coordinates
- Includes fallback handling if geolocation fails

---

### 5. HEALTH RECORDS MANAGEMENT
- Store medical records such as:
  - Blood Pressure
  - Blood Sugar
  - Heart Rate
  - Temperature
  - Allergy details
- Date-wise tracking with optional notes

---

### 6. VOICE ASSISTANT SYSTEM
- Voice-based interaction for app navigation and commands
- Supports multiple languages:
  - English
  - Tamil
  - Hindi
- Intelligent fallback system:
  - If command is not understood, system responds gracefully instead of failing
  - Responds in all supported languages with messages like:
    "Sorry, I didn't understand that"
- Provides conversational responses and supports continuous interaction

---

### 7. HEALTHCARE PROVIDER SYSTEM
- Providers can register as:
  - Doctor
  - Hospital
  - Clinic
- Includes registration details:
  - Specialization
  - Experience
  - License upload
- Admin verification required before approval
- Only verified providers appear in public listings

---

### 8. ADMIN MODULE
- Admin verifies and manages healthcare providers
- Approves or rejects provider registrations
- Ensures system trust and authenticity

---

## MOBILE DEPLOYMENT (IMPORTANT HIGHLIGHT)

In addition to web deployment, the application is also converted into a mobile application using:

- Capacitor (Ionic Capacitor framework)
- Android Studio for native Android build

Steps used:
- Web assets integrated into Capacitor project
- Android platform added using Capacitor CLI
- Project opened in Android Studio
- APK generated for mobile deployment

This allows the same Sahaaya application to run as:
- Web Application (Browser)
- Mobile Application (Android)

---

## HOW TO RUN THE PROJECT LOCALLY

---

### STEP 1: DOWNLOAD PROJECT
Clone the repository:

```bash
git clone https://github.com/your-username/Sahaaya_Final.git
````

OR extract ZIP file if downloaded manually.

---

### STEP 2: INSTALL DEPENDENCIES

```bash
npm install
```

---

### STEP 3: START BACKEND SERVER

```bash
node server.js
```

After successful execution:

Server runs at:
[http://localhost:3000](http://localhost:3000)

---

### STEP 4: OPEN APPLICATION

Open browser and visit:

[http://localhost:3000](http://localhost:3000)

---


## IMPORTANT NOTES FOR EVALUATION

* The project follows a modular architecture with separate backend route files:

  * medicinesRoutes.js
  * remindersRoutes.js
  * sosRoutes.js
  * voiceRoutes.js

* Scheduler runs continuously in backend to trigger reminders automatically in real time.
* SOS system integrates geolocation and WhatsApp API link generation.
* Voice Assistant includes multilingual support and intelligent fallback response system.
* Provider system includes full admin verification workflow before public access.
* SQLite is used for persistent local database storage.
* GitHub Pages deployment is used ONLY for frontend demonstration:
  Full functionality requires local backend execution.


## IGNORED FILES (.gitignore USED)

The following are NOT pushed to GitHub:

* node_modules/
* .env
* db.sqlite
* android/
* .idea/
* Capacitor config files (where sensitive)
* build/generated files

---
 
