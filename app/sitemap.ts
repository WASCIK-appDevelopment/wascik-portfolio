import type { MetadataRoute } from "next";

const siteUrl = "https://wascik-app-development.netlify.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: "", changeFrequency: "monthly", priority: 1 },
    { path: "/start-project", changeFrequency: "monthly", priority: 0.9 },
    { path: "/affiliate-services", changeFrequency: "weekly", priority: 0.9 },
    { path: "/affiliate-services/ticketnetwork", changeFrequency: "weekly", priority: 0.8 },
    { path: "/affiliate-services/coofandy", changeFrequency: "weekly", priority: 0.8 },
    { path: "/affiliate-services/dhgate", changeFrequency: "weekly", priority: 0.8 },
    { path: "/affiliate-services/eurooptic", changeFrequency: "weekly", priority: 0.8 },
    { path: "/affiliate-services/focus-camera", changeFrequency: "weekly", priority: 0.8 },
    { path: "/affiliate-services/aquacurve", changeFrequency: "weekly", priority: 0.7 },
    { path: "/affiliate-services/gearup", changeFrequency: "weekly", priority: 0.8 },
    {
      path: "/affiliate-services/dhgate/portable-voice-recorder",
      changeFrequency: "monthly",
      priority: 0.7,
    },
  ] as const;

  return routes.map(({ path, changeFrequency, priority }) => ({
    url: `${siteUrl}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }));
}
