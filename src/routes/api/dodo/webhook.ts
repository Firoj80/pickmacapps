import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/dodo/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { verifyDodoSignature } = await import("@/lib/dodo.server");
        const { markPaymentPaid, publicOffer } = await import("@/lib/directory.server");
        const body = await request.text();
        const ok = verifyDodoSignature({
          id: request.headers.get("webhook-id") ?? "",
          timestamp: request.headers.get("webhook-timestamp") ?? "",
          signature: request.headers.get("webhook-signature") ?? "",
          body,
        });
        if (!ok) return new Response("Invalid signature\n", { status: 401 });
        let event: {
          type?: string;
          data?: {
            payment_id?: string;
            total_amount?: number;
            currency?: string;
            metadata?: { submission_id?: string };
          };
        };
        try {
          event = JSON.parse(body) as typeof event;
        } catch {
          return new Response("Invalid JSON\n", { status: 400 });
        }
        if (event.type === "payment.succeeded") {
          const submissionId = event.data?.metadata?.submission_id ?? "";
          if (submissionId) {
            const offer = await publicOffer();
            const amount = Number(event.data?.total_amount);
            await markPaymentPaid({
              eventId: request.headers.get("webhook-id") ?? submissionId,
              submissionId,
              paymentId: event.data?.payment_id ?? "",
              amountCents: Number.isFinite(amount) && amount > 0 ? amount : offer.priceCents,
              currency: event.data?.currency ?? "USD",
            });
          }
        }
        return Response.json({ received: true });
      },
    },
  },
});
