# NextPhase Horizon design and engineering guardrails

- Status: guardrails, plus the visual language (version 1) defined below
- Date: 2026-10-13; visual language added 2026-10-17

These rules apply to every change. Implementation briefs copy the applicable ones verbatim.

## Do's and Don'ts

- **Do** make financial results reproducible from declared inputs, assumptions, calculation/model versions, and applicable jurisdiction/tax year; stochastic models also record seed and simulation parameters.
- **Do** specify money units, currency, precision, rounding, and boundary cases before shipping a calculation; prove results with synthetic reference vectors and applicable invariants.
- **Do** label assumptions, estimates, missing data, and failure states explicitly; never present incomplete or failed calculations as successful plans.
- **Do** enforce tenant, role, and household authorization on every applicable server operation, document access, and export; test cross-tenant denial.
- **Don't** commit, log, or publish secrets or real household financial data; fixtures, demos, screenshots, and public issues use synthetic data.
- **Don't** depend on or copy proprietary code, text, assets, branding, or private APIs of any other product; implement every requirement independently, with dependencies whose licenses are compatible.
- **Don't** rely on color alone for status or financial comparisons; provide text labels, accessible controls, and textual/tabular chart alternatives.
- **Do** use the semantic design tokens below and the design reference attached to a brief once they exist; keep responsive web layouts, keyboard access, and light/dark states reviewable.

## Visual language (version 1)

The look is calm and precise: cool neutral surfaces, one blue accent (the NextPhase brand blue), and a single sans-serif typeface with tabular figures. Results read before ledgers, and every status is spelled out in words.

These semantic tokens are authoritative. Interfaces use the token names, never literal values. Until a token package exists, the values below are the source. A design reference attached to a brief shows intent; when it disagrees with this file, this file wins.

### Color

Light and dark are designed separately; dark is not light inverted. Text pairs meet at least 4.5:1 and non-text elements at least 3:1 against what they sit on (WCAG 2.2, success criteria 1.4.3 and 1.4.11: https://www.w3.org/TR/WCAG22/, retrieved 2026-10-17).

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `color-canvas` | `#f4f6f9` | `#0f131a` | Page background |
| `color-surface` | `#ffffff` | `#171c25` | Cards, panels, tables |
| `color-sunken` | `#eef1f5` | `#11161e` | Input fields, inset areas |
| `color-ink` | `#1b2433` | `#e8edf4` | Primary text |
| `color-muted` | `#525d6c` | `#a3aebd` | Secondary text, labels, axis text |
| `color-line` | `#d9dfe7` | `#2b3341` | Borders, dividers, chart gridlines |
| `color-accent` | `#306ce2` | `#75a9ff` | Primary buttons, focus rings, selected states, scenario series |
| `color-accent-text` | `#1853c6` | `#75a9ff` | Links and blue text on any background |
| `color-on-accent` | `#f8fafd` | `#0a111f` | Text and icons on `color-accent` |
| `color-supported-text` / `-bg` | `#1c6a49` / `#e2f2e9` | `#74d3a4` / `#12301f` | Supported (a complete result within declared coverage) |
| `color-partial-text` / `-bg` | `#8a5600` / `#fbeed2` | `#f2c467` / `#382906` | Partial (a result with named omissions) |
| `color-unsupported-text` / `-bg` | `#a3302a` / `#fbe3e0` | `#ff958b` / `#3d1714` | Unsupported (no result is produced), and errors |
| `color-estimate-text` / `-bg` | `#5a3ea8` / `#ece6fb` | `#c6b2ff` / `#2a2144` | A figure the person estimated, and rough values |
| `color-series-baseline` | `#7b8798` | `#7f8a9c` | Baseline line or bar in charts |
| `color-series-scenario` | `#306ce2` | `#75a9ff` | Scenario line or bar in charts |

`color-accent` is never used for text on `color-canvas` or `color-sunken` in light mode (4.44:1 and 4.24:1); use `color-accent-text` there. Status colors are never used without their word and icon.

### Typography

- **Typeface:** Plus Jakarta Sans for everything, with fallbacks `ui-sans-serif, system-ui, sans-serif`. It is licensed under the SIL Open Font License 1.1 (https://github.com/tokotype/PlusJakartaSans, retrieved 2026-10-17), is self-hosted, and its license file ships with it.
- **Figures:** every amount, percentage, age and year uses `font-variant-numeric: tabular-nums lining-nums`.

| Token | Size | Line height | Weight | Use |
| --- | --- | --- | --- | --- |
| `text-xs` | 0.75rem | 1.4 | 600 | Eyebrows (uppercase, tracking 0.09em), chart axis |
| `text-sm` | 0.875rem | 1.5 | 400 / 600 | Help text, table cells, status labels |
| `text-base` | 1rem | 1.55 | 400 | Body |
| `text-lg` | 1.25rem | 1.35 | 600 | Card and section headings |
| `text-xl` | 1.625rem | 1.2 | 600 | Page headings and questions |
| `text-figure` | 1.875rem | 1.15 | 600 | Headline amounts |

### Space, shape and depth

- **Space:** `space-1` 0.25rem, `space-2` 0.5rem, `space-3` 0.75rem, `space-4` 1rem, `space-5` 1.5rem, `space-6` 2rem, `space-7` 3rem.
- **Radius:** `radius-sm` 6px for small controls, `radius-md` 8px for inputs and buttons, `radius-lg` 12px for cards, `radius-pill` 9999px for status labels.
- **Depth:** surfaces are separated by `color-line` borders, not shadows.
- **Focus:** keyboard focus is always visible: a 3px `color-accent` outline with a 2px offset.
- **Motion:** minimal and functional, and none when `prefers-reduced-motion` is set.

### Layout

- **Widths:** layouts work from 320px wide. Single column below 560px; two columns from 900px. Readable text stays under about 70 characters per line.
- **Overflow:** the page never scrolls sideways. Wide tables and charts scroll inside their own container.
- **Themes:** the theme follows `prefers-color-scheme` unless the person chooses one; an explicit choice wins.

### Financial content

- **Results come first:** plain answers lead; the year-by-year ledger is one level deeper.
- **Status labels:** every result, comparison and export shows its status in words, with an icon. The words are Supported, Partial (with the count of omissions), Unsupported, Your estimate, Rough value, and Sample household for invented data.
- **Rough values:** marked with a dashed `color-estimate-text` outline wherever they appear.
- **Amounts:**
  - right-aligned in tables;
  - whole dollars in summaries;
  - every amount that could be read either way is labeled "today's dollars" or "nominal";
  - totals that add dollars from different years are labeled "nominal, summed across years".
- **Charts:**
  - the baseline is a solid `color-series-baseline` line and a scenario a dashed `color-series-scenario` line, so the difference never relies on color;
  - every chart is labeled directly and offers the same data as a table.
- **Input completeness:** shown apart from results, and never as a probability or score.

### Principles for screens

- **Simple by default, detail on demand:** each screen opens with one plain sentence generated from the result, and a picture where one helps. Everything else sits in clearly labeled sections that open on request and work with the keyboard.
- **Factual headlines:** a headline states the result ("Savings run short at 93, two years before the plan ends"; "Savings last to 95"). It never judges the result or relies on an invented threshold.
- **Chart view for data tables:** a table whose rows share one unit also offers a chart. The chart is shown first and the table is one click away; every chart keeps its table alternative. Tables that mix units have no chart.
- **Better and worse in words:** differences are marked with an arrow and a word ("▲ Better", "▼ Worse", "▲ Higher"). Status colors are used only for status.
