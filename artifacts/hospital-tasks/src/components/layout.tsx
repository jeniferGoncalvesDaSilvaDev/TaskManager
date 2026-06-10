import React from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, ListTodo, PlusCircle, Upload, Tags } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Painel", icon: LayoutDashboard },
  { href: "/tasks", label: "Tarefas", icon: ListTodo },
  { href: "/tasks/new", label: "Nova Tarefa", icon: PlusCircle },
  { href: "/import", label: "Importar", icon: Upload },
  { href: "/categories", label: "Categorias", icon: Tags },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="w-64 border-r border-border bg-card h-full flex flex-col">
      <div className="p-6 border-b border-border">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
            T
          </div>
          <span className="font-bold text-xl tracking-tight">Triagem</span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md font-medium transition-colors",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border text-xs text-muted-foreground">
        Painel de controle pessoal.
      </div>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
