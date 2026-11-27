import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/upload")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const form = await request.formData();
          const file = form.get("file");
          if (!file || typeof file === "string" || !(file instanceof Blob)) {
            return Response.json({ ok: false, error: "No image file provided" }, { status: 400 });
          }

          const { uploadAppImage } = await import("@/lib/storage.server");
          const result = await uploadAppImage(file, "submissions");
          return Response.json({ ok: true, url: result.url });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Upload failed";
          return Response.json({ ok: false, error: message }, { status: 400 });
        }
      },
    },
  },
});
