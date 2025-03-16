import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { Dialog } from '@headlessui/react';
import {
  Bars3Icon,
  XMarkIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  Cog6ToothIcon,
  HomeIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Home', href: '/', icon: HomeIcon },
  { name: 'Chat', href: '/chat', icon: ChatBubbleLeftRightIcon },
  { name: 'Knowledge Base', href: '/knowledge-base', icon: DocumentTextIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Mobile sidebar */}
      <Dialog as="div" className="md:hidden" open={sidebarOpen} onClose={setSidebarOpen}>
        <div className="fixed inset-0 z-40 flex">
          <Dialog.Panel className="fixed inset-y-0 left-0 w-full max-w-xs bg-white shadow-xl flex flex-col">
            <div className="h-16 flex items-center justify-between px-4 bg-primary-600">
              <div className="text-white text-xl font-bold">DeepTalk</div>
              <button
                type="button"
                className="-mr-2 text-white"
                onClick={() => setSidebarOpen(false)}
              >
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
              <nav className="space-y-1 px-2">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href || 
                    (item.href !== '/' && location.pathname.startsWith(item.href));
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center px-3 py-2 text-base font-medium rounded-md ${isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon
                        className={`mr-3 h-6 w-6 ${isActive ? 'text-primary-700' : 'text-gray-400 group-hover:text-gray-500'}`}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
            <div className="h-16 flex items-center justify-center bg-primary-600 text-white text-xl font-bold">
              DeepTalk
            </div>
            <div className="flex-1 overflow-y-auto py-4">
              <nav className="space-y-1 px-2">
                {navigation.map((item) => {
                  const isActive = location.pathname === item.href || 
                    (item.href !== '/' && location.pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                        }`}
                    >
                      <item.icon
                        className={`mr-3 h-5 w-5 ${isActive ? 'text-primary-700' : 'text-gray-400 group-hover:text-gray-500'}`}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900"
            onClick={() => setSidebarOpen(true)}
          >
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
