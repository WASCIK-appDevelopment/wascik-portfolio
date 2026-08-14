import { affiliateProducts } from "../../app/affiliate-services/products";

export function getAffiliateCatalog(merchant?: string) {
  const requestedMerchant = merchant?.trim().toLowerCase();
  return affiliateProducts.filter((product) =>
    requestedMerchant ? product.merchant.toLowerCase() === requestedMerchant : true
  );
}
