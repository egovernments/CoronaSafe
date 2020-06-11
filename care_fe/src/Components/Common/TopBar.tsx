import React from "react";

const img =
  "https://cdn.coronasafe.network/black-logo.svg";
const TopBar = () => {
  return (
    <div className="bg-white shadow-md">
      <div className="max-w-6xl mx-auto py-4 px-2">
        <div>
          <a href={"/"}>
            <img src={img} style={{ height: "25px" }} alt="care logo" />{" "}
          </a>
        </div>
      </div>
    </div>
  );
};

export default TopBar;
