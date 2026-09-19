import React from 'react';
import {
  LayoutDashboard,
  Activity,
  Box,
  HeartPulse,
  Cpu,
  Compass,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export type NavigationTab =
  | 'dashboard'
  | 'telemetry'
  | 'digital-twin'
  | 'health-alerts'
  | 'analysis'
  | 'mission'
  | 'reports'
  | 'settings';

interface SidebarProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  collapsed,
  onToggleCollapse
}) => {
  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'telemetry', label: 'Live Telemetry', icon: Activity },
    { id: 'digital-twin', label: 'Digital Twin', icon: Box, badge: '3D' },
    { id: 'health-alerts', label: 'Health & Alerts', icon: HeartPulse },
    { id: 'analysis', label: 'Analysis', icon: Cpu },
    { id: 'mission', label: 'Mission', icon: Compass },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings }
  ];

  return (
    <aside
      className={`h-[calc(100vh-53px)] bg-[#0a101c] border-r border-slate-800/80 flex flex-col justify-between transition-all duration-200 select-none z-20 sticky top-[53px] ${
        collapsed ? 'w-16' : 'w-56'
      }`}
    >
      {/* Navigation Links */}
      <div className="py-3 px-2 space-y-1">
        <div className={`px-2 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold ${collapsed ? 'text-center' : ''}`}>
          {collapsed ? 'SYS' : 'NAVIGATION'}
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-2.5 py-2 rounded-md font-sans text-xs font-medium transition-all group relative ${
                isActive
                  ? 'bg-blue-600/20 text-white border border-blue-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              {/* Active subtle left accent indicator */}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-cyan-400" />
              )}

              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-300'
                }`}
              />

              {!collapsed && (
                <div className="flex items-center justify-between flex-1 truncate">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom Technical Status & Collapse toggle */}
      <div className="p-2 border-t border-slate-800/80 space-y-2 font-mono">
        {!collapsed && (
          <div className="bg-slate-900/80 p-2 rounded border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400">ENGINE MODEL:</span>
              <span className="text-slate-200 font-semibold">P4-HORIZ-OPP</span>
            </div>
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-slate-400">STATUS MAPPING:</span>
              <span className="text-emerald-400 font-medium">READY (DEMO)</span>
            </div>
          </div>
        )}

        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center gap-1 py-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors text-[11px]"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="font-sans text-[11px]">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};
