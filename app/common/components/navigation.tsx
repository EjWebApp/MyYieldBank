import { Link } from "react-router";
import { Separator } from "~/common/components/ui/separator";
import {
  navigationMenuTriggerStyle,
} from "~/common/components/ui/navigation-menu";
import { LogOutIcon } from "lucide-react";
import { Button } from "~/common/components/ui/button";

const menus = [
  {
    name: "홈",
    to: "/home",
  },
  {
    name: "종목",
    to: "/stocks"
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

interface NavigationProps {
  isLoggedIn: boolean;
  hasNotification: boolean;
  hasMessage: boolean;
}

export default function Navigation({
  isLoggedIn,
  hasNotification,
  hasMessage,
}: NavigationProps) {
  return (
    <nav className="flex px-20 h-16 items-center justify-between backdrop-blur fixed top-0 left-0 right-0 z-50 bg-background/50">
      <div className="flex items-center">
        <Link to="/" className="font-bold tracking-tighter text-lg">
          My Yield Bank
        </Link>
        <Separator orientation="vertical" className="h-6 mx-4" />
        <div className="flex items-center gap-2">
          {menus.map((menu) => (
            <Link 
              key={menu.name}
              to={menu.to} 
              className={navigationMenuTriggerStyle()}
            >
              {menu.name}
            </Link>
          ))}
        </div>
      </div>
      {isLoggedIn ? (
        <div className="flex items-center">
          <Button size="icon" variant="ghost" asChild className="relative">
            <Link to="/auth/logout">Logout
            <LogOutIcon className="size-4" />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-4">
          <Button asChild variant="secondary">
            <Link to="/auth/login">Login</Link>
          </Button>
          <Button asChild >
            <Link to="/auth/join">Join</Link>
          </Button>
        </div>
      )}
    </nav>
  );
}