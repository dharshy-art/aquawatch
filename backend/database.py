"""
AquaWatch — Smart Water Conservation System
Database Initialization & SQLite Management
"""

import sqlite3
import os
from datetime import datetime, timedelta
import math

DB_PATH = os.path.join(os.path.dirname(__file__), "aquawatch.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    cursor = conn.cursor()

    # 1. water_usage table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS water_usage (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            location TEXT NOT NULL,
            litres_used REAL NOT NULL,
            measurement_method TEXT NOT NULL,
            data_type TEXT NOT NULL DEFAULT 'illustrative'
        )
    """)

    # 2. water_waste_reports table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS water_waste_reports (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            location TEXT NOT NULL,
            waste_type TEXT NOT NULL,
            description TEXT NOT NULL,
            reported_at TEXT NOT NULL,
            estimated_loss_litres REAL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'Reported',
            verified INTEGER NOT NULL DEFAULT 0
        )
    """)

    # 3. student_surveys table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS student_surveys (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            survey_date TEXT NOT NULL,
            total_responses INTEGER NOT NULL,
            taps_running_count INTEGER NOT NULL,
            long_showers_count INTEGER NOT NULL,
            water_reuse_count INTEGER NOT NULL,
            data_type TEXT NOT NULL DEFAULT 'illustrative'
        )
    """)

    # 4. conservation_actions table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS conservation_actions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            action_title TEXT NOT NULL,
            description TEXT NOT NULL,
            priority TEXT NOT NULL DEFAULT 'Medium',
            status TEXT NOT NULL DEFAULT 'Pending',
            created_at TEXT NOT NULL,
            completed_at TEXT
        )
    """)

    # 5. inspection_records table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS inspection_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            location TEXT NOT NULL,
            inspection_date TEXT NOT NULL,
            leaks_found INTEGER NOT NULL DEFAULT 0,
            leaks_resolved INTEGER NOT NULL DEFAULT 0,
            notes TEXT
        )
    """)

    conn.commit()

    # Check if seed data exists
    cursor.execute("SELECT COUNT(*) FROM water_usage")
    if cursor.fetchone()[0] == 0:
        seed_data(conn)

    conn.close()

def seed_data(conn):
    cursor = conn.cursor()
    today = datetime.now()

    # Seed 14 days of water usage across 5 key zones
    locations = [
        {"name": "Washrooms", "base": 650, "curr": 480},
        {"name": "Kitchen & Cafeteria", "base": 420, "curr": 360},
        {"name": "Garden & Grounds", "base": 380, "curr": 220},
        {"name": "Drinking Water Station", "base": 190, "curr": 140},
        {"name": "Laboratory & Cleaning", "base": 160, "curr": 130}
    ]

    for i in range(13, -1, -1):
        d = today - timedelta(days=i)
        date_str = d.strftime("%Y-%m-%d")
        is_baseline = i >= 7

        for loc in locations:
            base_val = loc["base"] if is_baseline else loc["curr"]
            variation = math.sin(i * 1.5 + len(loc["name"])) * 0.08
            litres = round(base_val * (1 + variation))
            cursor.execute(
                "INSERT INTO water_usage (date, location, litres_used, measurement_method, data_type) VALUES (?, ?, ?, ?, ?)",
                (date_str, loc["name"], litres, "Smart Sub-meter Sensor", "illustrative")
            )

    # Seed waste reports
    reports = [
        ("2nd Floor West Washroom", "Leaking taps", "Steady cold tap drip in basin #3 (approx 20 drops/min)", (today - timedelta(days=1)).isoformat(), 35, "In Progress", 1),
        ("Sports Ground Spigot", "Taps left running", "Hose bib partially left open after garden upkeep", (today - timedelta(days=3)).isoformat(), 120, "Resolved", 1),
        ("Science Lab Sink #2", "Leaking taps", "Unconfirmed drip reported by student monitor", (today - timedelta(days=5)).isoformat(), 15, "Reported", 0),
        ("Cafeteria Dish Pit", "Overflow and spillage", "Rinse station drain back-pressure causing wash overflow", (today - timedelta(days=7)).isoformat(), 80, "Resolved", 1)
    ]
    for r in reports:
        cursor.execute(
            "INSERT INTO water_waste_reports (location, waste_type, description, reported_at, estimated_loss_litres, status, verified) VALUES (?, ?, ?, ?, ?, ?, ?)",
            r
        )

    # Seed Section 7 illustrative student survey
    cursor.execute(
        "INSERT INTO student_surveys (survey_date, total_responses, taps_running_count, long_showers_count, water_reuse_count, data_type) VALUES (?, ?, ?, ?, ?, ?)",
        ((today - timedelta(days=4)).strftime("%Y-%m-%d"), 20, 12, 8, 6, "illustrative")
    )

    # Seed conservation actions
    actions = [
        ("Repair Basin #3 Washroom Faucet", "Replace worn rubber gasket and ceramic washer to eliminate 35L/day leak.", "High", "Pending", (today - timedelta(days=1)).isoformat(), None),
        ("Install Timed Aerators in Student Washrooms", "Fit 1.5 GPM pressure-compensating flow aerators across all 12 washroom sinks.", "High", "Completed", (today - timedelta(days=4)).isoformat(), (today - timedelta(days=2)).isoformat()),
        ("Optimize School Grounds Sprinkler Timers", "Shift irrigation schedule to early morning (05:30) to reduce evaporation loss by 40%.", "Medium", "Completed", (today - timedelta(days=3)).isoformat(), (today - timedelta(days=1)).isoformat()),
        ("Conduct Grade 7-9 Water Habit Workshop", "Address survey finding showing 60% of students leave taps running while washing hands.", "Medium", "Pending", (today - timedelta(days=2)).isoformat(), None)
    ]
    for a in actions:
        cursor.execute(
            "INSERT INTO conservation_actions (action_title, description, priority, status, created_at, completed_at) VALUES (?, ?, ?, ?, ?, ?)",
            a
        )

    # Seed inspections
    inspections = [
        ("Main Building Washrooms", (today - timedelta(days=3)).strftime("%Y-%m-%d"), 2, 1, "Audited 14 fixtures. Found 1 gasket wear and 1 flush valve float misaligned."),
        ("Garden & Grounds Irrigation", (today - timedelta(days=2)).strftime("%Y-%m-%d"), 1, 1, "Inspected drip lines and spigots. Replaced cracked connector near greenhouse."),
        ("Cafeteria & Kitchen Scullery", (today - timedelta(days=1)).strftime("%Y-%m-%d"), 1, 1, "Checked grease traps and pre-rinse spray valves. Replaced worn spray head.")
    ]
    for ins in inspections:
        cursor.execute(
            "INSERT INTO inspection_records (location, inspection_date, leaks_found, leaks_resolved, notes) VALUES (?, ?, ?, ?, ?)",
            ins
        )

    conn.commit()
