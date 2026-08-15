import OwnerModuleClient from "../OwnerModuleClient";
import ClickAnalyticsClient from "./ClickAnalyticsClient";

export default function ClickAnalyticsPage() {
  return <OwnerModuleClient title="Click Analytics" description="Your private view of WASCIK outbound affiliate-link activity by page, merchant, product, and source." currentPath="/owner/click-analytics">
    <ClickAnalyticsClient />
  </OwnerModuleClient>;
}
