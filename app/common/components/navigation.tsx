import { Link } from "react-router";
import { Separator } from "~/common/components/ui/separator";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./ui/navigation-menu";

const menus = [
  {
    name: "홈",
    to: "/home",
  },
  {
    name: "종목",
    to: "/assets"
  },
  {
    name: "알림",
    to: "/community"
  },
  {
    name: "매매일지",
    to: "/ideas",
  },
  {
    name: "사용자",
    to: "/Users",
  }
];

export default function Navigation() {
  return (
    <nav className="flex px-20 h-16 items-center justify-between backdrop-blur fixed top-0 left-0 right-0 z-50 bg-background/50">
      <div className="flex items-center">
        <Link to="/" className="font-bold tracking-tighter text-lg">
          My Yield Bank
        </Link>
        <Separator orientation="vertical" className="h-6 mx-4" />
        <NavigationMenu>
          <NavigationMenuList>
            {menus.map((menu) => (
              <NavigationMenuItem key={menu.name}>
                <NavigationMenuLink asChild>
                  <Link to={menu.to} className="px-4 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground rounded-md">
                    {menu.name}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            ))}
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </nav>
  );
}