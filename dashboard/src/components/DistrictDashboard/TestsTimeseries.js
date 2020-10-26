import React, { useContext } from "react";
import useSWR from "swr";

import { AuthContext } from "../../context/AuthContext";
import { careSummary } from "../../utils/api";
import { TESTS_TYPES } from "../../utils/constants";
import {
  dateString,
  getNDateAfter,
  processFacilities,
} from "../../utils/utils";
import TimeseriesLineChart from "../Chart/TimeseriesLineChart";
import NoData from "../NoData";

function TestsTimeseries({ filterDistrict, filterFacilityTypes, dates }) {
  const { auth } = useContext(AuthContext);
  const { data } = useSWR(
    ["TestsTimeseries", dates, auth.token, filterDistrict.id],
    (url, dates, token, district) =>
      careSummary(
        token,
        "tests",
        dateString(dates[0]),
        dateString(getNDateAfter(dates[1], 1)),
        district
      ).then((r) => r)
  );

  const filtered = processFacilities(data.results, filterFacilityTypes);
  const datewise = filtered.reduce((acc, cur) => {
    if (acc[cur.date]) {
      Object.keys(TESTS_TYPES).forEach((k) => {
        acc[cur.date][k] += cur[k];
        acc[cur.date][k] += cur[k];
      });
      return acc;
    }
    const _t = {
      result_awaited: 0,
      test_discarded: 0,
      total_patients: 0,
      result_negative: 0,
      result_positive: 0,
    };
    Object.keys(TESTS_TYPES).forEach((k) => {
      _t[k] += cur[k];
      _t[k] += cur[k];
    });
    return {
      ...acc,
      [cur.date]: _t,
    };
  }, {});
  const chartable = {
    name: "Tests",
    data: Object.entries(datewise)
      .reverse()
      .map(([d, value]) => ({
        date: d,
        ...value,
      })),
  };
  return (
    <div className="min-w-full min-h-full">
      {filtered.length > 0 ? (
        <TimeseriesLineChart
          name={chartable.name}
          data={chartable.data}
          dataKeys={[
            "result_awaited",
            "test_discarded",
            "total_patients",
            "result_negative",
            "result_positive",
          ]}
          colors={[
            "var(--color-green-500)",
            "var(--color-red-500)",
            "var(--color-yellow-500)",
            "var(--color-purple-500)",
            "var(--color-blue-500)",
          ]}
        />
      ) : (
        <NoData />
      )}
    </div>
  );
}

export default TestsTimeseries;
