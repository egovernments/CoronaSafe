/* eslint-disable no-console */
import { Windmill } from "@windmill/react-ui";
import React, { Suspense } from "react";
import ReactDOM from "react-dom";
import { register } from "register-service-worker";

import App from "./App";
import "./assets/css/tailwind.css";
import ThemedSuspense from "./components/ThemedSuspense";
import { SidebarProvider } from "./context/SidebarContext";
import myTheme from "./utils/theme";

ReactDOM.render(
  <SidebarProvider>
    <Suspense
      fallback={
        <ThemedSuspense className="my-auto min-h-screen dark:bg-gray-900" />
      }
    >
      <Windmill usePreferences theme={myTheme}>
        <App />
      </Windmill>
    </Suspense>
  </SidebarProvider>,
  document.querySelector("#root")
);

register(`${process.env.PUBLIC_URL}service-worker.js`, {
  cached(registration) {
    console.log("Content has been cached for offline use.");
  },
  error(error) {
    console.error("Error during service worker registration:", error);
  },
  offline() {
    console.log(
      "No internet connection found. App is running in offline mode."
    );
  },
  ready(registration) {
    console.log("Service worker is active.");
  },
  registered(registration) {
    console.log("Service worker has been registered.");
  },
  updated(registration) {
    console.log("New content is available; please refresh.");
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (this.refreshing) {
        return;
      }
      this.refreshing = true;
      window.location.reload();
    });
  },
  updatefound(registration) {
    console.log("New content is downloading.");
  },
});
