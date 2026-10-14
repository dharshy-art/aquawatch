"""
AquaWatch — Smart Water Conservation System
Flask REST API Server
"""

import os
from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS
from database import get_db_connection, init_db
from models import WaterUsageModel, WaterWasteReportModel, StudentSurveyModel

app = Flask(__name__)
CORS(app)

# Ensure database is initialized
init_db()

# ------------------------------------------------------------------
# 1. GET /api/dashboard
# ------------------------------------------------------------------
@app.route("/api/dashboard", methods=["GET"])
def get_dashboard():
    conn = get_db_connection()
    cursor = conn.cursor()

    # Retrieve distinct dates
    cursor.execute("SELECT DISTINCT date FROM water_usage ORDER BY date DESC LIMIT 14")
    dates = [row["date"] for row in cursor.fetchall()]

    today_consumption = 0
    prev_consumption = 0
    consumption_trend = None
    baseline_daily_avg = 0
    current_daily_avg = 0
    water_saved = 0
    water_saved_pct = None

    if dates:
        latest_date = dates[0]
        cursor.execute("SELECT SUM(litres_used) as total FROM water_usage WHERE date = ?", (latest_date,))
        row = cursor.fetchone()
        today_consumption = row["total"] or 0

        if len(dates) > 1:
            cursor.execute("SELECT SUM(litres_used) as total FROM water_usage WHERE date = ?", (dates[1],))
            prev_row = cursor.fetchone()
            prev_consumption = prev_row["total"] or 0
            if prev_consumption > 0:
                consumption_trend = round(((today_consumption - prev_consumption) / prev_consumption) * 100, 1)

        if len(dates) >= 7:
            recent_dates = dates[:7]
            placeholders = ",".join("?" for _ in recent_dates)
            cursor.execute(f"SELECT SUM(litres_used) as total FROM water_usage WHERE date IN ({placeholders})", recent_dates)
            recent_sum = cursor.fetchone()["total"] or 0
            current_daily_avg = round(recent_sum / len(recent_dates))

            baseline_dates = dates[7:]
            if baseline_dates:
                b_placeholders = ",".join("?" for _ in baseline_dates)
                cursor.execute(f"SELECT SUM(litres_used) as total FROM water_usage WHERE date IN ({b_placeholders})", baseline_dates)
                base_sum = cursor.fetchone()["total"] or 0
                baseline_daily_avg = round(base_sum / len(baseline_dates))

                if baseline_daily_avg > 0:
                    water_saved = max(0, baseline_daily_avg - current_daily_avg)
                    water_saved_pct = round(((baseline_daily_avg - current_daily_avg) / baseline_daily_avg) * 100, 1)

    # Leaks detection stats
    cursor.execute("""
        SELECT 
            COUNT(*) as total_reported,
            SUM(CASE WHEN verified = 1 THEN 1 ELSE 0 END) as total_verified,
            SUM(CASE WHEN status != 'Resolved' THEN 1 ELSE 0 END) as active_leaks,
            SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved_leaks
        FROM water_waste_reports
        WHERE waste_type = 'Leaking taps' OR waste_type LIKE '%leak%'
    """)
    leak_row = cursor.fetchone()
    active_leaks = leak_row["active_leaks"] or 0
    total_verified = leak_row["total_verified"] or 0
    resolved_leaks = leak_row["resolved_leaks"] or 0
    total_reported = leak_row["total_reported"] or 0

    # Conservation score
    score_data = compute_conservation_score(conn)

    conn.close()

    return jsonify({
        "success": True,
        "kpis": {
            "totalConsumption": {
                "value": today_consumption,
                "unit": "Litres/day",
                "previousValue": prev_consumption or None,
                "trendPercent": consumption_trend,
                "tooltip": "Total daily water consumed across all recorded school and facility sub-meters today."
            },
            "waterSaved": {
                "value": water_saved,
                "unit": "Litres saved/day",
                "percentageReduction": water_saved_pct,
                "baselineDailyAvg": baseline_daily_avg,
                "currentDailyAvg": current_daily_avg,
                "tooltip": "Daily water conserved compared against the pre-intervention baseline period average."
            },
            "leaksDetected": {
                "activeCount": active_leaks,
                "verifiedCount": total_verified,
                "resolvedCount": resolved_leaks,
                "totalReported": total_reported,
                "unit": "Active leaks",
                "tooltip": "Total tap leaks currently in progress or awaiting inspection versus resolved incidents."
            },
            "conservationScore": {
                "score": score_data["score"],
                "status": score_data["status"],
                "grade": score_data["grade"],
                "indicators": score_data["indicators"],
                "unit": "/ 100",
                "tooltip": "Documented weighted conservation index based on water reduction, leak resolution, and inspection frequency."
            }
        },
        "latestDate": dates[0] if dates else None
    })

def compute_conservation_score(conn):
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT date FROM water_usage ORDER BY date DESC LIMIT 14")
    dates = [row["date"] for row in cursor.fetchall()]

    consumption_score = 0
    consumption_data_available = False
    reduction_pct = 0

    if len(dates) >= 8:
        recent = dates[:7]
        base = dates[7:]
        r_ph = ",".join("?" for _ in recent)
        b_ph = ",".join("?" for _ in base)
        cursor.execute(f"SELECT SUM(litres_used) as total FROM water_usage WHERE date IN ({r_ph})", recent)
        r_avg = (cursor.fetchone()["total"] or 0) / len(recent)
        cursor.execute(f"SELECT SUM(litres_used) as total FROM water_usage WHERE date IN ({b_ph})", base)
        b_avg = (cursor.fetchone()["total"] or 0) / len(base)

        if b_avg > 0:
            consumption_data_available = True
            reduction_pct = max(0, ((b_avg - r_avg) / b_avg) * 100)
            consumption_score = min(35, round((reduction_pct / 20) * 35))

    cursor.execute("SELECT COUNT(*) as total, SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved FROM water_waste_reports")
    l_row = cursor.fetchone()
    total_leaks = l_row["total"] or 0
    resolved_count = l_row["resolved"] or 0
    leak_data_available = True
    leak_rate = 100 if total_leaks == 0 else round((resolved_count / total_leaks) * 100)
    leak_score = round((leak_rate / 100) * 25)

    cursor.execute("SELECT COUNT(*) as count FROM inspection_records")
    ins_count = cursor.fetchone()["count"] or 0
    inspection_score = min(20, round((ins_count / 3) * 20))

    cursor.execute("SELECT SUM(total_responses) as sum FROM student_surveys")
    survey_total = cursor.fetchone()["sum"] or 0
    survey_score = min(20, round((survey_total / 20) * 20))

    valid_count = sum([consumption_data_available, leak_data_available, ins_count > 0, survey_total > 0])
    if valid_count < 2:
        return {
            "score": None,
            "status": "Insufficient data",
            "grade": "N/A",
            "indicators": [
                {"name": "Water Reduction vs Baseline", "weight": 35, "achieved": 0, "status": "Missing Baseline"},
                {"name": "Leak Resolution Rate", "weight": 25, "achieved": 0, "status": "Available"},
                {"name": "Inspection Records Compliance", "weight": 20, "achieved": 0, "status": "Pending"},
                {"name": "Student Habit Survey Participation", "weight": 20, "achieved": 0, "status": "Missing Surveys"}
            ]
        }

    total_score = consumption_score + leak_score + inspection_score + survey_score
    grade = "Water Hero (Excellent)" if total_score >= 85 else ("Conserving (Good)" if total_score >= 70 else "Needs Attention")

    return {
        "score": total_score,
        "status": "Measured",
        "grade": grade,
        "indicators": [
            {"name": "Consumption Reduction vs Baseline", "weight": 35, "achieved": consumption_score, "details": f"{reduction_pct:.1f}% measured reduction" if consumption_data_available else "Pending baseline log"},
            {"name": "Leak Incident Resolution", "weight": 25, "achieved": leak_score, "details": f"{leak_rate}% resolved ({resolved_count}/{total_leaks})"},
            {"name": "Facility Inspection Schedule", "weight": 20, "achieved": inspection_score, "details": f"{ins_count} completed zones inspected"},
            {"name": "Student Survey Participation", "weight": 20, "achieved": survey_score, "details": f"{survey_total} student responses recorded"}
        ]
    }

# ------------------------------------------------------------------
# 2. Water Usage APIs
# ------------------------------------------------------------------
@app.route("/api/water-usage", methods=["GET"])
def get_water_usage():
    days = int(request.args.get("days", 14))
    location = request.args.get("location", "all")
    data_type = request.args.get("data_type", "all")

    conn = get_db_connection()
    cursor = conn.cursor()

    sql = "WHERE 1=1"
    params = []
    if location != "all":
        sql += " AND location = ?"
        params.append(location)
    if data_type != "all":
        sql += " AND data_type = ?"
        params.append(data_type)

    cursor.execute(f"SELECT date, SUM(litres_used) as total_litres FROM water_usage {sql} GROUP BY date ORDER BY date ASC", params)
    daily_rows = [dict(r) for r in cursor.fetchall()]
    sliced_daily = daily_rows[-days:]

    cursor.execute(f"SELECT location, SUM(litres_used) as total_litres, COUNT(*) as measurements_count FROM water_usage {sql} GROUP BY location ORDER BY total_litres DESC", params)
    by_location = [dict(r) for r in cursor.fetchall()]

    cursor.execute("SELECT DISTINCT location FROM water_usage ORDER BY location ASC")
    all_locations = [r["location"] for r in cursor.fetchall()]

    cursor.execute(f"SELECT id, date, location, litres_used, measurement_method, data_type FROM water_usage {sql} ORDER BY date DESC, id DESC LIMIT 100", params)
    records = [dict(r) for r in cursor.fetchall()]

    # Before-and-after comparison
    cursor.execute("SELECT DISTINCT date FROM water_usage ORDER BY date ASC")
    all_dates = [r["date"] for r in cursor.fetchall()]
    comparison = {
        "hasComparison": False,
        "baselinePeriod": "First 7 Days",
        "currentPeriod": "Latest 7 Days",
        "baselineAvg": 0,
        "currentAvg": 0,
        "litresSaved": 0,
        "percentageReduction": 0,
        "status": "Awaiting measurements"
    }

    if len(all_dates) >= 8:
        mid = len(all_dates) // 2
        base_dates = all_dates[:mid]
        curr_dates = all_dates[mid:]

        b_ph = ",".join("?" for _ in base_dates)
        c_ph = ",".join("?" for _ in curr_dates)

        cursor.execute(f"SELECT SUM(litres_used) as total FROM water_usage WHERE date IN ({b_ph})", base_dates)
        b_sum = cursor.fetchone()["total"] or 0
        cursor.execute(f"SELECT SUM(litres_used) as total FROM water_usage WHERE date IN ({c_ph})", curr_dates)
        c_sum = cursor.fetchone()["total"] or 0

        b_avg = round(b_sum / len(base_dates))
        c_avg = round(c_sum / len(curr_dates))

        if b_avg > 0:
            saved = max(0, b_avg - c_avg)
            red = round(((b_avg - c_avg) / b_avg) * 100, 1)
            comparison = {
                "hasComparison": True,
                "baselinePeriod": f"{base_dates[0]} to {base_dates[-1]}",
                "currentPeriod": f"{curr_dates[0]} to {curr_dates[-1]}",
                "baselineAvg": b_avg,
                "currentAvg": c_avg,
                "litresSaved": saved,
                "percentageReduction": red,
                "status": f"{red}% saved" if red >= 0 else "Increase detected"
            }

    conn.close()
    return jsonify({
        "success": True,
        "dailyTrend": sliced_daily,
        "byLocation": by_location,
        "availableLocations": all_locations,
        "comparison": comparison,
        "records": records
    })

@app.route("/api/water-usage", methods=["POST"])
def add_water_usage():
    data = request.get_json() or {}
    error = WaterUsageModel.validate(data)
    if error:
        return jsonify({"success": False, "error": error}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO water_usage (date, location, litres_used, measurement_method, data_type)
        VALUES (?, ?, ?, ?, ?)
    """, (
        data["date"],
        data["location"].strip(),
        float(data["litres_used"]),
        data.get("measurement_method", "Manual Meter Reading"),
        data.get("data_type", "actual")
    ))
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "Measurement recorded successfully."}), 201

# ------------------------------------------------------------------
# 3. Water Waste Reports APIs
# ------------------------------------------------------------------
@app.route("/api/waste-reports", methods=["GET"])
def get_waste_reports():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM water_waste_reports ORDER BY id DESC")
    reports = [dict(r) for r in cursor.fetchall()]

    counts = {
        "Leaking taps": 0,
        "Taps left running": 0,
        "Excessive garden watering": 0,
        "Overflow and spillage": 0
    }
    total_loss = 0
    for r in reports:
        w_type = r["waste_type"]
        counts[w_type] = counts.get(w_type, 0) + 1
        total_loss += r["estimated_loss_litres"] or 0

    conn.close()
    return jsonify({
        "success": True,
        "reports": reports,
        "categoryCounts": counts,
        "totalLossLitres": round(total_loss)
    })

@app.route("/api/waste-reports", methods=["POST"])
def add_waste_report():
    data = request.get_json() or {}
    error = WaterWasteReportModel.validate(data)
    if error:
        return jsonify({"success": False, "error": error}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO water_waste_reports (location, waste_type, description, reported_at, estimated_loss_litres, status, verified)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (
        data["location"].strip(),
        data["waste_type"],
        data["description"].strip(),
        data.get("reported_at", datetime.now().isoformat()),
        float(data.get("estimated_loss_litres") or 0),
        data.get("status", "Reported"),
        1 if data.get("verified") else 0
    ))
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "Water waste incident logged."}), 201

@app.route("/api/waste-reports/<int:id>", methods=["PATCH"])
def update_waste_report(id):
    data = request.get_json() or {}
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM water_waste_reports WHERE id = ?", (id,))
    report = cursor.fetchone()
    if not report:
        conn.close()
        return jsonify({"success": False, "error": "Report not found"}), 404

    new_status = data.get("status", report["status"])
    new_verified = (1 if data.get("verified") else 0) if "verified" in data else report["verified"]

    cursor.execute("UPDATE water_waste_reports SET status = ?, verified = ? WHERE id = ?", (new_status, new_verified, id))
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "Report status updated."})

# ------------------------------------------------------------------
# 4. Student Surveys APIs
# ------------------------------------------------------------------
@app.route("/api/surveys", methods=["GET"])
def get_surveys():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM student_surveys ORDER BY id DESC")
    surveys = [dict(r) for r in cursor.fetchall()]

    actual = [s for s in surveys if s["data_type"] == "actual"]
    illustrative = [s for s in surveys if s["data_type"] == "illustrative"]

    def aggregate(items):
        if not items:
            return None
        tot = sum(i["total_responses"] for i in items)
        taps = sum(i["taps_running_count"] for i in items)
        showers = sum(i["long_showers_count"] for i in items)
        reuse = sum(i["water_reuse_count"] for i in items)
        return {
            "totalRespondents": tot,
            "habits": [
                {
                    "key": "taps_running",
                    "label": "Leave taps running while washing hands or brushing",
                    "count": taps,
                    "total": tot,
                    "percentage": round((taps / tot) * 100, 1) if tot > 0 else 0,
                    "impact": "Wastes approx 6-12 litres per instance",
                    "severity": "high"
                },
                {
                    "key": "long_showers",
                    "label": "Take showers exceeding 10 minutes",
                    "count": showers,
                    "total": tot,
                    "percentage": round((showers / tot) * 100, 1) if tot > 0 else 0,
                    "impact": "Consumes 15-20 litres per additional minute",
                    "severity": "medium"
                },
                {
                    "key": "water_reuse",
                    "label": "Actively reuse rinse water for plants/cleaning",
                    "count": reuse,
                    "total": tot,
                    "percentage": round((reuse / tot) * 100, 1) if tot > 0 else 0,
                    "impact": "Conserves 20-40 litres daily per household",
                    "severity": "positive"
                }
            ]
        }

    conn.close()
    return jsonify({
        "success": True,
        "surveys": surveys,
        "actualSummary": aggregate(actual),
        "illustrativeSummary": aggregate(illustrative),
        "hasActualData": len(actual) > 0
    })

@app.route("/api/surveys", methods=["POST"])
def add_survey():
    data = request.get_json() or {}
    error = StudentSurveyModel.validate(data)
    if error:
        return jsonify({"success": False, "error": error}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO student_surveys (survey_date, total_responses, taps_running_count, long_showers_count, water_reuse_count, data_type)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        data.get("survey_date", datetime.now().strftime("%Y-%m-%d")),
        int(data["total_responses"]),
        int(data["taps_running_count"]),
        int(data["long_showers_count"]),
        int(data["water_reuse_count"]),
        data.get("data_type", "actual")
    ))
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "Survey recorded successfully."}), 201

# ------------------------------------------------------------------
# 5. Recommendations & Actions APIs
# ------------------------------------------------------------------
@app.route("/api/recommendations", methods=["GET"])
def get_recommendations():
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM conservation_actions ORDER BY status ASC, priority DESC")
    actions = [dict(r) for r in cursor.fetchall()]

    # Check for dynamic triggers
    cursor.execute("SELECT COUNT(*) as count FROM water_waste_reports WHERE (waste_type LIKE '%leak%' OR waste_type = 'Leaking taps') AND status != 'Resolved'")
    active_leaks = cursor.fetchone()["count"] or 0

    cursor.execute("SELECT SUM(litres_used) as total FROM water_usage WHERE location LIKE '%washroom%'")
    washroom_use = cursor.fetchone()["total"] or 0

    cursor.execute("SELECT COUNT(*) as count FROM water_waste_reports WHERE waste_type = 'Excessive garden watering'")
    garden_reports = cursor.fetchone()["count"] or 0

    cursor.execute("SELECT COUNT(*) as count FROM water_waste_reports WHERE waste_type = 'Overflow and spillage' AND status != 'Resolved'")
    overflow_reports = cursor.fetchone()["count"] or 0

    cursor.execute("SELECT COUNT(*) as count FROM water_usage")
    usage_count = cursor.fetchone()["count"] or 0

    dynamic_insights = []
    if active_leaks > 0:
        dynamic_insights.append({
            "issue": f"{active_leaks} active leaking tap{'s' if active_leaks > 1 else ''} detected",
            "recommendation": "Prioritize plumbing inspection and replace damaged washers immediately to stop ongoing water loss.",
            "priority": "High",
            "trigger": "active_leaks"
        })
    if washroom_use > 1500:
        dynamic_insights.append({
            "issue": "Washrooms represent over 40% of total facility water usage",
            "recommendation": "Inspect auto-shutoff sensors, check for concealed flush valve leakage, and mount reminder signage.",
            "priority": "High",
            "trigger": "high_washroom_consumption"
        })
    if garden_reports > 0:
        dynamic_insights.append({
            "issue": "Reports of excessive garden watering or midday irrigation",
            "recommendation": "Review watering schedules, switch to drip irrigation, and restrict watering to before 08:00 AM.",
            "priority": "Medium",
            "trigger": "garden_watering"
        })
    if overflow_reports > 0:
        dynamic_insights.append({
            "issue": f"{overflow_reports} unresolved overflow or basin spillage incident{'s' if overflow_reports > 1 else ''}",
            "recommendation": "Improve drinking-water station drainage and install splash guards to prevent slippage and wastage.",
            "priority": "Medium",
            "trigger": "spillage_reports"
        })
    if usage_count < 7:
        dynamic_insights.append({
            "issue": "Less than 7 days of consecutive water measurements recorded",
            "recommendation": "Collect daily water sub-meter readings for a full week to establish a reliable baseline before judging savings.",
            "priority": "High",
            "trigger": "insufficient_baseline"
        })

    conn.close()
    return jsonify({
        "success": True,
        "actions": actions,
        "dynamicInsights": dynamic_insights
    })

@app.route("/api/recommendations/<int:id>", methods=["PATCH"])
def update_action(id):
    data = request.get_json() or {}
    conn = get_db_connection()
    cursor = conn.cursor()

    status = data.get("status", "Pending")
    completed_at = datetime.now().isoformat() if status == "Completed" else None

    cursor.execute("UPDATE conservation_actions SET status = ?, completed_at = ? WHERE id = ?", (status, completed_at, id))
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "Action updated."})

@app.route("/api/recommendations", methods=["POST"])
def add_action():
    data = request.get_json() or {}
    if not data.get("action_title") or not data.get("description"):
        return jsonify({"success": False, "error": "Title and description required."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO conservation_actions (action_title, description, priority, status, created_at)
        VALUES (?, ?, ?, ?, ?)
    """, (
        data["action_title"].strip(),
        data["description"].strip(),
        data.get("priority", "Medium"),
        data.get("status", "Pending"),
        datetime.now().isoformat()
    ))
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "Conservation action added."}), 201

# ------------------------------------------------------------------
# 6. Inspections APIs
# ------------------------------------------------------------------
@app.route("/api/inspections", methods=["GET"])
def get_inspections():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM inspection_records ORDER BY inspection_date DESC, id DESC")
    inspections = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return jsonify({"success": True, "inspections": inspections})

@app.route("/api/inspections", methods=["POST"])
def add_inspection():
    data = request.get_json() or {}
    if not data.get("location"):
        return jsonify({"success": False, "error": "Location required."}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO inspection_records (location, inspection_date, leaks_found, leaks_resolved, notes)
        VALUES (?, ?, ?, ?, ?)
    """, (
        data["location"].strip(),
        data.get("inspection_date", datetime.now().strftime("%Y-%m-%d")),
        int(data.get("leaks_found", 0)),
        int(data.get("leaks_resolved", 0)),
        data.get("notes", "").strip()
    ))
    conn.commit()
    conn.close()

    return jsonify({"success": True, "message": "Inspection record saved."}), 201

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print(f"Starting AquaWatch Flask API on port {port}...")
    app.run(host="0.0.0.0", port=port, debug=True)
