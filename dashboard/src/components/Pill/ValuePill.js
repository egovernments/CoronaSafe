import React from "react";
import { animated, config, useSpring } from "react-spring";

export function ValuePill({ title, value = 0 }) {
  const { v } = useSpring({
    from: {
      v: 0,
    },
    to: {
      v: value,
    },
    delay: 0,
    config: config.slow,
  });

  return (
    <div className="flex items-center rounded-lg shadow-xs dark:bg-gray-800 dark:text-gray-200">
      <span className="mx-2 text-sm font-medium leading-none">{title}</span>
      <div className="flex items-center h-full bg-green-500 rounded-lg">
        <animated.span className="inline-flex items-center justify-center px-3 py-1 text-sm font-medium leading-5 text-white align-bottom rounded-md shadow-xs">
          {v.interpolate((x) => Math.round(x))}
        </animated.span>
      </div>
    </div>
  );
}
