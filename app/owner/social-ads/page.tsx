import OwnerModuleClient from "../OwnerModuleClient";
import SocialAdsClient from "./SocialAdsClient";

export default function SocialAdsPage() {
  return <OwnerModuleClient
    title="Social & Advertising"
    description="Plan WASCIK affiliate social content and ad concepts from one private module, with AI drafting constrained to the product facts you provide."
    currentPath="/owner/social-ads"
  >
    <SocialAdsClient />
  </OwnerModuleClient>;
}
