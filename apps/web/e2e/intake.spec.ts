// SPDX-License-Identifier: AGPL-3.0-only
import {
  expect,
  type Locator,
  type Page,
  type TestInfo,
} from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { test } from "./fixtures";
import { storageTrap } from "./privacy";
import { keyboardTo } from "./keyboard";
import { readFileSync } from "node:fs";
import type { Request } from "../src/protocol";
const reference = JSON.parse(
  readFileSync(
    new URL(
      "../../../docs/briefs/0002-W5-reference-values.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
const sentences = JSON.parse(
  readFileSync(
    new URL(
      "../../../docs/briefs/0002-W6-head-sentences.json",
      import.meta.url,
    ),
    "utf8",
  ),
).cases;
const key = "horizon.intake.v1";
async function capture(page: Page, info: TestInfo, name: string) {
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const path = info.outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true });
  await info.attach(name, { path, contentType: "image/png" });
}
for (const style of ["one_question", "conversation", "guided_page"] as const) {
  test(`intake: ${style}, every question, saved answers and keyboard`, async ({
    page,
    context,
    browser,
    browserName,
  }, info) => {
    info.annotations.push({
      type: "browser-version",
      description: browser.version(),
    });
    const outside: string[] = [];
    context.on("request", (r) => {
      if (new URL(r.url()).origin !== "http://127.0.0.1:4173")
        outside.push(r.url());
    });
    await storageTrap(page);
    await page.clock.setFixedTime(new Date("2026-01-01T12:00:00Z"));
    await page.addInitScript(() => {
      const probe = window as unknown as { answers: string[] };
      probe.answers = [];
      const Native = Worker;
      window.Worker = class extends Native {
        constructor(url: string | URL, options?: WorkerOptions) {
          super(url, options);
          const post = this.postMessage.bind(this);
          this.postMessage = (r: Request) => {
            if (r.op === "plan_from_answers") probe.answers.push(r.args[0]);
            post(r);
          };
        }
      };
    });
    const traversal =
      process.platform === "darwin" && browserName === "webkit"
        ? "Alt+Tab"
        : "Tab";
    async function activate(locator: Locator) {
      await keyboardTo(page, locator, traversal);
      await expect(locator).toBeFocused();
      await page.keyboard.press("Enter");
    }
    async function type(locator: Locator, value: string) {
      await keyboardTo(page, locator, traversal);
      await page.keyboard.press("ControlOrMeta+A");
      await page.keyboard.type(value);
    }
    async function chooseRadio(radio: Locator) {
      const group = radio.locator("..").locator("..");
      await keyboardTo(
        page,
        group.getByRole("radio", { checked: true }),
        traversal,
      );
      for (let i = 0; i < 6 && !(await radio.isChecked()); i++)
        await page.keyboard.press("ArrowDown");
      await expect(radio).toBeChecked();
    }
    async function choose(name: string) {
      await chooseRadio(page.getByRole("radio", { name, exact: true }));
    }
    async function next() {
      await activate(
        page
          .getByRole("button", {
            name:
              style === "guided_page"
                ? /^(Next:|Review my answers$)/
                : "Continue",
            exact: style !== "guided_page",
          })
          .filter({ hasNotText: "Continue with" })
          .first(),
      );
    }
    const value = async () =>
      page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key);
    await page.goto("/");
    await activate(
      page.getByRole("button", {
        name: "Start with my own figures",
        exact: true,
      }),
    );
    if (style !== "one_question") {
      await activate(
        page.getByText("Answer in a different style", { exact: true }),
      );
      await activate(
        page.getByRole("button", {
          name: style === "conversation" ? "Conversation" : "Guided page",
          exact: true,
        }),
      );
    }
    await capture(page, info, `${style}-01-planning`);
    if (style !== "guided_page") await next();
    await activate(
      page.getByRole("button", { name: "I'd rather give my age", exact: true }),
    );
    await type(
      page.getByRole("textbox", { name: "Your age", exact: true }),
      "60",
    );
    await capture(page, info, `${style}-02-birth-age`);
    if (style !== "guided_page") await next();
    await choose("Not yet");
    await capture(page, info, `${style}-03-retired`);
    if (style !== "guided_page") await next();
    await type(
      page.getByRole("textbox", { name: "Retirement age", exact: true }),
      "66",
    );
    await capture(page, info, `${style}-04-retirement`);
    if (style !== "guided_page") await next();
    await type(
      page.getByRole("textbox", { name: "Plan to age", exact: true }),
      "95",
    );
    await capture(page, info, `${style}-05-plan-end`);
    await next();
    await activate(
      page
        .getByRole("button", {
          name: "Not sure? Give a range instead",
          exact: true,
        })
        .first(),
    );
    await type(
      page.getByRole("textbox", {
        name: "What do you earn now, before tax?, lower amount",
        exact: true,
      }),
      "90k",
    );
    await type(
      page.getByRole("textbox", {
        name: "What do you earn now, before tax?, higher amount",
        exact: true,
      }),
      "80k",
    );
    await expect(
      page.getByText("Put the lower amount first, then the higher one.", {
        exact: true,
      }),
    ).toBeVisible();
    await type(
      page.getByRole("textbox", {
        name: "What do you earn now, before tax?, lower amount",
        exact: true,
      }),
      "80k",
    );
    await type(
      page.getByRole("textbox", {
        name: "What do you earn now, before tax?, higher amount",
        exact: true,
      }),
      "90k",
    );
    // Scope the checkbox to pay when the guided page also contains Social Security/pension.
    const pay = page.locator(".intake-question").filter({
      has: page.getByRole("heading", {
        name: "What do you earn now, before tax?",
        exact: true,
      }),
    });
    const payMark = pay.getByRole("checkbox", {
      name: "I'm not sure of this",
      exact: true,
    });
    await keyboardTo(page, payMark, traversal);
    await page.keyboard.press("Space");
    await capture(page, info, `${style}-06-pay-range-not-sure`);
    if (style === "one_question") {
      for (const [label, savedStyle] of [
        ["Conversation", "conversation"],
        ["Guided page", "guided_page"],
        ["One question at a time", "one_question"],
      ] as const) {
        await activate(
          page.getByText("Answer in a different style", { exact: true }),
        );
        await activate(page.getByRole("button", { name: label, exact: true }));
        expect((await value()).place).toBe("6");
        expect((await value()).style).toBe(savedStyle);
        expect((await value()).answers.pay).toEqual({
          range: { low_cents: 8000000, high_cents: 9000000 },
          per: "year",
        });
        await capture(page, info, `switch-${savedStyle}`);
      }
    }
    if (style !== "guided_page") await next();
    const work = page.locator(".intake-question").filter({
      has: page.getByRole("heading", {
        name: "Will you keep working until you retire?",
        exact: true,
      }),
    });
    await chooseRadio(work.getByRole("radio", { name: "Yes", exact: true }));
    await capture(page, info, `${style}-07-work-ends`);
    if (style !== "guided_page") await next();
    const social = page.locator(".intake-question").filter({
      has: page.getByRole("heading", {
        name: "Do you expect Social Security?",
        exact: true,
      }),
    });
    await chooseRadio(social.getByRole("radio", { name: "Yes", exact: true }));
    await capture(page, info, `${style}-08-social-expects`);
    if (style !== "guided_page") await next();
    await type(
      page.getByRole("textbox", {
        name: "Social Security start age",
        exact: true,
      }),
      "67",
    );
    await capture(page, info, `${style}-09-social-age`);
    if (style !== "guided_page") await next();
    const socialAmount = page.locator(".intake-question").filter({
      has: page.getByRole("heading", {
        name: "About how much will you get, in today's money?",
        exact: true,
      }),
    });
    await keyboardTo(
      page,
      socialAmount.getByRole("checkbox", {
        name: "I'm not sure of this",
        exact: true,
      }),
      traversal,
    );
    await page.keyboard.press("Space");
    await capture(page, info, `${style}-10-social-not-sure-empty`);
    if (style !== "guided_page") await next();
    const pension = page.locator(".intake-question").filter({
      has: page.getByRole("heading", {
        name: "Will you get a pension?",
        exact: true,
      }),
    });
    await chooseRadio(pension.getByRole("radio", { name: "Yes", exact: true }));
    await capture(page, info, `${style}-11-pension-expects`);
    if (style !== "guided_page") await next();
    await type(
      page.getByRole("textbox", { name: "Pension amount", exact: true }),
      "12k",
    );
    await type(
      page.getByRole("textbox", { name: "Pension start age", exact: true }),
      "65",
    );
    await choose("No, it stays the same");
    await capture(page, info, `${style}-12-pension`);
    await next();
    await type(
      page.getByRole("textbox", { name: "Account balance", exact: true }),
      "750k",
    );
    await capture(page, info, `${style}-13-savings-unadded`);
    await next();
    // Continue keeps an account that has been typed but has not been added.
    expect((await value()).answers.savings).toEqual({
      accounts: [{ kind: "cash", balance: { cents: 75000000 } }],
    });
    await type(
      page.getByRole("textbox", {
        name: "About how much do you spend now, including everything?",
        exact: true,
      }),
      "5,000",
    );
    await activate(
      page.getByRole("button", { name: "a month", exact: true }).first(),
    );
    await capture(page, info, `${style}-14-spending-monthly`);
    if (style !== "guided_page") await next();
    await activate(
      page
        .getByRole("button", { name: "I'll add this later", exact: true })
        .last(),
    );
    await capture(page, info, `${style}-15-spending-later`);
    await next();
    await expect(
      page.getByRole("heading", { name: "Here's what you told us" }),
    ).toBeFocused();
    await capture(page, info, `${style}-review`);
    const expected = {
      format: "horizon-answers",
      version: 2,
      valuation_date: "2026-01-01",
      planning: "alone",
      birth_date: { age: 60 },
      retired: false,
      retirement: { age: 66 },
      plan_end_age: 95,
      pay: { range: { low_cents: 8000000, high_cents: 9000000 }, per: "year" },
      pay_ends: { at_retirement: true },
      social_security: {
        expects: "yes",
        start_age: 67,
        amount: { later: true },
      },
      pension: {
        expects: "yes",
        amount: { cents: 1200000, per: "year" },
        start_age: 65,
        rises_with_prices: "no",
      },
      savings: { accounts: [{ kind: "cash", balance: { cents: 75000000 } }] },
      spending_now: { cents: 500000, per: "month" },
      spending_in_retirement: { later: true },
      assumptions: {},
      not_sure: ["pay", "social_security"],
    };
    expect(await value()).toEqual({
      format: "horizon-saved-intake",
      version: 1,
      answers: expected,
      style,
      place: "review",
    });
    await page.reload();
    await activate(
      page.getByRole("button", {
        name: "Continue with my answers",
        exact: true,
      }),
    );
    await expect(
      page.getByRole("heading", { name: "Here's what you told us" }),
    ).toBeVisible();
    await activate(
      page.getByRole("button", { name: "See my plan", exact: true }),
    );
    await expect(page.getByTestId("intake-headline")).toContainText(
      "You could spend",
    );
    await capture(page, info, `${style}-results`);
    const sends = await page.evaluate(
      () => (window as unknown as { answers: string[] }).answers,
    );
    expect(sends.map((text) => JSON.parse(text))).toContainEqual(expected);
    await activate(
      page.getByRole("button", { name: "Back to my answers", exact: true }),
    );
    page.once("dialog", (dialog) => dialog.accept());
    await activate(
      page
        .getByRole("button", { name: "Forget my answers", exact: true })
        .first(),
    );
    await expect(
      page.getByRole("heading", {
        name: "See whether your savings can carry your retirement",
      }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => ({
        local: localStorage.length,
        session: sessionStorage.length,
        writes: (window as unknown as { writes: string[] }).writes,
      })),
    ).toEqual({ local: 0, session: 0, writes: [] });
    expect(outside).toEqual([]);
    expect(await context.cookies()).toEqual([]);
  });
}
test("intake: result cases, saved validation, resumption and example isolation", async ({
  page,
  context,
  browser,
}, info) => {
  info.annotations.push({
    type: "browser-version",
    description: browser.version(),
  });
  await storageTrap(page);
  const outside: string[] = [];
  context.on("request", (r) => {
    if (new URL(r.url()).origin !== "http://127.0.0.1:4173")
      outside.push(r.url());
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Start with my own figures", exact: true })
    .click();
  const cases = [
    "v2-working-complete",
    "v2-solve-spending",
    "v2-solve-savings",
    "v2-solve-retirement",
    "v2-needed-two",
    "v2-range-nothing-solved",
    "v2-partner",
    "v2-needed-birth",
    "v2-needed-retirement-without-pay",
  ];
  for (const name of cases) {
    const answers = reference.cases[name].answers;
    await page.evaluate(
      ({ key, answers }) =>
        localStorage.setItem(
          key,
          JSON.stringify({
            format: "horizon-saved-intake",
            version: 1,
            answers,
            style: "conversation",
            place: "results",
          }),
        ),
      { key, answers },
    );
    await page.reload();
    await page
      .getByRole("button", { name: "Continue with my answers", exact: true })
      .click();
    await expect(page.getByTestId("intake-headline")).toHaveText(
      sentences[name][0].slice(3),
    );
    await capture(page, info, `head-${name}`);
    if (name === "v2-working-complete") {
      await expect(
        page.getByRole("button", { name: "Try a change", exact: true }),
      ).toBeEnabled();
      await page
        .getByRole("button", { name: "Try a change", exact: true })
        .click();
      await page
        .getByRole("radio", { name: "Retire a year later, at 67", exact: true })
        .check();
      await page
        .getByRole("button", { name: "Make the copy", exact: true })
        .click();
      await expect(page.locator(".compare-screen h1")).toContainText(
        "Retiring at 67",
      );
      await capture(page, info, "own-figures-compare");
      await page
        .getByRole("button", { name: "Export this comparison", exact: true })
        .click();
      await expect(
        page.getByRole("link", { name: "Download plan file", exact: true }),
      ).toBeVisible();
      await capture(page, info, "own-figures-export");
    }
  }
  // A reload resumes the same question/style; examples do not overwrite it.
  const answers = reference.cases["v2-working-complete"].answers;
  const saved = {
    format: "horizon-saved-intake",
    version: 1,
    answers,
    style: "conversation",
    place: "10",
  };
  await page.evaluate(
    ({ key, saved }) => localStorage.setItem(key, JSON.stringify(saved)),
    { key, saved },
  );
  await page.reload();
  await page
    .getByRole("button", { name: "Continue with my answers", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "About how much will you get, in today's money?",
      exact: true,
    }),
  ).toBeFocused();
  await page.getByRole("button", { name: "Horizon welcome" }).click();
  await page
    .getByRole("button", { name: "Try an example household", exact: true })
    .click();
  await page.getByRole("button", { name: "Open example plan" }).click();
  expect(
    await page.evaluate((key) => JSON.parse(localStorage.getItem(key)!), key),
  ).toEqual(saved);
  // Corrupt, older, extra-field and structurally malformed answers are deleted with the notice.
  for (const invalid of [
    "not json",
    JSON.stringify({ ...saved, version: 2 }),
    JSON.stringify({ ...saved, result: {} }),
    JSON.stringify({
      ...saved,
      answers: { version: 2, format: "horizon-answers" },
    }),
  ]) {
    await page.evaluate(
      ({ key, invalid }) => localStorage.setItem(key, invalid),
      { key, invalid },
    );
    await page.reload();
    await expect(
      page.getByText(
        "We couldn't read the answers saved on this device, so we've started again.",
      ),
    ).toBeVisible();
    expect(await page.evaluate(() => localStorage.length)).toBe(0);
    await page
      .getByRole("button", { name: "Start with my own figures", exact: true })
      .click();
  }
  expect(outside).toEqual([]);
  expect(await context.cookies()).toEqual([]);
  expect(
    await page.evaluate(
      () => (window as unknown as { writes: string[] }).writes,
    ),
  ).toEqual([]);
});
test("intake: unavailable storage works in memory with a review notice", async ({
  page,
  browser,
}, info) => {
  info.annotations.push({
    type: "browser-version",
    description: browser.version(),
  });
  await storageTrap(page);
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new Error("Synthetic storage full");
    };
  });
  await page.goto("/");
  await page
    .getByRole("button", { name: "Start with my own figures", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Review my answers", exact: true })
    .click();
  await expect(
    page.getByText(
      "Your answers can't be kept on this device, so they will be gone when you close this page.",
    ),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "See my plan", exact: true }),
  ).toBeEnabled();
  await capture(page, info, "storage-unavailable-review");
});
