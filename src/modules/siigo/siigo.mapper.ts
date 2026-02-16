export function mapSiigoProduct(p: any) {
  return {
    siigoId: p.id,
    name: p.name,
    description: p.description,
    sku: p.code,
    type: p.type,
    reference: p.reference,
    brand: p.additional_fields?.[0]?.brand,
    price: p.prices?.[0]?.price_list?.[0]?.value ?? 0,
    stock: p.available_quantity ?? 0,
    isActive: p.active,
  };
}
