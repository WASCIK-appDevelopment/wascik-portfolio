import type { Metadata } from "next";
import FunnelExperience from "./FunnelExperience";

export const metadata: Metadata = {
  title: "AI Digital Representatives | WASCIK App Development",
  description:
    "Explore a WASCIK AI Digital Representative designed to greet website visitors, answer questions, qualify leads, and guide customers toward the right next step.",
};

export default function AIFunnelPage() {
  return <FunnelExperience />;
}
