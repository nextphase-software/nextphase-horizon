# 0018 — Answers kept on the device (the intake keeps a person's own answers, their chosen question style and their place in the browser's local storage under one key, so a reload or a later visit resumes; nothing else is stored, nothing is sent, and "Forget my answers" removes it at once)

- Status: Accepted
- Date: 2026-10-20
- Related:
  - [0011](0011-web-shell-stack.md), item 8 — "State stays in memory … Nothing entered is written to storage, cookies or a server." This record amends that item for the intake's answers only.
  - [0017](0017-incomplete-answers-and-ranges.md) and [0019](0019-reverse-answers-and-what-if.md) — the answers document that is kept, and the engine operation that reads it.
  - [0016](0016-plain-status-words.md) — the plain words the notices use.

## Context

The intake lets a person answer about their own situation rather than edit a sample household, and asks up to 16 questions, with ranges, "not sure" marks, answers left for later and three question styles. Losing everything on an accidental reload, or having to start again on a later visit, would undo that work. The answers must still never leave the device.

What holds today, verified at `0b6fa20` on 2026-10-20:

- **Nothing is stored.** This is set by decision 0011 item 8, and stated in `docs/architecture/web-shell.md`: "There is no analytics, storage API, cookie write or external request in the app". The end-to-end suite traps storage and cookie writes and inspects stored state.
- **The footer says so:** "Sample data only; nothing you enter is stored."
- **The Content Security Policy** allows scripts only from the site itself (`script-src 'self' 'wasm-unsafe-eval'`), with no third-party script and no outside request (`connect-src 'self'`).
- **The answers document is small.** The largest of the 29 reference answer documents of brief 0002-W4 is 856 bytes as compact JSON, and browsers give each site several megabytes of local storage.

## Decision

1. **Keep one item in local storage, under the key `horizon.intake.v1`.**
   - **Its value** is a JSON object with exactly these fields: `format` (`"horizon-saved-intake"`), `version` (`1`), `answers` (an answers document), `style` (`"one_question"`, `"conversation"` or `"guided_page"`) and `place` (the identifier of the current question or page).
   - **Nothing else is stored:** no result, no generated household input, no plan copy, no export, no time stamp, and no identifier of the person or device.
2. **Only the person's own figures are kept.** "Try an example household" is not saved, and starting an example does not overwrite saved own answers.
3. **Say it where it happens.** The welcome screen and the review page carry one plain line: "Your answers are saved on this device only. They are never sent anywhere." A **Forget my answers** control sits next to it and in the page footer.
4. **Forget removes it at once.** "Forget my answers" asks once ("Forget your answers on this device? This can't be undone."). It then deletes the key and returns to the welcome screen, and nothing remains in storage.
5. **A saved item is untrusted on the way back.** On load:
   - **What must hold:** the item must match the format above exactly, and its `answers` must be accepted by `plan_from_answers` as a document, giving any status other than a malformed-input error.
   - **Otherwise:** the item is deleted, and the welcome screen says once: "We couldn't read the answers saved on this device, so we've started again."
   - **Another `version`:** treated the same way, never migrated silently.
6. **Storage that is unavailable never blocks.** Local storage may be missing, full, or refuse a write, as in some private windows. The intake then works in memory, and the review page says: "Your answers can't be kept on this device, so they will be gone when you close this page."
7. **Save as the person goes.** The item is written after each answer is confirmed, after a style change, and after Back or Change. A reload then resumes at the same place in the same style.
8. **Everything else in 0011 item 8 stands.**
   - **No other storage or traffic:** no cookies, no session storage, no IndexedDB, and no request carries answers.
   - **Unchanged:** the Content Security Policy.
   - **Footer:** "Sample data only; nothing you enter is stored" becomes "Your answers stay on this device."
9. **Tests change with it.** The end-to-end storage check asserts that:
   - the only stored item is `horizon.intake.v1`;
   - it equals the answers entered;
   - example households store nothing;
   - Forget leaves storage empty;
   - a corrupt or older item is deleted, with the notice;
   - there are no cookies and no outside requests, as before.

## Alternatives considered

- **Memory only (0011 item 8 unchanged).** Declined: a reload loses a long intake.
- **Session storage.** It survives a reload in the same tab and is cleared when the tab closes, which is safer on a shared computer. Declined for now because a later visit should resume. It remains the fallback if people worry about shared devices.
- **IndexedDB.** More capable than one small document needs, and harder to inspect and clear.
- **Encrypting the stored item.** Without a secret the person enters, the key would sit beside the data in the same browser and add no protection. With a passphrase, it adds a step most people would not take.
- **Saving to a server or an account.** Out of scope; it needs sign-in and data-handling decisions.

## Consequences

- **Privacy:** the answers are kept unencrypted in the browser profile on that device. Anyone with access to that browser profile can read them, as with any site's saved data. The notice and Forget make that visible and reversible. Every fixture, test, screenshot and log still uses synthetic data.
- **Security:** the strict Content Security Policy and the absence of third-party scripts remain the main protection against another script reading the item. No new dependency.
- **Requires:**
  - the storage module in the web app: read, validate through the engine, write and forget;
  - the notices and the footer change;
  - `docs/architecture/web-shell.md`;
  - the changed end-to-end checks.
- **Amends:** decision 0011 item 8, for this one item only.
