import type { Route } from "./+types/assets-page";

export function loader({}: Route.LoaderArgs) {
  return {};
}

export function action({}: Route.ActionArgs) {
  return {};
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Products | wemake" },
    { name: "description", content: "Browse all products" },
  ];
}

export default function AssetsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-6">Products</h1>
      <p className="text-lg text-muted-foreground">Browse all products</p>
    </div>
  );
}

