import { type RouteConfig, index, route, prefix, layout } from "@react-router/dev/routes";

export default [
    index("common/pages/index-page.tsx"),
    route("home", "common/pages/home-page.tsx"),
    route("assets", "features/assets/pages/assets-page.tsx"),
    route("assets/new", "features/assets/pages/new-asset-page.tsx"),
    route("assets/:id/edit", "features/assets/pages/edit-asset-page.tsx"),
    route("assets/:id/delete", "features/assets/pages/delete-asset.tsx"),

    route("assets/:id/toggle-hidden", "features/assets/pages/toggle-hidden-asset.tsx"),
    ...prefix("/auth", [
        layout("features/auth/layouts/auth-layout.tsx", [
        route("/login", "features/auth/pages/login-page.tsx"),
        route("/join", "features/auth/pages/join-page.tsx"),
        ...prefix("/opt", [
            route("/start", "features/auth/pages/opt-start-page.tsx"),
            route("/complete", "features/auth/pages/opt-complete-page.tsx"),
        ]),
        ...prefix("/social/:provider", [
            route("/start", "features/auth/pages/social-start-page.tsx"),
            route("/complete", "features/auth/pages/social-complete-page.tsx"),
        ]),
    ])
])
] satisfies RouteConfig;
