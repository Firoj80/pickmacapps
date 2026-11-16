import test from "node:test";
import assert from "node:assert/strict";
import {
  SUPPORTED_CURRENCIES,
  CURRENCY_LIST,
  COUNTRY_TO_CURRENCY,
  detectLocalCurrency,
  convertPrice,
  getLiveExchangeRates,
  type CurrencyCode,
} from "./currency.ts";

test("SUPPORTED_CURRENCIES has all 10 major global currencies", () => {
  const codes: CurrencyCode[] = [
    "USD",
    "EUR",
    "GBP",
    "INR",
    "CAD",
    "AUD",
    "JPY",
    "BRL",
    "SGD",
    "CHF",
  ];
  for (const c of codes) {
    assert.ok(SUPPORTED_CURRENCIES[c], `Currency ${c} is supported`);
    assert.equal(SUPPORTED_CURRENCIES[c].code, c);
    assert.ok(SUPPORTED_CURRENCIES[c].symbol.length > 0);
    assert.ok(SUPPORTED_CURRENCIES[c].flag.length > 0);
  }
  assert.equal(CURRENCY_LIST.length, 10);
});

test("detectLocalCurrency maps countries accurately", () => {
  assert.equal(detectLocalCurrency("IN"), "INR");
  assert.equal(detectLocalCurrency("GB"), "GBP");
  assert.equal(detectLocalCurrency("DE"), "EUR");
  assert.equal(detectLocalCurrency("FR"), "EUR");
  assert.equal(detectLocalCurrency("JP"), "JPY");
  assert.equal(detectLocalCurrency("CA"), "CAD");
  assert.equal(detectLocalCurrency("AU"), "AUD");
  assert.equal(detectLocalCurrency("BR"), "BRL");
  assert.equal(detectLocalCurrency("SG"), "SGD");
  assert.equal(detectLocalCurrency("CH"), "CHF");
  assert.equal(detectLocalCurrency("US"), "USD");
  assert.equal(detectLocalCurrency("UNKNOWN"), "USD");
  assert.equal(detectLocalCurrency(null), "USD");
});

test("convertPrice handles USD, zero, and conversions correctly", () => {
  // Zero dollars
  const zero = convertPrice(0, "INR");
  assert.equal(zero.amount, 0);
  assert.equal(zero.formatted, "$0");
  assert.equal(zero.isConverted, false);

  // USD passthrough
  const usd49 = convertPrice(49, "USD");
  assert.equal(usd49.amount, 49);
  assert.equal(usd49.formatted, "$49");
  assert.equal(usd49.symbol, "$");
  assert.equal(usd49.isConverted, false);

  // INR conversion with default rate (approx 94.4)
  const inr49 = convertPrice(49, "INR");
  assert.ok(inr49.amount > 4000, "INR amount should be > 4000");
  assert.ok(inr49.formatted.startsWith("₹"));
  assert.equal(inr49.symbol, "₹");
  assert.equal(inr49.isConverted, true);

  // EUR conversion with custom rate
  const eurCustom = convertPrice(100, "EUR", { EUR: 0.95 });
  assert.equal(eurCustom.amount, 95);
  assert.equal(eurCustom.formatted, "€95");
  assert.equal(eurCustom.symbol, "€");

  // CHF formatting
  const chfCustom = convertPrice(50, "CHF", { CHF: 0.9 });
  assert.equal(chfCustom.amount, 45);
  assert.equal(chfCustom.formatted, "45 CHF");
});

test("convertPrice supports 50% discount for BFCM", () => {
  const baseUsd = 49;
  const bfcmUsd = Math.round(baseUsd * 0.5); // 25
  const converted = convertPrice(bfcmUsd, "USD");
  assert.equal(converted.amount, 25);
  assert.equal(converted.formatted, "$25");

  const inrBfcm = convertPrice(bfcmUsd, "INR");
  assert.ok(inrBfcm.amount > 2000 && inrBfcm.amount < 3000);
});

test("getLiveExchangeRates returns a valid rates map", async () => {
  const rates = await getLiveExchangeRates();
  assert.ok(rates);
  assert.ok(typeof rates.EUR === "number");
  assert.ok(typeof rates.INR === "number");
  assert.ok(rates.INR > 50);
});
