from flask import Flask, render_template, request, redirect, url_for, session, jsonify
from datetime import datetime, timezone
import os
import json
import random

APP_SECRET = os.environ.get("APP_SECRET", "dev-secret-change-me")
PASSWORD = os.environ.get("APP_PASSWORD", "eatatrays")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
SUBMISSIONS_PATH = os.path.join(DATA_DIR, "submissions.jsonl")
EMAILS_PATH = os.path.join(DATA_DIR, "emails.jsonl")

app = Flask(__name__)
app.secret_key = APP_SECRET


def ensure_data_dir():
    os.makedirs(DATA_DIR, exist_ok=True)


def is_authed() -> bool:
    return session.get("authed") is True


@app.get("/")
def login_get():
    # If already authed, go straight to survey.
    if is_authed():
        return redirect(url_for("survey_get"))

    # Get random bestoids
    bestoids_dir = os.path.join(BASE_DIR, "static", "bestoids")
    bestoids = []
    if os.path.exists(bestoids_dir):
        all_bestoids = [f for f in os.listdir(bestoids_dir) if f.endswith('.png')]
        bestoids = random.sample(all_bestoids, min(3, len(all_bestoids)))

    return render_template("login.html", error=None, bestoids=bestoids)


@app.post("/")
def login_post():
    pw = (request.form.get("password") or "").strip()
    if pw == PASSWORD:
        session["authed"] = True
        return redirect(url_for("survey_get"))

    # Get random bestoids for error page
    bestoids_dir = os.path.join(BASE_DIR, "static", "bestoids")
    bestoids = []
    if os.path.exists(bestoids_dir):
        all_bestoids = [f for f in os.listdir(bestoids_dir) if f.endswith('.png')]
        bestoids = random.sample(all_bestoids, min(3, len(all_bestoids)))

    return render_template("login.html", error="Nope. Try again.", bestoids=bestoids)


@app.get("/survey")
def survey_get():
    if not is_authed():
        return redirect(url_for("login_get"))
    return render_template("survey.html")


@app.post("/submit")
def submit_post():
    if not is_authed():
        return jsonify({"ok": False, "error": "unauthorized"}), 401

    payload = request.get_json(silent=True) or {}
    mode = payload.get("mode")
    selections = payload.get("selections") or []
    notes = (payload.get("notes") or "").strip()

    if mode not in ("good", "tough"):
        return jsonify({"ok": False, "error": "bad mode"}), 400

    if not isinstance(selections, list) or len(selections) == 0:
        return jsonify({"ok": False, "error": "no selections"}), 400

    record = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "mode": mode,
        "selections": selections,
        "notes": notes,
        "user_agent": request.headers.get("User-Agent"),
        "ip": request.headers.get("X-Forwarded-For", request.remote_addr),
    }

    ensure_data_dir()
    with open(SUBMISSIONS_PATH, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")

    return jsonify({"ok": True, "redirect": url_for("thanks_get")})


@app.get("/thanks")
def thanks_get():
    if not is_authed():
        return redirect(url_for("login_get"))
    return render_template("thanks.html")


@app.post("/submit-email")
def submit_email():
    payload = request.get_json(silent=True) or {}
    email = (payload.get("email") or "").strip()

    if not email:
        return jsonify({"ok": False, "error": "no email"}), 400

    record = {
        "ts": datetime.now(timezone.utc).isoformat(),
        "email": email,
        "user_agent": request.headers.get("User-Agent"),
        "ip": request.headers.get("X-Forwarded-For", request.remote_addr),
    }

    ensure_data_dir()
    with open(EMAILS_PATH, "a", encoding="utf-8") as f:
        f.write(json.dumps(record, ensure_ascii=False) + "\n")

    return jsonify({"ok": True})


@app.get("/logout")
def logout_get():
    session.clear()
    return redirect(url_for("login_get"))


@app.get("/results-portal")
def results_portal():
    submissions = []
    if os.path.exists(SUBMISSIONS_PATH):
        with open(SUBMISSIONS_PATH, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        submissions.append(json.loads(line))
                    except json.JSONDecodeError:
                        pass

    # Reverse to show newest first
    submissions.reverse()

    # Calculate statistics for charts
    all_votes = {}
    good_votes = {}
    tough_votes = {}

    for submission in submissions:
        mode = submission.get("mode")
        selections = submission.get("selections", [])

        for selection in selections:
            # Count overall
            all_votes[selection] = all_votes.get(selection, 0) + 1

            # Count by mode
            if mode == "good":
                good_votes[selection] = good_votes.get(selection, 0) + 1
            elif mode == "tough":
                tough_votes[selection] = tough_votes.get(selection, 0) + 1

    # Sort and get top items
    top_all = sorted(all_votes.items(), key=lambda x: x[1], reverse=True)
    top_good = sorted(good_votes.items(), key=lambda x: x[1], reverse=True)
    top_tough = sorted(tough_votes.items(), key=lambda x: x[1], reverse=True)

    # Load emails
    emails = []
    if os.path.exists(EMAILS_PATH):
        with open(EMAILS_PATH, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    try:
                        emails.append(json.loads(line))
                    except json.JSONDecodeError:
                        pass

    # Reverse to show newest first
    emails.reverse()

    return render_template(
        "results.html",
        submissions=submissions,
        total=len(submissions),
        top_all=top_all,
        top_good=top_good,
        top_tough=top_tough,
        emails=emails
    )


if __name__ == "__main__":
    ensure_data_dir()
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", "5001")), debug=True)
