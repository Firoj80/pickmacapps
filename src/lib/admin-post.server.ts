import { adminCookie, adminSessionOk, clearAdminCookie, passwordsMatch } from "@/lib/admin-auth.server";
import {
  approveSubmission,
  deleteApp,
  deleteGuide,
  rejectSubmission,
  runBadgeChecks,
  saveApp,
  saveGuide,
  setChoicePrice,
  setPackagePrice,
} from "@/lib/directory.server";

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
    if (action === "apps") {
      const intent = String(form.get("intent") ?? "save");
      if (intent === "delete") {
        await deleteApp(String(form.get("id") ?? ""));
        return redirect("/admin/apps");
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
        status: String(form.get("status") ?? ""),
      });
      return redirect(`/admin/apps/${form.get("id")}?saved=1`);
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
    if (action === "approve") {
      await approveSubmission(String(form.get("id") ?? ""));
      return redirect("/admin?saved=approved");
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
