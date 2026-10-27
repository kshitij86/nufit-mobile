# API gaps for the member app

What the Nufit mobile app needs from `nufit-api` that the API doesn't serve yet,
screen by screen, with the request and response shapes the screens need. This is
the brief for the next round of API work.

Checked against `nufit-api` at `4896cbc` (27 Oct 2026).

## Already live in the app

| Screen | Endpoint |
|---|---|
| Sign up, log in, log out | `POST /auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` |
| Profile, Consent (name), TopBar initials | `GET /users/me` |
| Measure, MeasureDone, Journey (weight trend, inches table), Profile | `POST /users/me/measurements`, `GET /users/me/measurements` |
| Profile (order history) | `GET /orders` (`GET /orders/{id}` is wrapped but unused) |
| Checkout | `POST /payments/orders`, `POST /payments/verify` |

`createCustomPlanOrder(customPlanId)` exists in `src/services/payments.ts` with no
screen yet, because nothing lists a member's custom plans (see
[Custom plans](#custom-plans)).

## How to read this

- Every endpoint is for the signed-in member: under `/api/v1`, Bearer auth,
  scoped to the caller like `/users/me/measurements`, snake_case JSON.
- Shapes are what the screen renders. Field names are suggestions; the app maps
  responses in one service file per feature (`src/services/<feature>.ts`), so
  renaming costs one file.
- **Stored already** means `docs/data-model.md` says the data is in Cosmos DB and
  the admin console can read it; only a member-facing endpoint is missing.
- Errors: the app shows `detail` (or `error`) strings as they are, and maps 422
  `detail[].loc` field errors onto form fields. Please keep both conventions.

---

## Programme status

**Screens:** Today (header "Tuesday · Day 26"), Mood (eyebrow), Profile
(programme card), Journey (header).
**App today:** `useProgrammeStatus()` in `src/services/journey.ts`, hard-coded to
day 26 of 84. Every member sees the same card, including members with no
programme (e.g. Divya Menon).
**Stored already:** `users.program_assignment` (`program_id`, `start_date`,
`total_days`, `coach_id`), `users.status`, and the review schedule in `plan_builds`.

`GET /users/me/programme`

```json
{
  "status": "active",
  "programme": { "id": "reset360", "name": "Reset 360" },
  "start_date": "2026-10-02",
  "day": 26,
  "total_days": 84,
  "next_review_on": "2026-10-30",
  "coach": { "name": "Dr. Kanika" }
}
```

- `status`: one of `none` (no paid order), `awaiting_plan` (paid, no published
  plan; e.g. Vikram Arora), `scheduled` (starts later), `active`, `paused`,
  `expiring`, `completed`. The app needs it to choose between the programme card,
  "your plan is being prepared", or the "find my programme" flow.
- Return `200` with `"status": "none"` and nulls rather than `404`, so "no
  programme" isn't treated as an error.
- `day` uses the member's local calendar day. Send `start_date` as well so the
  app can recompute it after midnight without another request.

## Quiz answers and programme match

**Screens:** Quiz → Match.
**App today:** `submitQuizAnswers()` in `src/services/quiz.ts` matches a
programme on the device (`programmeFromGoals`) and sends nothing.
**Stored already:** `users.onboarding.quiz_match_program_id` and
`quiz_match_note`.

`POST /users/me/quiz`

```json
{
  "answers": {
    "goals": ["Lose weight", "Pain and posture"],
    "stage": ["No specific condition"],
    "time": ["20 minutes"],
    "blockers": ["Evening hunger", "No time"],
    "checkin": ["Early morning"]
  }
}
```

Keys are the app's question ids (`src/data/quiz.ts`), and values are the chosen
option labels. A question can have several answers.

→ `200`

```json
{ "programme_id": "posture", "note": "Pain and posture point to the posture programme." }
```

- The server should do the matching, so the clinic can change the rules without
  an app release. The app shows `programme_id` on the Match screen and uses it
  for checkout.
- Members can take the quiz before they register, so either accept this without
  auth (and attach it at registration) or allow it right after sign-up. Today the
  quiz runs after sign-up.

## Intake form

**Screens:** Intake (14 steps), Profile ("Intake answers · 14 of 14"), Move
(knee-pain banner reads `limits`).
**App today:** `submitIntake()` in `src/services/intake.ts` resolves without
sending anything. Answers live in memory and are lost on logout.
**Stored already:** `users.intake_profile` (food preference, allergies, wake,
sleep and exercise time, medication, trouble areas, health issues) and
`users.onboarding.intake_completed_on`. The app collects more than this, so
some fields need adding.

`PUT /users/me/intake` saves the whole form, partial or complete. The app saves
on "Save & exit" and on "Finish intake".

```json
{
  "age": 34,
  "height_cm": 162,
  "weight_kg": 72.4,
  "lifestyle": "Mostly seated",
  "diet": "Vegetarian",
  "allergies": "Peanuts",
  "meals": [
    { "time": "08:00", "item": "Poha and tea" },
    { "time": "13:30", "item": "Dal, rice, sabzi" }
  ],
  "medication": "Thyroxine 50 mcg",
  "family_history": { "Obesity": false, "Thyroid": true, "Diabetes": true, "High blood pressure": false, "Heart disease": false },
  "cycle": "Regular",
  "daily_movement": "20 minutes",
  "limits": ["Knees"],
  "sleep_time": "23:00",
  "wake_time": "06:30",
  "why": "Feel strong for my daughter's wedding",
  "completed": true
}
```

→ `200` with the same object plus `completed_on` (date or null) and
`answered` / `total` counts for the Profile row.

`GET /users/me/intake` returns the same object, so the form can be resumed and
the Move screen can read `limits`.

- The exact field list and option values are in `src/data/intake.ts` and
  `IntakeAnswers` in `src/types/index.ts`.
- 422 field errors are mapped onto the matching step.

## Daily check-in and adherence

**Screens:** Mood (how I feel + tags), Today (ticking off meals and the session,
water), Sleep (wind-down checklist), Journey ("Last 14 days", "6/7 days on
plan"), Streak, TopBar ("26 steady").
**App today:** `submitCheckIn()` in `src/services/checkins.ts` sends nothing.
Task ticks, water and the sleep checklist live in memory. Adherence and the
streak are hard-coded in `src/services/journey.ts`.
**Stored already:** `users.adherence[]` (`day`, `score` 0–3), `users.last_check_in`
and `users.adherence_pct`.

`PUT /users/me/check-ins/{date}` (date is `YYYY-MM-DD` in the member's time zone).
The app sends the whole day each time anything changes; it's idempotent, so
retries are safe.

```json
{
  "mood": "flat",
  "tags": ["Slept badly", "Cramps"],
  "done": ["wake-water", "breakfast", "session"],
  "water_litres": 1.75,
  "wind_down_done": ["screens", "milk"]
}
```

- `mood`: `energised`, `steady`, `flat`, `drained` or `unwell`. `done` holds the
  ids of items in that day's plan (see [Diet chart](#todays-diet-chart)).
- → `200` with the stored day plus its computed `score` (0–3).

`GET /users/me/check-ins/{date}` returns the stored day, or `200` with empty
fields if there isn't one. It restores Today after a restart.

`GET /users/me/adherence?days=14`

```json
{
  "days": [{ "date": "2026-10-14", "state": "full" }, { "date": "2026-10-15", "state": "missed" }],
  "days_on_plan_this_week": 6,
  "streak": {
    "days": 26,
    "missed_this_period": 4,
    "longest_gap_days": 1,
    "this_week": ["full", "full", "missed", "full", "full", "partial", "full"]
  }
}
```

`state` is `full`, `partial` or `missed`, oldest first. The app writes the
Streak headline itself from `days`, `missed_this_period` and `longest_gap_days`.

## Today's diet chart

**Screens:** Today (meal timeline, macros, clinic note), Kitchen (recipes
"cleared for your plan"), Recipe ("Swap into today's lunch").
**App today:** `useTodayPlan()`, `useRecipes()`, `useRecipe()` and
`requestRecipeSwap()` in `src/services/diet.ts`, all from local data.
**Stored already:** published `DIET_CHART`s with `MEAL_SLOT`s and `FOOD_ITEM`s in
`plan_builds`, foods in the food master, and `users.clinic_note`.

`GET /users/me/plan/today?mood=flat`

```json
{
  "date": "2026-10-27",
  "items": [
    {
      "id": "breakfast",
      "band": "Morning",
      "time": "08:00",
      "title": "Breakfast",
      "subtitle": "2 besan chilla, mint chutney · 1 katori curd",
      "macro": "380 kcal · 22 g protein",
      "kind": "meal"
    },
    {
      "id": "session",
      "band": "Evening",
      "time": "17:00",
      "title": "Strength & core",
      "subtitle": "6 movements · 24 min · resistance band",
      "kind": "session",
      "session_id": "strength"
    }
  ],
  "note": { "author": "Dr. Kanika", "text": "Roasted chana goes up to 30 g from today.", "updated_at": "2026-10-25T10:00:00+05:30" }
}
```

- `band`: `Morning`, `Afternoon`, `Evening` or `Night`. `kind`: `meal`,
  `session` or `routine` (water, wind-down). Item ids must stay the same all day,
  because check-ins refer to them.
- `mood` swaps the session: `flat` → mobility, `drained`/`unwell` → an easy walk
  (today's rule in `src/data/schedule.ts`). If the server should own that rule,
  drop the parameter and return the swapped plan after a check-in instead.
- Return `200` with `"items": []` and a `reason` (`awaiting_plan`,
  `not_started`) when nothing is published, so Today can explain why it's empty.

`GET /users/me/recipes?slot=Lunch`

```json
[
  {
    "id": "palak-paneer-bowl",
    "name": "Palak paneer bowl",
    "slot": "Lunch",
    "kcal": 420,
    "protein_g": 26,
    "minutes": 25,
    "image_url": null,
    "ingredients": [{ "name": "Paneer", "quantity": "80 g" }],
    "method": ["Blanch the spinach…"]
  }
]
```

Only recipes that fit the member's published chart and intake (diet, allergies).
`GET /users/me/recipes/{id}` returns one recipe in the same shape, or `404`.

`POST /users/me/recipe-swaps` with `{ "recipe_id": "...", "date": "2026-10-27", "slot": "Lunch" }`
→ `202` with `{ "id": "...", "status": "pending" }`. The app says "Swap sent for
approval" and the clinic approves it in the console.

## Workout plan and exercise videos

**Screens:** Move (today's session, "This week · 4 sessions"), Player (timed
steps), Sleep ("Start 6-minute breath").
**App today:** `useWeekSessions()` and `useSession()` in
`src/services/workouts.ts`, from local data. Player shows a countdown ring and
cues but **no video**.
**Stored already:** published `WORKOUT_PLAN`s in `plan_builds`, workout
templates, the exercise library, and exercise videos with signed playback URLs
(`docs/data-model.md` §6). Videos can only be read through
`/admin/catalog/exercises`, which returns 403 for members.

`GET /users/me/workouts/week`

```json
{
  "sessions": [
    {
      "id": "strength",
      "name": "Strength & core",
      "kind": "Movement",
      "minutes": 24,
      "kit": "Band + mat",
      "scheduled_on": "2026-10-27",
      "state": "today"
    }
  ]
}
```

`state`: `today`, `done`, `upcoming` or `missed`.

`GET /users/me/workouts/sessions/{id}`

```json
{
  "id": "strength",
  "name": "Strength & core",
  "kind": "Movement",
  "minutes": 24,
  "steps": [
    {
      "name": "Goblet squat",
      "cue": "3 × 12 — chair depth only this week. Knees track over toes.",
      "seconds": 150,
      "exercise_code": "SQ-GOB",
      "video": {
        "url": "https://…signed…",
        "thumbnail_url": "https://…signed…",
        "duration_sec": 23,
        "expires_at": "2026-10-27T13:00:00Z",
        "chapters": [{ "label": "Setup", "at_fraction": 0 }]
      }
    },
    { "name": "Rest", "cue": "Let your breath return to normal.", "seconds": 60, "video": null }
  ]
}
```

- `video` is null for rest steps and for exercises with no ready clip.
- The URLs are the same read-only SAS URLs the admin API builds, valid for an
  hour. The app refetches the session if a URL has expired when playback
  starts, so `expires_at` is needed.
- Member cue overrides (e.g. "chair depth only") come from the published plan,
  not the exercise master.

`POST /users/me/workouts/sessions/{id}/complete` with `{ "date": "2026-10-27", "completed_steps": 6 }`
→ `200`. This counts towards the check-in.

## Sleep

**Screens:** Sleep (tonight's target, last seven nights, wind-down routine).
**App today:** `useSleepPlan()` in `src/services/sleep.ts`, from local data. The
checklist ticks are part of the check-in above.
**Stored already:** `intake_profile.sleep_time` and `wake_time` (free text).

`GET /users/me/sleep`

```json
{
  "target": { "bedtime": "22:45", "wake_time": "06:15" },
  "last_7_nights": [{ "date": "2026-10-20", "score": 62 }],
  "routine": [
    { "id": "screens", "title": "Screens off", "detail": "Phone charges outside the bedroom", "time": "22:00" }
  ]
}
```

`score` is 0–100, from the wind-down checklist (or a tracker later). The app
computes the "7 h 30 m" duration itself.

## Journey: reviews and milestones

**Screens:** Journey (review card with the doctor's quote; weight and inches
are already live), Milestones, Journey photo strip.
**App today:** `useLatestReview()` and `useMilestones()` in
`src/services/journey.ts`, from local data. The photo strip is a placeholder.

`GET /users/me/reviews/latest` → `200`

```json
{ "week": 4, "quote": "Inches are moving faster than the scale…", "author": "Dr. Kanika", "reviewed_on": "2026-10-25" }
```

or `204` when there hasn't been a review yet (the card is hidden).

`GET /users/me/milestones`

```json
[{ "id": "fortnight-1", "title": "First fortnight complete", "detail": "Both reviews attended", "reached_on": "2026-10-16" }]
```

`reached_on` is null for upcoming milestones. The app greys those out.

Progress photos aren't designed yet. They'd follow the exercise-video upload
pattern (signed upload URL → complete → signed read URL) and depend on the
photo consent below.

## Consent

**Screens:** Consent, Profile ("Consent & documents · Signed").
**App today:** the signature, photo-consent choice and timestamp stay on the
device; nothing is sent to the clinic. The name comes from `GET /users/me`.

`POST /users/me/consents`

```json
{
  "version": "2026-10",
  "signature": "Priya Sharma",
  "photo_consent": "face_hidden",
  "signed_at": "2026-10-27T11:02:00+05:30"
}
```

- `photo_consent`: `none`, `face_hidden` or `face_shown`. `version` identifies
  the consent text the member saw.
- → `201` with the stored record. `GET /users/me/consents/latest` returns it, or
  `204` if the member hasn't signed. Checkout should require a consent for the
  current version.
- **Address:** the paper form had "R/O [address]". The app dropped it because
  the account has no address. If the clinic needs it, add `address` to the
  account (`/auth/register` and `/users/me`) so Consent can pre-fill it like the
  name.

## Reminders

**Screens:** Reminders ("Nudges"), Profile ("Nudges · 3 on").
**App today:** `useReminders()` and `setReminderEnabled()` in
`src/services/reminders.ts`. Settings live in memory and are lost on restart.
No notifications are sent.

`GET /users/me/reminders`

```json
[
  { "id": "meals", "enabled": true, "schedule": "15 minutes before each slot" },
  { "id": "water", "enabled": true, "schedule": "Every 2 hours, 8 am – 8 pm" },
  { "id": "movement", "enabled": true, "schedule": "At your session time" },
  { "id": "wind-down", "enabled": false, "schedule": "10:00 pm, screens off" }
]
```

`PATCH /users/me/reminders/{id}` with `{ "enabled": false }` → `200` with the
updated reminder.

If the server sends the nudges (push or WhatsApp, like `notify_whats_app` on
plan releases), it also needs the device's push token:
`PUT /users/me/devices/{installation_id}` with
`{ "platform": "ios", "push_token": "ExponentPushToken[…]", "time_zone": "Asia/Kolkata" }`.

## Circle

**Screens:** Circle (group challenge, member avatars, message board), Today
("August circle" card), Profile ("Your circle · 8 members").
**App today:** `useCircle()` and `postCircleMessage()` in
`src/services/circle.ts`. Posts stay on the device and are lost on restart.
**Stored already:** nothing.

`GET /users/me/circle`

```json
{
  "id": "aug-2026-reset360",
  "name": "August circle",
  "members": [{ "initials": "MR", "tint": "orange" }],
  "challenge": { "title": "20 movement days, together", "logged_days": 142, "target_days": 200 },
  "my_contribution_days": 18,
  "messages": [
    { "id": "m1", "author": { "name": "Meera R.", "initials": "MR", "is_me": false }, "text": "Logged day 18…", "posted_at": "2026-10-26T19:12:00+05:30" }
  ],
  "next_cursor": null
}
```

`POST /users/me/circle/messages` with `{ "text": "..." }` → `201` with the
message. This is user-generated content, so it needs moderation and reporting
before launch.

## Custom plans

**Screens:** none yet. Checkout would offer a custom plan the clinic built.
**App today:** `createCustomPlanOrder(customPlanId)` in
`src/services/payments.ts`, unused.
**Stored already:** custom plans (3 seeded), readable only through
`/admin/custom-plans`.

`GET /users/me/custom-plans`

```json
[{ "id": "cp1", "name": "Reset 360 + physio add-on", "price": 31000, "valid_until": "2026-11-15", "status": "offered" }]
```

The app uses `id` with `POST /payments/orders {customPlanId}`. The server prices
it, as it does for programmes.

## Smaller gaps and mismatches

- **Programme catalogue.** `GET /plans` returns `id`, `name`, `price`,
  `description`, `is_active`, `discount_pct`, `created_at` and `updated_at`. The
  Plans and Match screens still use the app's richer local programme data
  (`src/data/programmes.ts`) and its prices. Checkout always uses the server's
  amount, so the displayed price can go stale. Adding `weeks`, `category` and
  `includes[]` to `/plans` would let the app read prices from the server.
- **Order fields.** `plan_snapshot` also has `discount_pct`, and orders include
  `status_history`, `receipt`, `razorpay_*` and `failure_reason`. The app uses
  only the fields listed in the brief.
- **Forgot password.** `POST /auth/forgot-password` and `/auth/reset-password`
  exist but the app has no screen for them yet. That's app work, not an API gap.
- **Units.** `docs/data-model.md` says the admin API returns waist in cm, while
  `/users/me/measurements` returns inches. The member app assumes inches for all
  six sites. Worth confirming the two never meet.
