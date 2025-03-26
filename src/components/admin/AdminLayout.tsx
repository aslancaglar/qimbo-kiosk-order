
import { ReactNode } from 'react';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarHeader, 
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { BarChart, Settings, ShoppingBag, PanelRight, LogOut } from "lucide-react";
import { NavLink, useNavigate } from 'react-router-dom';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const navigate = useNavigate();
  
  const handleLogout = () => {
    // In a real app, this would handle authentication logout
    navigate('/');
  };
  
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <Sidebar className="border-r border-gray-200">
          <SidebarHeader className="px-6 py-3">
            <h2 className="text-xl font-bold">Admin Panel</h2>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Management</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to="/admin" 
                        end
                        className={({ isActive }) => 
                          isActive ? "text-primary font-medium" : "text-gray-500 hover:text-gray-900"
                        }
                      >
                        <BarChart className="h-5 w-5" />
                        <span>Dashboard</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to="/admin/orders" 
                        className={({ isActive }) => 
                          isActive ? "text-primary font-medium" : "text-gray-500 hover:text-gray-900"
                        }
                      >
                        <ShoppingBag className="h-5 w-5" />
                        <span>Orders</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to="/admin/menu" 
                        className={({ isActive }) => 
                          isActive ? "text-primary font-medium" : "text-gray-500 hover:text-gray-900"
                        }
                      >
                        <PanelRight className="h-5 w-5" />
                        <span>Menu Items</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to="/admin/settings" 
                        className={({ isActive }) => 
                          isActive ? "text-primary font-medium" : "text-gray-500 hover:text-gray-900"
                        }
                      >
                        <Settings className="h-5 w-5" />
                        <span>Settings</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          
          <SidebarFooter className="border-t border-gray-200 p-4">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 text-gray-500 hover:text-gray-900 w-full px-3 py-2 rounded-md hover:bg-gray-100"
            >
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </button>
          </SidebarFooter>
        </Sidebar>
        
        <div className="flex-1 overflow-auto">
          <div className="flex items-center p-4 border-b border-gray-200 bg-white">
            <SidebarTrigger />
            <h1 className="text-xl font-semibold ml-4">Restaurant Admin</h1>
          </div>
          <main className="p-6">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default AdminLayout;
