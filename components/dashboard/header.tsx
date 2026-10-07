import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { DisplayUser } from "@/lib/auth/user";
import { Sidebar } from "./sidebar";
import { UserMenu } from "./user-menu";

export function Header({ title, user }: { title: string; user: DisplayUser }) {
  return (
    <header className="flex h-14 items-center gap-3 border-b px-4">
      <Sheet>
        <SheetTrigger
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label="Abrir menu"
              className="md:hidden"
            />
          }
        >
          <Menu aria-hidden />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <Sidebar />
        </SheetContent>
      </Sheet>
      <p className="font-medium">{title}</p>
      <div className="ml-auto">
        <UserMenu user={user} />
      </div>
    </header>
  );
}
