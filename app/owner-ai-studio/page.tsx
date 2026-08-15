import { redirect } from "next/navigation";
import { hasOwnerStudioSession } from "../../lib/ownerStudioAuth";

export const metadata = {
  title: "WASCIK Owner AI Media Studio",
  robots: { index: false, follow: false },
};

export default async function OwnerAIStudioPage() {
  const allowed = await hasOwnerStudioSession();
  if (!allowed) redirect("/owner-ai-studio/login");

  return (
    <main style={{ minHeight: "100vh", background: "#050914", color: "white", padding: "56px 20px 90px" }}>
      <div style={{ width: "min(1040px, 100%)", margin: "0 auto" }}>
        <p style={{ color: "#7fd7ff", fontWeight: 900, letterSpacing: ".12em" }}>PRIVATE WASCIK OWNER TOOL</p>
        <h1 style={{ fontSize: "clamp(3rem,8vw,6rem)", lineHeight: 1, margin: "12px 0" }}>AI Media Studio</h1>
        <p style={{ maxWidth: 760, color: "#aebed0", lineHeight: 1.7 }}>
          This private workspace is reserved for WASCIK owner content creation. It will turn project updates, affiliate products, services, and ideas into platform-ready media content.
        </p>

        <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(210px,1fr))", gap: 14, marginTop: 34 }}>
          {[
            ["Social Captions", "Facebook, Instagram, Threads, X, and LinkedIn copy."],
            ["Short Video Scripts", "TikTok, Reels, and YouTube Shorts hooks and scripts."],
            ["Ad Concepts", "Hooks, offers, calls to action, and visual directions."],
            ["Content Ideas", "Reusable batches of ideas around a project, service, or product."],
          ].map(([title, description]) => (
            <article key={title} style={{ padding: 22, borderRadius: 22, border: "1px solid rgba(255,255,255,.1)", background: "#0a1321" }}>
              <strong>{title}</strong>
              <p style={{ color: "#9fb0c3", lineHeight: 1.55 }}>{description}</p>
            </article>
          ))}
        </section>

        <section style={{ marginTop: 28, padding: 26, borderRadius: 24, border: "1px solid rgba(86,199,255,.18)", background: "#081525" }}>
          <p style={{ color: "#7fd7ff", fontWeight: 800 }}>STAGE 3 FOUNDATION</p>
          <p style={{ color: "#b6c6d8", lineHeight: 1.7 }}>
            Authentication is active. The next integration layer will connect this private studio to server-side AI generation, saved brand context, media assets, and platform-specific output tools.
          </p>
        </section>
      </div>
    </main>
  );
}
