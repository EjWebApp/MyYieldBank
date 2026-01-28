import { type RouteConfig, index, route, prefix, layout } from "@react-router/dev/routes";

export default [
    index("common/pages/index-page.tsx"),
    route("home", "common/pages/home-page.tsx"),
    route("assets", "features/assets/pages/assets-page.tsx"),
    route("assets/new", "features/assets/pages/new-asset-page.tsx"),
    route("assets/:id/edit", "features/assets/pages/edit-asset-page.tsx"),
    route("assets/:id/delete", "features/assets/pages/delete-asset.tsx"),

    route("assets/:id/toggle-hidden", "features/assets/pages/toggle-hidden-asset.tsx"),
    ...prefix("/ideas", [
        index("features/ideas/pages/ideas-page.tsx"),
        route("/:ideaId", "features/ideas/pages/idea-page.tsx"),
    ]),
    ...prefix("/auth", [
        layout("features/auth/layouts/auth-layout.tsx", [
            route("/login", "features/auth/pages/login-page.tsx"),
            route("/join", "features/auth/pages/join-page.tsx"),
            route("/logout", "features/auth/pages/logout-page.tsx"),
            ...prefix("/opt", [
                route("/start", "features/auth/pages/opt-start-page.tsx"),
                route("/complete", "features/auth/pages/opt-complete-page.tsx"),
            ]),
            ...prefix("/social/:provider", [
                route("/start", "features/auth/pages/social-start-page.tsx"),
                route("/complete", "features/auth/pages/social-complete-page.tsx"),
            ]),
        ]),
    ]),
    ...prefix("/my", [
    layout("features/users/layouts/dashboard-layout.tsx", [
      ...prefix("/dashboard", [
        index("features/users/pages/dashboard-page.tsx"),
        route("/ideas", "features/users/pages/dashboard-ideas-page.tsx"),
      ]),
    ]),
    layout("features/users/layouts/messages-layout.tsx", [
      ...prefix("/messages", [
        index("features/users/pages/messages-page.tsx"),
        route("/:messageId", "features/users/pages/message-page.tsx"),
      ]),
    ]),
    route("/profile", "features/users/pages/my-profile-page.tsx"),
    route("/settings", "features/users/pages/settings-page.tsx"),
    route("/notifications", "features/users/pages/notifications-page.tsx"),
  ]),

] satisfies RouteConfig;
