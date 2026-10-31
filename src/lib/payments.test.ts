import assert from "node:assert/strict"
import { createHmac } from "node:crypto"
import { test } from "node:test"
import { adminCookie, adminSessionOk, passwordsMatch } from "./admin-auth.server.ts"
import { verifyDodoSignature } from "./dodo.server.ts"

test("admin session is an httpOnly cookie, not a client price", () => {
  process.env.ADMIN_PASSWORD = "correct-horse"
  assert.equal(passwordsMatch("wrong"), false)
  assert.equal(passwordsMatch("correct-horse"), true)
  const cookie = adminCookie(1_700_000_000_000)
  const header = cookie.split(";")[0]
  assert.equal(adminSessionOk(header, 1_700_000_000_000), true)
  assert.equal(adminSessionOk("pma_admin=1.deadbeef", 1_700_000_000_000), false)
  delete process.env.ADMIN_PASSWORD
})

test("Dodo webhook rejects a tampered body", () => {
  process.env.DODO_PAYMENTS_WEBHOOK_KEY = "test-secret"
  const body = JSON.stringify({ type: "payment.succeeded", data: { total_amount: 9900 } })
  const id = "msg_1"
  const timestamp = "1700000000"
  const signature = createHmac("sha256", Buffer.from("test-secret")).update(`${id}.${timestamp}.${body}`).digest("base64")
  assert.equal(
    verifyDodoSignature({ id, timestamp, signature: `v1,${signature}`, body, now: 1700000000 * 1000 }),
    true,
  )
  assert.equal(
    verifyDodoSignature({ id, timestamp, signature: `v1,${signature}`, body: body.replace("9900", "100"), now: 1700000000 * 1000 }),
    false,
  )
  delete process.env.DODO_PAYMENTS_WEBHOOK_KEY
})
