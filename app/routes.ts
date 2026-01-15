import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("common/pages/home-page.tsx"),
    route("assets", "features/assets/pages/assets-page.tsx"),
] satisfies RouteConfig;
