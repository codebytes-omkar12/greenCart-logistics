import React from 'react';
import { NavLink } from 'react-router-dom';

const navLinks = [
  { name: 'Dashboard', path: '/' },
  { name: 'Drivers', path: '/drivers' },
  { name: 'Routes', path: '/routes' },
  { name: 'Orders', path: '/orders' },
  { name: 'Simulations', path: '/simulations' },
];

const Navbar: React.FC = () => {
  const activeLinkClass = "bg-gray-900 text-white";
  const defaultLinkClass = "text-gray-300 hover:bg-gray-700 hover:text-white";

  return (
    <nav className="bg-gray-800 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-white text-xl font-bold">GreenCart</span>
            <div className="hidden md:block ml-10">
              <div className="flex items-baseline space-x-4">
                {navLinks.map((link) => (
                  <NavLink key={link.name} to={link.path} end className={({ isActive }) => `${isActive ? activeLinkClass : defaultLinkClass} px-3 py-2 rounded-md text-sm font-medium`}>
                    {link.name}
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
