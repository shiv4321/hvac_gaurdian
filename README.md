# HVAC Guardian

HVAC Guardian is a mobile-first diagnostic assistant for manufacturing maintenance teams. It turns noisy HVAC sensor readings into a prioritized work queue, with enough context for a technician to know which unit needs attention, where it is, and what to check first.

The app is built with Expo and React Native. It uses the provided sensor dataset as the operating snapshot for five HVAC units and combines deterministic anomaly scoring with AI-generated triage notes.

## Download APK

[Download the Android APK](https://expo.dev/artifacts/eas/3cr455iiTiFeFQPQwPJcCX.apk)

## What It Does

- Shows all HVAC units sorted by operational risk instead of raw alert volume.
- Highlights critical and warning-level units based on recent sensor behavior.
- Explains which sensors contributed to the alert.
- Uses AI to summarize the likely issue, urgency, and recommended technician action.
- Gives technicians a focused unit detail page with current readings, trend charts, location, and downtime impact.
- Supports a simple maintenance workflow: inspect, add a note, resolve, reopen, and review alert history.
- Handles missing sensor values during analysis instead of failing on incomplete rows.
- Includes fallback diagnostic messaging when the AI service is unavailable.

## Why This Shape

The main design goal was to reduce alert fatigue. A threshold-only system can create too many isolated alarms, so this app looks for stronger evidence before interrupting the technician workflow. It builds per-unit baselines, checks recent readings against those baselines, and only escalates when multiple sensors confirm abnormal behavior.

That means a single odd reading is treated differently from a sustained multi-sensor pattern. The interface reflects the same idea: technicians see a ranked queue, not a flood of equal-looking notifications.

## Dataset

The app currently loads a bundled JSON version of the provided HVAC sensor dataset:

```text
assets/data/hvac_sensor_data.json
```

The original dataset includes:

```text
timestamp, unit_id, temp, pressure, airflow, vibration, power
```

The analysis layer infers numeric sensor columns, ignores non-sensor identity/time fields, and skips missing or non-numeric readings when calculating baselines and recent anomaly scores.

## Diagnostic Approach

The anomaly engine:

1. Groups readings by HVAC unit.
2. Infers available numeric sensor fields.
3. Builds a baseline mean and standard deviation per unit and sensor.
4. Scores the latest 20 readings against the unit's own baseline.
5. Flags sensors whose recent average behavior deviates meaningfully.
6. Requires multi-sensor confirmation before escalating to warning or critical status.
7. Tracks whether the recent pattern is rising or stable.
8. Estimates how long the current anomalous pattern has persisted.

This keeps the system focused on patterns that are more likely to matter operationally.

## AI Triage

When a unit needs attention, the app sends the anomaly summary and recent readings to an AI model. The model returns structured JSON with:

- A short reason that references sensor behavior.
- A likely cause.
- An urgency level.
- A recommended field action.

The AI call is intentionally constrained so the UI can present consistent, actionable information instead of free-form prose. If the model is unavailable or an API key is missing, the app falls back to a safe manual-inspection message.

## Technician Workflow

The app is organized around the way a floor technician would use it:

- **Dashboard**: command view of all units, sorted by severity.
- **Open Alerts**: active units that need attention.
- **Unit Detail**: sensor readings, trend chart, AI analysis, location, downtime cost, and action buttons.
- **History**: open and resolved incidents with filtering.

The goal is for the technician to answer three questions quickly:

```text
Where do I go?
Why am I going there?
What should I do first?
```

## Running The App

Install dependencies:

```bash
npm install
```

Start Expo:

```bash
npm start
```

Optional AI configuration:

```bash
EXPO_PUBLIC_GROQ_API_KEY=your_key_here
```

Without an API key, the app still runs and displays deterministic anomaly results with fallback diagnostic text.

## Tech Stack

- Expo
- React Native
- Expo Router
- TypeScript
- Zustand
- React Native SVG
- Groq-compatible OpenAI chat completions API

## Trade-Offs

This version favors a working, explainable prototype over a larger backend architecture. The dataset is bundled locally, which makes the demo reliable and easy to run, but it does not yet simulate a live streaming pipeline. The scoring logic is transparent and debuggable, but it is still a lightweight statistical method rather than a trained predictive maintenance model.

The AI layer is used for interpretation and technician guidance, not as the sole source of truth. That keeps critical alerting grounded in deterministic analysis while still making the experience feel more useful and human-readable.

## What I Would Improve Next

- Add file upload with schema validation for new datasets.
- Display friendly validation errors when required columns are missing or incompatible.
- Support a configurable schema so the same app can analyze other industrial equipment datasets.
- Simulate real-time streaming from the uploaded data.
- Persist inspection history across sessions.
- Add automated tests for anomaly scoring edge cases.
- Track alert precision over time using technician feedback.
- Use historical resolved incidents to make AI recommendations more contextual.

## Current Status

The current prototype demonstrates a complete mobile workflow from sensor data to prioritized action. It shows how a noisy alert stream can become a smaller, more explainable set of maintenance decisions that fit the technician's on-floor workflow.
