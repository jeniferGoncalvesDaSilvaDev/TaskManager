import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, ListTodo, PlusCircle, Upload, Tags, Menu, X, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { DeadlineBanner } from "./deadline-banner";
import { ThemeToggle } from "./theme-toggle";

const navItems = [
  { href: "/", label: "Painel", icon: LayoutDashboard },
  { href: "/tasks", label: "Tarefas", icon: ListTodo },
  { href: "/tasks/new", label: "Nova Tarefa", icon: PlusCircle },
  { href: "/import", label: "Importar", icon: Upload },
  { href: "/categories", label: "Categorias", icon: Tags },
  { href: "/reports", label: "Relatorio", icon: BarChart2 },
];

function NavLinks({ onClose }: { onClose?: () => void }) {
  const [location] = useLocation();
  return (
    <>
      {navItems.map((item) => {
        const isActive =
          location === item.href ||
          (item.href !== "/" && location.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </>
  );
}

function Sidebar() {
  return (
    <div className="w-64 border-r border-border bg-card h-full flex flex-col">
      <div className="p-6 border-b border-border">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
            T
          </div>
          <span className="font-bold text-xl tracking-tight">Triagem</span>
        </Link>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <NavLinks />
      </nav>
      <div className="p-4 border-t border-border flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Painel de controle pessoal.</span>
        <ThemeToggle />
      </div>
    </div>
  );
}

function MobileHeader({ onOpen }: { onOpen: () => void }) {
  return (
    <header className="flex items-center justify-between px-4 py-3 border-b border-border bg-card md:hidden">
      <Link href="/" className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
          T
        </div>
        <span className="font-bold text-lg tracking-tight">Triagem</span>
      </Link>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <button
          onClick={onOpen}
          className="p-2 rounded-md hover:bg-secondary transition-colors"
          aria-label="Abrir menu"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>
    </header>
  );
}

function Drawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/50 md:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="fixed inset-y-0 left-0 z-50 w-72 bg-card border-r border-border flex flex-col md:hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <Link href="/" onClick={onClose} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
              T
            </div>
            <span className="font-bold text-xl tracking-tight">Triagem</span>
          </Link>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-secondary transition-colors"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavLinks onClose={onClose} />
        </nav>
        <div className="p-4 border-t border-border text-xs text-muted-foreground">
          Painel de controle pessoal.
        </div>
      </div>
    </>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar />
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <MobileHeader onOpen={() => setDrawerOpen(true)} />
        <DeadlineBanner />
        <main className="flex-1 overflow-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
