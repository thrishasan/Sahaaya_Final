
DEPLOYED FRONTEND:
https://thrishasan.github.io/Sahaaya_Final/

# SAHAAYA – Smart Healthcare Assistant

---

## PROJECT OVERVIEW

Sahaaya is a full-stack smart healthcare assistant web application designed to help users manage medicines, reminders, emergency SOS alerts, health records, and healthcare providers in one integrated system.

The system supports multiple user roles including:
- Senior Citizen (Primary user)
- Caregiver
- Admin
- Healthcare Provider

It is built using:
- Frontend: HTML, CSS, JavaScript
- Backend: Node.js + Express.js
- Database: SQLite
- Local real-time scheduler system for reminders

---

## KEY FEATURES

---

### 1. ROLE-BASED LOGIN SYSTEM
- Separate access for:
  - Senior citizens (primary users)
  - Caregivers (assist seniors)
  - Admin (system verification and control)
  - Healthcare providers (doctors/hospitals/clinics)
- Role-based navigation and feature access

---

### 2. MEDICINE MANAGEMENT SYSTEM
- Add medicines with dosage and timing
- Update and delete medicines
- Stored in SQLite database
- Integrated with reminder scheduler

---

### 3. SMART REMINDER SYSTEM
- Create reminders with time and repeat options
- Edit, disable, delete reminders
- Background scheduler triggers alerts in real-time
- Fully automated reminder execution using Node.js backend service

---

### 4. EMERGENCY SOS SYSTEM
- Add emergency contacts (caretakers)
- One-click SOS alert system
- Sends WhatsApp message with live location
- Stores SOS history with timestamp and coordinates
- Includes fallback flow if location is unavailable

---

### 5. HEALTH RECORDS MANAGEMENT
- Store personal health data:
  - Blood Pressure
  - Blood Sugar
  - Heart Rate
  - Temperature
  - Allergy records
- Date-wise tracking with optional notes

---

### 6. VOICE ASSISTANT SYSTEM
- Voice-controlled interaction with the app
- Supports multiple languages:
  - English
  - Tamil
  - Hindi
- Intelligent fallback system:
  - If command is not understood, system responds gracefully instead of failing
  - Responds in multiple languages with messages like:
    "Sorry, I didn't understand that"
- Continuous conversational assistance for navigation and actions

---

### 7. HEALTHCARE PROVIDER SYSTEM
- Providers can register as:
  - Doctor
  - Hospital
  - Clinic
- Provider registration includes:
  - Personal details
  - Specialization
  - License upload
- Admin verification required before approval
- Verified providers appear in public listing system

---

### 8. ADMIN MODULE
- Admin verifies healthcare providers
- Approves or rejects provider registrations
- Manages platform trust and safety

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

Navigate to project folder and install required packages:

```bash
npm install
```

---

### STEP 3: START BACKEND SERVER

Run the Node.js server:

```bash
node server.js
```

After successful execution, you will see:

Server running at [http://localhost:3000](http://localhost:3000)

---

### STEP 4: OPEN APPLICATION

Open browser and go to:

[http://localhost:3000](http://localhost:3000)

This will load the full application with backend integration.

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

* Sensitive files are excluded using .gitignore:
  * node_modules/
  * .env
  * db.sqlite
  * android/
  * .idea/

---


