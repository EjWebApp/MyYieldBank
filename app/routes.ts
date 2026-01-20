import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("common/pages/index-page.tsx"),
    route("home", "common/pages/home-page.tsx"),
    route("assets", "features/assets/pages/assets-page.tsx"),
    route("assets/new", "features/assets/pages/new-asset-page.tsx"),
    route("assets/:id/edit", "features/assets/pages/edit-asset-page.tsx"),
    route("assets/:id/delete", "features/assets/pages/delete-asset.tsx"),
    route("assets/:id/toggle-hidden", "features/assets/pages/toggle-hidden-asset.tsx")
] satisfies RouteConfig;
