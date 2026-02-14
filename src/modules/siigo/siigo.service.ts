import { siigoApi } from "./siigo-api";
import { mapSiigoProduct } from "./siigo.mapper";

export async function getProducts(page = 1, pageSize = 24) {
  const { data } = await siigoApi.get("/products", {
    params: {
      page,
      page_size: pageSize,
    },
  });

  return {
    pagination: data.pagination,
    products: data.results.map(mapSiigoProduct),
  };
}

export async function getProductById(id: string) {
  const { data } = await siigoApi.get(`/products/${id}`);
  return mapSiigoProduct(data);
}
