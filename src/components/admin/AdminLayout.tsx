
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Package, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  ChevronRight,
  Utensils,
  FolderTree
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [open, setOpen] = React.useState(false);
  const location = useLocation();

  const baseClasses = "flex items-center py-2 px-3 rounded-md text-sm font-medium transition-colors";
  const activeClass = "bg-primary text-primary-foreground";
  const inactiveClass = "hover:bg-muted";

  const navigation = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
    { name: 'Menu Items', href: '/admin/menu', icon: Package },
    { name: 'Categories', href: '/admin/categories', icon: FolderTree },
    { name: 'Toppings', href: '/admin/toppings', icon: Package },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
    { name: 'Kitchen Display', href: '/admin/kitchen', icon: Utensils },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar - hidden by default */}
      <aside className="hidden lg:flex flex-col w-0 border-r bg-card overflow-hidden transition-all duration-300 ease-in-out" 
             style={{ width: open ? '16rem' : '0' }}>
        <div className="p-6">
          <h1 className="text-xl font-bold">Admin Panel</h1>
        </div>
        <ScrollArea className="flex-1 py-2 px-4">
          <nav className="space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) => 
                  `${baseClasses} ${isActive ? activeClass : inactiveClass}`
                }
              >
                <item.icon className="w-5 h-5 mr-3" />
                <span>{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </ScrollArea>
        <div className="p-4 border-t">
          <Button variant="outline" className="w-full justify-start" asChild>
            <NavLink to="/">
              <LogOut className="w-5 h-5 mr-3" />
              Exit Admin
            </NavLink>
          </Button>
        </div>
      </aside>

      {/* Sidebar trigger button for desktop - always visible */}
      <Button
        variant="outline"
        size="icon"
        className="hidden lg:flex fixed left-4 top-4 z-40"
        onClick={() => setOpen(!open)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        <span className="sr-only">Toggle Menu</span>
      </Button>

      {/* Mobile sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="lg:hidden absolute left-4 top-4 z-50">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="p-6 border-b flex items-center justify-between">
            <h1 className="text-xl font-bold">Admin Panel</h1>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
              <X className="h-5 w-5" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <ScrollArea className="flex-1 py-2 px-4 h-[calc(100vh-136px)]">
            <nav className="space-y-1">
              {navigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={({ isActive }) => 
                    `${baseClasses} ${isActive ? activeClass : inactiveClass}`
                  }
                  onClick={() => setOpen(false)}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  <span>{item.name}</span>
                  <ChevronRight className="w-4 h-4 ml-auto" />
                </NavLink>
              ))}
            </nav>
          </ScrollArea>
          <div className="p-4 border-t">
            <Button variant="outline" className="w-full justify-start" asChild onClick={() => setOpen(false)}>
              <NavLink to="/">
                <LogOut className="w-5 h-5 mr-3" />
                Exit Admin
              </NavLink>
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content - now has more space */}
      <main className="flex-1 flex flex-col min-h-screen">
        <div className="flex-1 p-6 lg:p-8 lg:ml-0">
          <div className="mb-6 text-center">
            {navigation.map((item) => {
              if (location.pathname === item.href || 
                 (item.href !== '/admin' && location.pathname.startsWith(item.href))) {
                return (
                  <h1 key={item.name} className="text-2xl font-bold tracking-tight mb-4">
                    {item.name}
                  </h1>
                );
              }
              return null;
            })}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
