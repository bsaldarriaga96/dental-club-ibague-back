export function mapSiigoProduct(p: any) {
  return {
    siigoId: p.id,
    name: p.name,
    sku: p.code,
    type: p.type,
    price: p.prices?.[0]?.price_list?.[0]?.value ?? 0,
    stock: p.available_quantity ?? 0,
    isActive: p.available_quantity && p.available_quantity > 0,
  };
}
