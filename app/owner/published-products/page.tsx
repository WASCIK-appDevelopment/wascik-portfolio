import OwnerModuleClient from "../OwnerModuleClient";
import ApprovedCatalogPublisher from "../affiliate-search/ApprovedCatalogPublisher";

export default function PublishedProductsPage() {
  return <OwnerModuleClient
    title="Published Products"
    description="Review every affiliate product currently published on WASCIK pages. View its public placement, unpublish it back to Affiliate Search, or remove it from the approved catalog."
    currentPath="/owner/published-products"
  >
    <ApprovedCatalogPublisher mode="published" />
  </OwnerModuleClient>;
}
