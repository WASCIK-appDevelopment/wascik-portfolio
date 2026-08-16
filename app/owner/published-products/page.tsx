import OwnerModuleClient from "../OwnerModuleClient";
import ApprovedCatalogPublisher from "../affiliate-search/ApprovedCatalogPublisher";

export default function PublishedProductsPage() {
  return <OwnerModuleClient
    title="Published Products"
    description="Review every affiliate product currently published on WASCIK pages, including the original website catalog and products added through Affiliate Search."
    currentPath="/owner/published-products"
  >
    <ApprovedCatalogPublisher mode="published" />
  </OwnerModuleClient>;
}
