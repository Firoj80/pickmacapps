import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { adminCookie, adminSessionOk, clearAdminCookie, passwordsMatch } from "@/lib/admin-auth.server";
import {
  approveSubmission,
  createAdminApp,
  deleteApp,
  deleteGuide,
  generateAppDashboardToken,
  regenerateAppDashboardToken,
  publishAllUnpublishedApps,
  rejectSubmission,
  runBadgeChecks,
  saveApp,
  saveGuide,
  setChoicePrice,
  setPackagePrice,
  toggleAppHot,
  updateSidebarSettings,
  updateUpvoteSettings,
  verifySubmissionBadge,
} from "@/lib/directory.server";
import { registerTelegramWebhook } from "@/lib/telegram.server";

function redirect(location: string, cookie?: string) {
  const headers = new Headers({ location });
  if (cookie) headers.set("set-cookie", cookie);
  return new Response(null, { status: 303, headers });
}

export async function handleAdminPost(request: Request) {
  const url = new URL(request.url);
  const action = url.pathname.replace(/^\/api\/admin\/?/, "");
  const form = await request.formData();
  if (action === "login") {
    const password = String(form.get("password") ?? "");
    if (!passwordsMatch(password)) return redirect("/admin/login?error=1");
    return redirect("/admin", adminCookie());
  }
  if (action === "logout") {
    return redirect("/admin/login", clearAdminCookie());
  }
  if (!adminSessionOk(request.headers.get("cookie"))) return redirect("/admin/login");
  try {
    if (action === "upload") {
      const file = form.get("file");
      if (!file || typeof file === "string" || !(file instanceof Blob)) {
        return new Response(JSON.stringify({ error: "No image file provided" }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
      }
      const bytes = Buffer.from(await file.arrayBuffer());
      const mime = file.type || "image/png";
      let ext = "png";
      if (mime.includes("jpeg") || mime.includes("jpg")) ext = "jpg";
      else if (mime.includes("webp")) ext = "webp";
      else if (mime.includes("gif")) ext = "gif";
      else if (mime.includes("svg")) ext = "svg";

      const filename = `${randomUUID()}.${ext}`;
      const uploadDir = path.resolve(process.cwd(), "public", "uploads");
      await fs.promises.mkdir(uploadDir, { recursive: true });
      await fs.promises.writeFile(path.join(uploadDir, filename), bytes);

      return new Response(JSON.stringify({ ok: true, url: `/uploads/${filename}` }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }
    if (action === "apps") {
      const intent = String(form.get("intent") ?? "save");
      if (intent === "delete") {
        await deleteApp(String(form.get("id") ?? ""));
        return redirect("/admin/apps?saved=deleted");
      }
      if (intent === "generate_dashboard_token") {
        const appId = String(form.get("id") ?? "");
        if (appId) {
          await generateAppDashboardToken(appId);
        }
        const returnTo = String(form.get("return_to") ?? `/admin/apps/${appId}?saved=token_generated`);
        return redirect(returnTo);
      }
      if (intent === "regenerate_dashboard_token") {
        const appId = String(form.get("id") ?? "");
        if (appId) {
          await regenerateAppDashboardToken(appId);
        }
        const returnTo = String(form.get("return_to") ?? `/admin/apps/${appId}?saved=token_regenerated`);
        return redirect(returnTo);
      }
      if (intent === "create" || !form.get("id")) {
        const { id } = await createAdminApp({
          name: String(form.get("name") ?? ""),
          slug: String(form.get("slug") ?? ""),
          tagline: String(form.get("tagline") ?? ""),
          description: String(form.get("description") ?? ""),
          icon: String(form.get("icon") ?? ""),
          demo: String(form.get("demo") ?? ""),
          website: String(form.get("website") ?? ""),
          pricing: String(form.get("pricing") ?? "free"),
          category: String(form.get("category") ?? "utility"),
          editorChoice: form.get("editor_choice") === "on",
          featuredTier: (form.get("featured_tier") as "article" | "featured") || "featured",
          isHot: form.get("is_hot") === "on" || form.get("is_hot") === "true",
          checkBadge: form.get("check_badge") === "on" || form.get("check_badge") === "true",
          xHandle: String(form.get("x_handle") ?? ""),
          status: String(form.get("status") ?? "published"),
          scheduleHotNextCycle: form.get("schedule_hot_next") === "1" || form.get("schedule_hot_next") === "on",
          hotScheduledFor: form.get("hot_scheduled_for") ? String(form.get("hot_scheduled_for")) : undefined,
          scheduleGoldNextCycle: form.get("schedule_gold_next") === "1" || form.get("schedule_gold_next") === "on",
          featuredScheduledFor: form.get("featured_scheduled_for") ? String(form.get("featured_scheduled_for")) : undefined,
        });
        return redirect(`/admin/apps/${id}?saved=created`);
      }
      await saveApp({
        id: String(form.get("id") ?? ""),
        name: String(form.get("name") ?? ""),
        slug: String(form.get("slug") ?? ""),
        tagline: String(form.get("tagline") ?? ""),
        description: String(form.get("description") ?? ""),
        icon: String(form.get("icon") ?? ""),
        demo: String(form.get("demo") ?? ""),
        website: String(form.get("website") ?? ""),
        pricing: String(form.get("pricing") ?? ""),
        category: String(form.get("category") ?? ""),
        editorChoice: form.get("editor_choice") === "on",
        featuredTier: (form.get("featured_tier") as "article" | "featured") || "featured",
        isHot: form.get("is_hot") === "on" || form.get("is_hot") === "true",
        checkBadge: form.get("check_badge") === "on" || form.get("check_badge") === "true",
        xHandle: String(form.get("x_handle") ?? ""),
        status: String(form.get("status") ?? ""),
        scheduleHotNextCycle: form.get("schedule_hot_next") === "1" || form.get("schedule_hot_next") === "on",
        hotScheduledFor: form.get("hot_scheduled_for") ? String(form.get("hot_scheduled_for")) : undefined,
        clearHotSchedule: form.get("clear_hot_schedule") === "1" || form.get("clear_hot_schedule") === "true",
        scheduleGoldNextCycle: form.get("schedule_gold_next") === "1" || form.get("schedule_gold_next") === "on",
        featuredScheduledFor: form.get("featured_scheduled_for") ? String(form.get("featured_scheduled_for")) : undefined,
        clearGoldSchedule: form.get("clear_gold_schedule") === "1" || form.get("clear_gold_schedule") === "true",
      });
      return redirect(`/admin/apps/${form.get("id")}?saved=1`);
    }
    if (action === "publish-all") {
      const count = await publishAllUnpublishedApps();
      return redirect(`/admin?saved=published_all&count=${count}`);
    }
    if (action === "guides") {
      const intent = String(form.get("intent") ?? "save");
      if (intent === "delete") {
        await deleteGuide(String(form.get("slug") ?? ""));
        return redirect("/admin/guides");
      }
      const slug = await saveGuide({
        slug: String(form.get("slug") ?? ""),
        originalSlug: String(form.get("original_slug") ?? ""),
        title: String(form.get("title") ?? ""),
        excerpt: String(form.get("excerpt") ?? ""),
        html: String(form.get("html") ?? ""),
        status: String(form.get("status") ?? "draft"),
        isNew: form.get("is_new") === "1",
      });
      return redirect(`/admin/guides/${slug}?saved=1`);
    }
    if (action === "price") {
      const dollars = Number(form.get("dollars"));
      const compare = Number(form.get("compare"));
      const tier = form.get("tier") === "article" ? "article" : "featured";
      if (!Number.isFinite(dollars) || !Number.isFinite(compare)) return redirect("/admin?error=price");
      await setPackagePrice(tier, Math.round(dollars * 100), Math.round(compare * 100));
      return redirect(`/admin?saved=price`);
    }
    if (action === "badges") {
      await runBadgeChecks();
      return redirect("/admin?saved=badges");
    }
    if (action === "telegram") {
      await registerTelegramWebhook(url.origin);
      return redirect("/admin?saved=telegram");
    }
    if (action === "verify-submission-badge") {
      const id = String(form.get("id") ?? "");
      const result = await verifySubmissionBadge(id);
      if (!result.ok) {
        return redirect(`/admin?error=${encodeURIComponent(`Badge check failed: ${result.message}`)}`);
      }
      return redirect("/admin?saved=badge_ok");
    }
    if (action === "update-upvote-settings") {
      const upvotesEnabled = form.get("upvotes_enabled") === "on";
      const autoHotEnabled = form.get("auto_hot_enabled") === "on";
      const hotThreshold = Number(form.get("hot_threshold") ?? 15);
      await updateUpvoteSettings({
        upvotesEnabled,
        autoHotEnabled,
        hotThreshold: Number.isFinite(hotThreshold) && hotThreshold > 0 ? hotThreshold : 15,
      });
      return redirect("/admin?saved=upvote_settings");
    }
    if (action === "update-sidebar-settings") {
      const duration = String(form.get("sidebar_duration") ?? "24h");
      const enabled = form.get("sidebar_enabled") === "on" || form.get("sidebar_enabled") === "true";
      await updateSidebarSettings({ duration, enabled });
      return redirect("/admin?saved=sidebar_settings");
    }
    if (action === "approve") {
      const id = String(form.get("id") ?? "");
      const makeHot = form.get("make_hot") === "1" || form.get("make_hot") === "true";
      const scheduleHot = form.get("schedule_hot") === "1" || form.get("schedule_hot") === "true";
      const makeGold = form.get("make_gold") === "1" || form.get("make_gold") === "true";
      const scheduleGold = form.get("schedule_gold") === "1" || form.get("schedule_gold") === "true";

      const created = await approveSubmission(id, {
        approvedBy: "Web Admin",
        makeHot,
        scheduleHot,
        makeGold,
        scheduleGold,
      });

      const { submitToIndexNow, urlsForAppChange } = await import("@/lib/indexnow");
      const { PRIMARY_ORIGIN } = await import("@/lib/seo");
      submitToIndexNow(PRIMARY_ORIGIN, urlsForAppChange(PRIMARY_ORIGIN, created.slug));

      const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
      if (adminChatId) {
        try {
          const { getSubmissionById } = await import("@/lib/directory.server");
          const {
            sendTelegramMessage,
            formatXPostTelegramMessage,
            buildXPostInlineKeyboard,
          } = await import("@/lib/telegram.server");
          const subInfo = await getSubmissionById(id);
          if (subInfo) {
            await sendTelegramMessage(
              adminChatId,
              formatXPostTelegramMessage(subInfo, 1, created.slug),
              buildXPostInlineKeyboard(subInfo, 1, created.slug),
            );
            if (created.dashboardToken) {
              const dashUrl = `${PRIMARY_ORIGIN}/dashboard/${created.dashboardToken}`;
              await sendTelegramMessage(
                adminChatId,
                `🔑 <b>Submitter Dashboard Link:</b>\n<a href="${dashUrl}">${dashUrl}</a>\n\n<i>Share this private link with the developer so they can manage their listing, metrics & badges.</i>`,
              );
            }
          }
        } catch (tgErr) {
          console.error("Failed to send X-post alert to Telegram from web admin approval:", tgErr);
        }
      }

      const returnTo = String(form.get("return_to") ?? "/admin/submissions?saved=approved");
      return redirect(returnTo);
    }
    if (action === "toggle-hot") {
      const id = String(form.get("id") ?? "");
      const returnTo = String(form.get("return_to") ?? "/admin/apps");
      if (id) {
        await toggleAppHot(id);
      }
      return redirect(returnTo);
    }
    if (action === "reject") {
      await rejectSubmission(String(form.get("id") ?? ""));
      return redirect("/admin?saved=rejected");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not save";
    if (action === "apps" && form.get("id")) {
      return redirect(`/admin/apps/${encodeURIComponent(String(form.get("id")))}?error=${encodeURIComponent(message)}`);
    }
    return redirect(`/admin?error=${encodeURIComponent(message)}`);
  }
  return new Response("Not found\n", { status: 404 });
}
