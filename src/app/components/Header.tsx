import { Search, Settings, HelpCircle, LogOut, User, Menu, Sun, Moon, Sparkles } from "lucide-react";
import { Input } from "@/app/components/ui/input";
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router";
import { authService } from "@/services/api/auth";
import { useSidebar } from "@/app/components/Layout";
import { NotificationBell } from "@/app/components/notifications/NotificationBell";
import { AiAssistantChat } from "@/app/components/AiAssistantChat";
import { useTranslation } from "react-i18next";

interface SearchResult {
  title: string;
  path: string;
  category: string;
}

const searchablePages: SearchResult[] = [
  // Main pages
  { title: "Dashboard", path: "/", category: "Main" },
  { title: "My Tasks", path: "/my-tasks", category: "Main" },
  { title: "Tests", path: "/tests", category: "Main" },
  { title: "Reports", path: "/reports", category: "Main" },
  
  // Compliance
  { title: "Frameworks", path: "/compliance/frameworks", category: "Compliance" },
  { title: "Available Frameworks", path: "/compliance/frameworks", category: "Compliance" },
  { title: "Controls", path: "/compliance/controls", category: "Compliance" },
  { title: "Policies", path: "/compliance/policies", category: "Compliance" },
  { title: "Documents", path: "/compliance/documents", category: "Compliance" },
  { title: "Audits", path: "/compliance/audits", category: "Compliance" },
  
  // Risk Management
  { title: "Risk Overview", path: "/risk/overview", category: "Risk" },
  { title: "Risks", path: "/risk/risks", category: "Risk" },
  { title: "Risk Library", path: "/risk/library", category: "Risk" },
  { title: "Action Tracker", path: "/risk/action-tracker", category: "Risk" },
  { title: "Risk Snapshot", path: "/risk/snapshot", category: "Risk" },
  { title: "Risk Engine", path: "/risk/engine", category: "Risk" },
  
  // Customer Trust
  { title: "Trust Overview", path: "/customer-trust/overview", category: "Customer Trust" },
  { title: "Trust Accounts", path: "/customer-trust/accounts", category: "Customer Trust" },
  { title: "Trust Center", path: "/customer-trust/trust-center", category: "Customer Trust" },
  { title: "Commitments", path: "/customer-trust/commitments", category: "Customer Trust" },
  { title: "Knowledge Base", path: "/customer-trust/knowledge-base", category: "Customer Trust" },
  
  // Personnel
  { title: "Linked Accounts", path: "/personnel/access", category: "Personnel" },
  { title: "Access Management", path: "/personnel/access", category: "Personnel" },
  { title: "Access Reviews", path: "/personnel/access", category: "Personnel" },
  { title: "Computers", path: "/personnel/computers", category: "Personnel" },

  // AI
  { title: "AI Chat Assistant", path: "/ai/chat", category: "AI" },
  { title: "AI Settings", path: "/settings/ai", category: "Settings" },
  { title: "Questionnaire AI", path: "/ai/questionnaire-assistant", category: "AI" },

  // Other
  { title: "Vendors", path: "/vendors", category: "Operations" },
  { title: "Assets Inventory", path: "/assets/inventory", category: "Assets" },
  { title: "Code Changes", path: "/assets/code-changes", category: "Assets" },
  { title: "Vulnerabilities", path: "/assets/vulnerabilities", category: "Assets" },
  { title: "Integrations", path: "/integrations", category: "Settings" },
  { title: "Notifications", path: "/notifications", category: "Main" },
];

export function Header() {
  const { t } = useTranslation('common');
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredResults, setFilteredResults] = useState<SearchResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const { toggle: toggleSidebar, collapsed } = useSidebar();

  const [aiChatOpen, setAiChatOpen] = useState(false);
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  );

  const toggleTheme = useCallback(() => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("manzen.theme", next ? "dark" : "light");
  }, [isDark]);

  const handleLogout = () => {
    authService.logout();
    authService.clearCachedUser();
    navigate("/login");
  };

  const cachedUser = authService.getCachedUser();

  useEffect(() => {
    if (searchQuery.length >= 2) {
      const filtered = searchablePages.filter(page =>
        page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        page.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredResults(filtered.slice(0, 8)); // Limit to 8 results
      setShowSuggestions(true);
    } else {
      setFilteredResults([]);
      setShowSuggestions(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (path: string) => {
    navigate(path);
    setSearchQuery("");
    setShowSuggestions(false);
  };

  return (
    <header className="bg-card border-b border-border px-3 sm:px-6 py-3">
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Navigation toggle — mobile drawer + desktop collapse */}
        <button
          onClick={toggleSidebar}
          className="p-2 text-muted-foreground hover:bg-accent rounded-md flex-shrink-0"
          aria-label={collapsed ? t('header.expandSidebar') : t('header.collapseSidebar')}
          title={collapsed ? t('header.expandSidebar') : t('header.collapseSidebar')}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search — hidden on xs, visible from sm */}
        <div className="hidden sm:block flex-1 max-w-xl" ref={searchRef}>
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground/70 z-10" />
            <Input
              type="text"
              placeholder={t('header.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && filteredResults.length > 0) {
                  handleSearch(filteredResults[0]!.path);
                }
              }}
              className="pl-10 pr-4"
            />
            
            {showSuggestions && filteredResults.length > 0 && (
              <div className="absolute top-full mt-1 w-full bg-card border border-border rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
                <div className="py-2">
                  {filteredResults.map((result) => (
                    <button
                      key={result.path}
                      className="w-full px-4 py-3 text-left hover:bg-muted flex items-center justify-between group transition-colors"
                      onClick={() => handleSearch(result.path)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-foreground group-hover:text-primary">
                            {result.title}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {result.category}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground/70 group-hover:text-primary">
                        {result.path}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 ml-auto flex-shrink-0">
          <button
            onClick={() => setAiChatOpen((prev) => !prev)}
            className="relative p-2 text-muted-foreground hover:bg-accent rounded-md"
            title={t('header.aiAssistant')}
            aria-label={t('header.toggleAiAssistant')}
          >
            <Sparkles className="w-5 h-5" />
            <span className="absolute top-1 right-1 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
          </button>

          <button className="hidden sm:flex relative p-2 text-muted-foreground hover:bg-accent rounded-md" title={t('header.help')}>
            <HelpCircle className="w-5 h-5" />
          </button>

          <button
            onClick={toggleTheme}
            className="p-2 text-muted-foreground hover:bg-accent rounded-md"
            title={isDark ? t('header.switchToLight') : t('header.switchToDark')}
            aria-label={t('header.toggleDarkMode')}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>

          <NotificationBell />

          <button
            onClick={() => navigate("/settings/profile")}
            className="hidden sm:flex p-2 text-muted-foreground hover:bg-accent rounded-md"
            title={t('header.settings')}
            aria-label={t('header.openSettings')}
          >
            <Settings className="w-5 h-5" />
          </button>

          {/* User info + logout */}
          <div className="flex items-center gap-1 sm:gap-2 pl-2 sm:ml-2 sm:pl-2 border-l border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              {cachedUser && (
                <span className="text-sm font-medium text-foreground hidden md:block max-w-[120px] truncate">
                  {cachedUser.name || cachedUser.email}
                </span>
              )}
            </div>
            <button
              onClick={handleLogout}
              title={t('header.signOut')}
              className="p-2 text-muted-foreground hover:bg-red-50 hover:text-red-600 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <AiAssistantChat open={aiChatOpen} onClose={() => setAiChatOpen(false)} />
    </header>
  );
}
