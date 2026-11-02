import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Package,
  ShoppingBag,
  PlusCircle,
  Truck,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  CreditCard,
  User,
  ShieldCheck,
  Search,
  ExternalLink
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { toggleSidebar, setMobileMenuOpen, addToast } from '../../store/slices/uiSlice';
import { logoutThunk } from '../../store/slices/authSlice';
import { ToastContainer } from '../ui/ToastContainer';
import { cn } from '../../lib/utils';
import { Badge } from '../ui/Badge';

export const Layout: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { sidebarCollapsed, mobileMenuOpen } = useAppSelector((state) => state.ui);
  const { user } = useAppSelector((state) => state.auth);

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navItems = [
    {
      to: '/products',
      label: 'Products Catalog',
      icon: <Package className="w-5 h-5 shrink-0" />,
      badge: 'Live'
    },
    {
      to: '/orders',
      label: 'Orders & Dispatch',
      icon: <ShoppingBag className="w-5 h-5 shrink-0" />,
    },
    {
      to: '/orders/create',
      label: 'Create Direct Order',
      icon: <PlusCircle className="w-5 h-5 shrink-0" />,
      highlight: true
    },
    {
      to: '/orders/serviceability',
      label: 'Logistics Serviceability',
      icon: <Truck className="w-5 h-5 shrink-0" />,
    },
  ];

  const handleLogout = async () => {
    await dispatch(logoutThunk());
    dispatch(addToast({ type: 'info', title: 'Signed Out', message: 'You have been safely logged out.' }));
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col antialiased text-slate-800">
      <ToastContainer />

      {/* Mobile Drawer Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={() => dispatch(setMobileMenuOpen(false))}
        />
      )}

      {/* Main App Container */}
      <div className="flex-1 flex w-full">
        {/* Desktop Sidebar */}
        <aside
          className={cn(
            'hidden lg:flex flex-col bg-white border-r border-slate-200/80 transition-all duration-300 z-30 sticky top-0 h-screen select-none',
            sidebarCollapsed ? 'w-20' : 'w-64'
          )}
        >
          {/* Brand Header */}
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
            <div className={cn('flex items-center gap-3 overflow-hidden', sidebarCollapsed && 'justify-center w-full')}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20 shrink-0">
                <Package className="w-5 h-5" />
              </div>
              {!sidebarCollapsed && (
                <div className="flex flex-col">
                  <span className="font-bold text-slate-900 tracking-tight text-lg flex items-center gap-1.5">
                    DropFlow
                    <span className="text-[10px] font-semibold bg-brand-50 text-brand-700 px-1.5 py-0.5 rounded uppercase tracking-wider">
                      Seller
                    </span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium -mt-0.5">B2B Dropship Commerce</span>
                </div>
              )}
            </div>
          </div>

          {/* Nav Links */}
          <div className="flex-1 px-3 py-6 space-y-1.5 overflow-y-auto">
            {!sidebarCollapsed && (
              <p className="px-3 text-[11px] font-bold tracking-wider text-slate-400 uppercase mb-2">
                Merchant Portal
              </p>
            )}

            {navItems.map((item) => {
              const isActive = location.pathname === item.to || (item.to !== '/products' && location.pathname.startsWith(item.to));
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative',
                    isActive
                      ? 'bg-brand-50/80 text-brand-700 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70',
                    sidebarCollapsed && 'justify-center px-0'
                  )}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <span
                    className={cn(
                      'transition-colors',
                      isActive ? 'text-brand-600' : 'text-slate-400 group-hover:text-slate-600',
                      item.highlight && !isActive && 'text-brand-600'
                    )}
                  >
                    {item.icon}
                  </span>
                  {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
                  {!sidebarCollapsed && item.badge && (
                    <span className="ml-auto text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.2 rounded-full">
                      {item.badge}
                    </span>
                  )}
                  {sidebarCollapsed && isActive && (
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-brand-600 rounded-l-full" />
                  )}
                </NavLink>
              );
            })}
          </div>

          {/* Quick Wallet / Tier Preview */}
          {!sidebarCollapsed && (
            <div className="p-4 mx-3 mb-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 to-slate-50 border border-brand-100/60">
              <div className="flex items-center justify-between text-xs text-brand-900 font-medium mb-1">
                <span className="flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-brand-600" />
                  Fulfillment Credit
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.5 rounded">
                  Active
                </span>
              </div>
              <div className="text-lg font-bold text-slate-900">₹{((user?.walletBalance || 25000)).toLocaleString('en-IN')}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Prepaid dispatch balance ready</p>
            </div>
          )}

          {/* User profile footer & collapse trigger */}
          <div className="p-3 border-t border-slate-100 flex items-center justify-between gap-2">
            {!sidebarCollapsed ? (
              <div className="flex items-center gap-3 min-w-0 flex-1 px-1">
                <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-600 font-semibold text-sm shrink-0">
                  {user?.fullName?.charAt(0) || user?.businessName?.charAt(0) || 'S'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-900 truncate">
                    {user?.fullName || user?.businessName || 'Verified Partner'}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" />
                    Verified Dropshipper
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                title="Sign out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={() => dispatch(toggleSidebar())}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors hidden lg:flex items-center justify-center"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>
        </aside>

        {/* Mobile Slide-over Drawer */}
        <aside
          className={cn(
            'fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-2xl flex flex-col lg:hidden transition-transform duration-300 ease-in-out',
            mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-brand-600 flex items-center justify-center text-white">
                <Package className="w-5 h-5" />
              </div>
              <span className="font-bold text-slate-900 text-lg">DropFlow</span>
            </div>
            <button
              onClick={() => dispatch(setMobileMenuOpen(false))}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to || (item.to !== '/products' && location.pathname.startsWith(item.to));
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => dispatch(setMobileMenuOpen(false))}
                  className={cn(
                    'flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium transition-all',
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  <span className={isActive ? 'text-brand-600' : 'text-slate-400'}>{item.icon}</span>
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>

          <div className="p-4 border-t border-slate-100">
            <button
              onClick={() => {
                dispatch(setMobileMenuOpen(false));
                handleLogout();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-sm font-medium transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Glassmorphic Top Header */}
          <header className="sticky top-0 z-20 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => dispatch(setMobileMenuOpen(true))}
                className="p-2 text-slate-600 hover:text-slate-900 rounded-lg lg:hidden"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-medium">
                <span>DropFlow</span>
                <span>/</span>
                <span className="text-slate-700 capitalize font-semibold">
                  {location.pathname.split('/')[1] || 'Dashboard'}
                </span>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/orders/serviceability')}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/70 text-slate-700 text-xs font-semibold transition-colors border border-slate-200/60"
              >
                <Truck className="w-3.5 h-3.5 text-brand-600" />
                Check Pincode
              </button>

              <button
                onClick={() => navigate('/orders/create')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-xs transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                New Order
              </button>

              <div className="h-5 w-px bg-slate-200" />

              {/* User Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 font-bold text-xs flex items-center justify-center">
                    {user?.fullName?.charAt(0) || 'S'}
                  </div>
                  <span className="text-xs font-semibold text-slate-700 hidden md:inline truncate max-w-[120px]">
                    {user?.businessName || user?.fullName || 'Seller Store'}
                  </span>
                </button>

                {userDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-slate-200/90 shadow-xl py-2 z-50 text-xs"
                    onClick={() => setUserDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="font-semibold text-slate-900">{user?.fullName || 'Dropshipper'}</p>
                      <p className="text-slate-400 text-[11px] truncate">{user?.email || 'seller@dropflow.in'}</p>
                    </div>
                    <div className="px-2 py-1">
                      <button
                        onClick={() => navigate('/orders')}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors text-left"
                      >
                        <ShoppingBag className="w-4 h-4 text-slate-400" />
                        My Orders
                      </button>
                      <button
                        onClick={() => navigate('/orders/serviceability')}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors text-left"
                      >
                        <Truck className="w-4 h-4 text-slate-400" />
                        Logistics Checker
                      </button>
                    </div>
                    <div className="border-t border-slate-100 px-2 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors text-left font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </header>

          {/* Main View Router */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

