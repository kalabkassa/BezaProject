# Medical Monitoring System

This project is a Django + PostgreSQL-based system that collects and analyzes patient vital signs from IoT devices. It uses WebSockets for live data, RDF-based reasoning for abnormal condition detection, and Firebase for alert notifications.

## Features
- Real-time vital sign monitoring (temperature, heart rate, etc.)
- RDF generation and SWRL reasoning
- Doctor-patient assignment
- Alert notifications for abnormal vitals
- PostgreSQL backend and Django Channels

## Reproducibility
To reproduce the system:
1. Clone the repository.
2. Install dependencies (`requirements.txt`).
3. Import database schema (`db_schema.sql`).
4. Create and populate tables using sample data in `/sample_data`.
5. Run the Django server.

See `/docs/INSTALLATION.md` for details. 