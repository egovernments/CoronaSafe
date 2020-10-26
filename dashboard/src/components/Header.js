import { WindmillContext } from "@saanuregh/react-ui";
import React, { useContext } from "react";
import { LogOut, Menu, Moon, Sun } from "react-feather";
import { useHistory } from "react-router-dom";

import { ReactComponent as CoronaSafeLogo } from "../assets/icons/coronaSafeLogo.svg";
import { AuthContext } from "../context/AuthContext";
import { SidebarContext } from "../context/SidebarContext";

function Header() {
  const { auth, logout } = useContext(AuthContext);
  const { mode, toggleMode } = useContext(WindmillContext);
  const { toggleSidebar } = useContext(SidebarContext);
  const history = useHistory();

  return (
    <header className="z-40 h-12 py-2 overflow-hidden bg-white shadow-md dark:bg-gray-800">
      <div className="flex justify-between px-2 text-green-500 dark:text-green-400 container mx-auto">
        <div className="flex justify-between flex-shrink-0">
          <button
            type="button"
            className="p-1 mr-2 md:mr-6 rounded-md focus:outline-none focus:shadow-outline-green"
            onClick={toggleSidebar}
            aria-label="Menu"
          >
            <Menu className="w-5 h-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Care Dashboard"
            className="mr-1 hidden md:block"
            onClick={() => {
              history.push("/");
            }}
          >
            <span className="flex text-2xl subpixel-antialiased font-black leading-none">
              Dashboard
            </span>
          </button>
          <button type="button" aria-label="CoronaSafe">
            <CoronaSafeLogo className="w-24 h-6 " aria-hidden="true" />
          </button>
        </div>
        <div className="flex justify-between flex-shrink-0 space-x-6">
          <div className="flex flex-col leading-none text-right md:block hidden">
            <p className="text-sm font-medium">
              {auth.userData.first_name} {auth.userData.last_name}
            </p>
            <p className="text-xs">{auth.userData.username}</p>
          </div>
          <button
            type="button"
            className="p-1 rounded-md focus:outline-none focus:shadow-outline-green"
            onClick={toggleMode}
            aria-label="Toggle color mode"
          >
            {mode === "dark" ? (
              <Sun className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Moon className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
          <button
            type="button"
            className="p-1 rounded-md focus:outline-none focus:shadow-outline-green"
            onClick={() => logout()}
            aria-label="Logout"
          >
            <LogOut className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
