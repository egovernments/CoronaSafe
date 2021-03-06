import { Card, CardBody } from "@windmill/react-ui";
import clsx from "clsx";
import React from "react";
import { animated, config, useSpring } from "react-spring";

export function InfoCard({ title, value, delta = null, small = false }) {
  const { _value, _delta } = useSpring({
    from: { _value: 0, _delta: 0 },
    to: {
      _value: value,
      _delta: delta || 0,
    },
    delay: 0,
    config: config.slow,
  });
  return (
    <Card>
      <CardBody className="flex flex-col">
        <div>
          <p
            className={clsx(
              small ? "mb-1 text-xs" : "mb-2 text-sm",
              "dark:text-gray-400 text-gray-600 font-medium"
            )}
          >
            {title}
          </p>
          <div className="flex">
            <animated.p
              className={clsx(
                small ? "text-base" : "text-lg",
                "dark:text-gray-200 text-gray-700 font-semibold"
              )}
            >
              {_value.interpolate((x) => Math.round(x))}
            </animated.p>
            {delta !== null && (
              <animated.span
                className={clsx(
                  small ? "text-xs" : "text-sm",
                  "ml-2 dark:text-gray-400 text-gray-600"
                )}
              >
                {_delta.interpolate((y) => {
                  const x = Math.round(y);
                  return x === 0 ? "-" : x > 0 ? `+${x}` : x;
                })}
              </animated.span>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
