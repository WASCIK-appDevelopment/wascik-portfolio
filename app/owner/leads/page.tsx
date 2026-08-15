import LeadConsoleClient from "./LeadConsoleClient";
import "./owner-leads.css";

export const metadata = {
  title: "WASCIK Owner Lead Inbox",
  robots: { index: false, follow: false },
};

export default function OwnerLeadsPage() {
  return <LeadConsoleClient />;
}
