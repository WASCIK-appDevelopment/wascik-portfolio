import OwnerModuleClient from "../OwnerModuleClient";
import AffiliateSearchClient from "./AffiliateSearchClient";

export default function AffiliateSearchPage() {
  return <OwnerModuleClient title="Affiliate Search" description="Select categories and prepare separate 20-product review batches from approved affiliate sources before anything is published." currentPath="/owner/affiliate-search">
    <AffiliateSearchClient />
  </OwnerModuleClient>;
}
