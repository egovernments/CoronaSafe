import clsx from "clsx";
import React, { lazy, Suspense, useContext, useEffect } from "react";
import { Redirect, Route, Switch, useLocation } from "react-router-dom";

import ErrorBoundary from "../components/ErrorBoundary";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";
import ThemedSuspense from "../components/ThemedSuspense";
import { SidebarContext } from "../context/SidebarContext";
import routes from "../routes";
import Main from "./Main";

const Page404 = lazy(() => import("../pages/404"));

function Layout() {
  const { isSidebarOpen, closeSidebar } = useContext(SidebarContext);
  const location = useLocation();

  useEffect(() => {
    closeSidebar();
  }, [location]);

  return (
    <div
      className={clsx(
        "flex h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 ease-linear",
        isSidebarOpen && "overflow-hidden"
      )}
    >
      <Sidebar />
      <div className="flex flex-1 flex-col w-full">
        <Header />
        <Main>
          <ErrorBoundary>
            <Suspense fallback={<ThemedSuspense />}>
              <Switch>
                {routes.map((route, i) => {
                  return route.component ? (
                    <Route
                      key={i}
                      exact
                      path={route.path}
                      render={(props) => <route.component {...props} />}
                    />
                  ) : null;
                })}
                <Redirect exact from="/" to="/district" />
                <Route component={Page404} />
              </Switch>
            </Suspense>
          </ErrorBoundary>
        </Main>
      </div>
    </div>
  );
}

export default Layout;
