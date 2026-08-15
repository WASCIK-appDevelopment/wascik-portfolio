import { unifiedAffiliateCatalog } from "./unifiedAffiliateCatalog";

export function getAffiliateCatalog(merchant?: string) {
  const requestedMerchant = merchant?.trim().toLowerCase();
  return unifiedAffiliateCatalog.filter((product) =>
    requestedMerchant ? product.merchant.toLowerCase() === requestedMerchant : true
  );
}
