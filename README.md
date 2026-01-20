# Bestomer Testomer Feedback (Mini App)

## What it is
A tiny 3-page Flask app:
1) Password gate (`eatatrays`)
2) Survey (Good Stuff / Tough Love) with multi-select tiles
3) Thank-you page

Submissions append to: `data/submissions.jsonl`

## Run locally
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

Open: [http://localhost:5001](http://localhost:5001)

## Notes

* Change secrets via env vars:

  * `APP_SECRET=...`
  * `APP_PASSWORD=eatatrays` (defaults to eatatrays)
* Logout: `/logout`
