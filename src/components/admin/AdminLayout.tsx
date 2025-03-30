
import React, { useState } from 'react';
import {
  Home,
  ShoppingBag,
  Utensils,
  Coffee,
  ListOrdered,
  Layers,
  Settings,
  Printer,
  Menu
} from 'lucide-react';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from "@/components/ui/sidebar";
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const [openMobile, setOpenMobile] = useState(false);

  const navigationItems = [
    { name: 'Dashboard', href: '/admin', icon: Home },
    { name: 'Orders', href: '/admin/orders', icon: ShoppingBag },
    { name: 'Kitchen Display', href: '/admin/kitchen', icon: Utensils },
    { name: 'Menu Items', href: '/admin/menu-items', icon: Coffee },
    { name: 'Categories', href: '/admin/categories', icon: ListOrdered },
    { name: 'Toppings', href: '/admin/toppings', icon: Layers },
    { name: 'Print Settings', href: '/admin/print-settings', icon: Printer },
    { name: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <Sidebar className="bg-white border-r w-64 flex-shrink-0 hidden md:block">
          <SidebarHeader className="p-4">
            <h1 className="text-2xl font-bold">Admin Panel</h1>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.name}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.href}
                  >
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center space-x-2 px-4 py-2",
                      )}
                    >
                      <item.icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        {/* Mobile Sidebar Button */}
        <button
          onClick={() => setOpenMobile(true)}
          className="md:hidden fixed top-4 left-4 bg-white rounded-full shadow p-2 z-50"
        >
          <Menu className="w-6 h-6" />
        </button>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <header className="bg-white border-b h-16 flex items-center justify-between px-6">
            <h2 className="text-lg font-semibold">
              {navigationItems.find(item => item.href === location.pathname)?.name || 'Dashboard'}
            </h2>
          </header>

          {/* Page Content */}
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
