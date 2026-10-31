import assert from "node:assert/strict"
import { test } from "node:test"
import { indexNowEnabled, indexNowKey, indexNowPayload, submitToIndexNow, urlsForAppChange, urlsForGuideChange } from "./indexnow.ts"

const origin = "https://pickmacapps.test"

test("IndexNow stays quiet without a production key and builds the right URL list", () => {
  const previous = {
    key: process.env.INDEXNOW_KEY,
    node: process.env.NODE_ENV,
    vercel: process.env.VERCEL_ENV,
    enable: process.env.INDEXNOW_ENABLE,
  }
  delete process.env.INDEXNOW_KEY
  delete process.env.VERCEL_ENV
  delete process.env.INDEXNOW_ENABLE
  assert.equal(indexNowKey(), "")
  assert.equal(indexNowEnabled(), false)

  process.env.INDEXNOW_KEY = "a".repeat(32)
  process.env.NODE_ENV = "development"
  assert.equal(indexNowEnabled(), false)
  const appUrls = urlsForAppChange(origin, "helumi")
  assert.deepEqual(appUrls, [
    `${origin}/app/helumi`,
    `${origin}/category/developer-tools`,
    `${origin}/`,
  ])
  const guideUrls = urlsForGuideChange(origin, "best-paste-alternative-mac")
  assert.equal(guideUrls.length, 3)
  const payload = indexNowPayload(origin, appUrls)
  assert.equal(payload.host, "pickmacapps.test")
  assert.equal(payload.keyLocation, `${origin}/${"a".repeat(32)}.txt`)
  assert.deepEqual(payload.urlList, appUrls)
  submitToIndexNow(origin, appUrls)

  if (previous.key === undefined) delete process.env.INDEXNOW_KEY
  else process.env.INDEXNOW_KEY = previous.key
  if (previous.node === undefined) delete process.env.NODE_ENV
  else process.env.NODE_ENV = previous.node
  if (previous.vercel === undefined) delete process.env.VERCEL_ENV
  else process.env.VERCEL_ENV = previous.vercel
  if (previous.enable === undefined) delete process.env.INDEXNOW_ENABLE
  else process.env.INDEXNOW_ENABLE = previous.enable
})
