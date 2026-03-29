import { AppSidebar } from "@/components/app-sidebar";
import Navbar from "@/components/Navbar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AuthProvider } from "@/context/AuthProvider";

export default function DashboardLayout({ children }) {
          return (
                    // <AuthProvider>
                              <SidebarProvider>
                                        <AppSidebar />
                                        {/* Main wrapper ko h-screen aur overflow-hidden kiya */}
                                        <main className="relative flex flex-col flex-1 h-screen overflow-hidden w-full no-scrollbar">

                                                  {/* Navbar ko top par fix karne ke liye yaha sticky handle karenge */}
                                                  <div className="flex-none">
                                                            <Navbar />
                                                  </div>

                                                  {/* Sirf niche wala content area scroll hoga */}
                                                  <div className="flex-1 overflow-y-auto no-scrollbar">
                                                            {children}
                                                  </div>

                                        </main>
                              </SidebarProvider>
                    // </AuthProvider>
          );
}