# HabitFlow — Habit Tracker

A clean, feature-rich habit tracker built with vanilla HTML, CSS, and JavaScript. No frameworks, no dependencies, no build step.

## Features

- **Daily check-ins** — tap any habit to mark it done today
- **Streak tracking** — current and longest streaks per habit
- **Progress ring** — animated ring showing today's completion percentage
- **30-day heatmap** — visual overview of your consistency
- **Stats dashboard** — best streak, total completions, active habits, 7-day rate
- **Categories** — filter by Health, Mind, Skill, Social, Other
- **Custom emoji** — pick an emoji for each habit from the built-in picker
- **Weekly goal** — set daily / 5×/week / 3×/week / weekly targets
- **Dark + Light mode** — toggle persists across sessions
- **localStorage persistence** — all data lives in your browser

## Files

```
habit-tracker/
├── index.html   — markup + structure
├── style.css    — all styles (dark/light mode, responsive)
├── app.js       — all logic (habits, streaks, heatmap, storage)
└── README.md
```

## How to use

1. Unzip and open `index.html` in any modern browser — no server needed.
2. Click **+ Add Habit**, pick an emoji, type a name, set a category and weekly goal.
3. Each day, tap habits in the **Today** panel to check them off.
4. Watch your streaks and heatmap grow over time.

## Data

All data is stored in `localStorage` under the key `habitflow_habits`. To reset, open DevTools → Application → Local Storage → delete `habitflow_habits`.

## Tech

- Vanilla JS (ES6+)
- CSS custom properties for theming
- No external libraries
- Responsive down to 360px
