"use client";

import { ThemeContext } from "@/take-home-checker/components/ThemeContext";
import Link from "next/link";
import React, { useState } from "react";
import { FaGithub } from "react-icons/fa";
import { HiMenu, HiMoon, HiSun, HiX } from "react-icons/hi";
import LogOutGithub from "./LogOutGithub";

const Header = () => {
  const { isDark, setIsDark } = React.useContext(ThemeContext);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="border-b dark:border-gray-700 dark:bg-gray-800">
      <nav className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl flex gap-2 items-center text-nowrap text-sm dark:text-white hover:text-black/80 dark:hover:text-white/80 cursor-pointer hover:text-indigo-300"
          target="_blank"
          rel="noopener noreferrer"
        >
          Take Home Checker
        </Link>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="lg:hidden p-2 rounded-md text-gray-600 dark:text-gray-300 focus:outline-none focus:ring"
        >
          {isMobileMenuOpen ? (
            <HiX className="w-6 h-6" />
          ) : (
            <HiMenu className="w-6 h-6" />
          )}
        </button>

        {/* Desktop Menu */}
        <div className="hidden lg:flex items-center space-x-6">
          <Link
            href="https://jobs.ashbyhq.com/Silver?utm_source=Pedw1mQEZd"
            className="text-sm dark:text-white hover:text-indigo-300"
            target="_blank"
            rel="noopener noreferrer"
          >
            Jobs
          </Link>
          <Link
            href="https://ready.silver.dev/"
            className="text-sm dark:text-white hover:text-indigo-300"
            target="_blank"
            rel="noopener noreferrer"
          >
            Interview Ready
          </Link>
          <Link
            href="privacy"
            className="text-sm dark:text-white hover:text-indigo-300"
          >
            Privacy Policy
          </Link>
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {isDark ? (
              <HiSun className="w-5 h-5 text-gray-300" />
            ) : (
              <HiMoon className="w-5 h-5 text-gray-600" />
            )}
          </button>
          <Link
            href="https://github.com/conanbatt/takehome-checker"
            className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            target="_blank"
            rel="noopener noreferrer"
          >
            <FaGithub className="w-5 h-5" />
          </Link>
          <LogOutGithub />
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden flex flex-col items-center bg-white dark:bg-gray-800 border-t dark:border-gray-700 py-4 space-y-4">
          <Link
            href="https://jobs.ashbyhq.com/Silver?utm_source=Pedw1mQEZd"
            className="text-sm dark:text-white hover:text-indigo-300"
          >
            Jobs
          </Link>
          <Link
            href="https://ready.silver.dev/"
            className="text-sm dark:text-white hover:text-indigo-300"
          >
            Interview Ready
          </Link>
          <Link
            href="privacy"
            className="text-sm dark:text-white hover:text-indigo-300"
          >
            Privacy Policy
          </Link>
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            {isDark ? (
              <HiSun className="w-5 h-5 text-gray-300" />
            ) : (
              <HiMoon className="w-5 h-5 text-gray-600" />
            )}
          </button>
          <a
            href="#"
            className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
          >
            <FaGithub className="w-5 h-5" />
          </a>
          <LogOutGithub />
        </div>
      )}
    </header>
  );
};

export default Header;
