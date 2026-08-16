import { getStage6Config } from "../../lib/ai/stage6Config";

type PublishedProduct = {
  id: string;
  merchant: string;
  title: string;
  category?: string | null;
  description?: string | null;
  features?: string[] | null;
  affiliate_url: string;
  image_url?: string | null;
  price?: string | null;
};

function serverHeaders(key: string, kind?: "secret" | "service_role") {
  const headers: Record<string, string> = { apikey: key };
  if (kind === "service_role") headers.Authorization = `Bearer ${key}`;
  return headers;
}

type PublishedAffiliateProductsProps = {
  pagePath: string;
  merchant?: string;
  embedded?: boolean;
};

export default async function PublishedAffiliateProducts({ pagePath, merchant, embedded = false }: PublishedAffiliateProductsProps) {
  const config = getStage6Config();
  if (!config.databaseConfigured || !config.supabaseServerKey) return null;

  const query = new URLSearchParams({
    select: "id,merchant,title,category,description,features,affiliate_url,image_url,price",
    approval_status: "eq.approved",
    page_path: `eq.${pagePath}`,
    published_at: "not.is.null",
    order: "published_at.desc",
    limit: "200",
  });
  if (merchant) query.set("merchant", `eq.${merchant}`);
  const response = await fetch(`${config.supabaseUrl}/rest/v1/approved_affiliate_products?${query.toString()}`, {
    headers: serverHeaders(config.supabaseServerKey, config.supabaseKeyKind),
    cache: "no-store",
  });
  if (!response.ok) return null;
  const products = await response.json().catch(() => []) as PublishedProduct[];
  if (!Array.isArray(products) || products.length === 0) return null;

  const cards = products.map((product) => <article key={product.id} className="flex h-full flex-col overflow-hidden rounded-3xl border border-cyan-400/25 bg-gradient-to-br from-[#092238] to-[#020a12] shadow-[0_22px_60px_rgba(0,0,0,.3)]">
    <div className="grid min-h-56 place-items-center bg-white p-4">{product.image_url ? <img src={product.image_url} alt={product.title} className="max-h-56 w-full object-contain" /> : <div className="text-sm font-bold text-slate-500">Product image unavailable</div>}</div>
    <div className="flex flex-1 flex-col p-6">
      <p className="text-xs font-black uppercase tracking-[.18em] text-cyan-300">{product.merchant}{product.category ? ` · ${product.category}` : ""}</p>
      <h3 className="mt-3 text-2xl font-black leading-tight">{product.title}</h3>
      {product.price && <p className="mt-3 font-black text-emerald-300">{product.price}</p>}
      {product.description && <p className="mt-4 line-clamp-5 leading-7 text-slate-300">{product.description}</p>}
      {Array.isArray(product.features) && product.features.length > 0 && <ul className="mt-4 grid gap-2 text-sm text-slate-300">{product.features.slice(0, 4).map((feature) => <li key={feature}>✓ {feature}</li>)}</ul>}
      <div className="mt-auto pt-6"><a href={product.affiliate_url} target="_blank" rel="sponsored noopener noreferrer" className="inline-flex min-h-12 w-full items-center justify-center rounded-xl bg-cyan-300 px-5 py-3 text-center font-black text-slate-950 transition hover:bg-cyan-200">View Product →</a><p className="mt-3 text-center text-xs leading-5 text-slate-500">Affiliate link · Merchant pricing and availability may change.</p></div>
    </div>
  </article>);

  if (embedded) return <>{cards}</>;

  return <section className="relative z-10 px-5 py-16 text-white md:px-8">
    <div className="mx-auto max-w-7xl">
      <p className="text-xs font-black uppercase tracking-[.25em] text-cyan-300">Recently approved by WASCIK</p>
      <h2 className="mt-3 text-4xl font-black">More featured products</h2>
      <p className="mt-4 max-w-3xl leading-7 text-slate-300">Owner-approved products added through the private WASCIK Affiliate Search console.</p>
      <div className="mt-9 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {cards}
      </div>
    </div>
  </section>;
}
