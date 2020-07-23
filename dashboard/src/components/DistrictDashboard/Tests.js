import React, { useContext } from "react";
import { animated, config, useSpring } from "react-spring";
import useSWR from "swr";
import { AuthContext } from "../../context/AuthContext";
import { careTestsSummary } from "../../utils/api";
import { testsTypes } from "../../utils/constants";
import { dateString, getNDateAfter, getNDateBefore } from "../../utils/utils";
import { InfoCard } from "../Cards/InfoCard";
import { SectionTitle } from "../Typography/Title";
import FacilityTable from "./FacilityTable";

function Tests({ filterDistrict, filterFacilityTypes, date }) {
  const initialFacilitiesTrivia = {
    count: 0,
    result_awaited: 0,
    test_discarded: 0,
    total_patients: 0,
    result_negative: 0,
    result_positive: 0,
  };

  const { auth } = useContext(AuthContext);
  const token = auth.token;
  const { data, error } = useSWR(
    ["Tests", date, token],
    (url, date, token) =>
      careTestsSummary(
        token,
        dateString(getNDateBefore(date, 1)),
        dateString(getNDateAfter(date, 1))
      ).then((r) => r),
    { suspense: true, loadingTimeout: 10000 }
  );

  const facilities = data.results.map(({ data, facility, created_date }) => ({
    date: dateString(new Date(created_date)),
    ...data,
    id: facility.id,
    facilityType: facility.facility_type || "Unknown",
    location: facility.location,
    modifiedDate: data.modified_date,
  }));
  const filteredFacilities = facilities.filter(
    (f) =>
      f.district === filterDistrict.name &&
      filterFacilityTypes.includes(f.facilityType)
  );
  const facilitiesTrivia = filteredFacilities.reduce(
    (a, c) => {
      let key = c.date === dateString(date) ? "current" : "previous";
      a[key].count += 1;
      Object.keys(testsTypes).forEach((k) => {
        a[key][k] += c[k];
        a[key][k] += c[k];
      });
      return a;
    },
    {
      current: JSON.parse(JSON.stringify(initialFacilitiesTrivia)),
      previous: JSON.parse(JSON.stringify(initialFacilitiesTrivia)),
    }
  );

  const { count, patients } = useSpring({
    from: { count: 0, patients: 0 },
    to: {
      count: facilitiesTrivia.current.count || 0,
      patients: facilitiesTrivia.current.total_patients || 0,
    },
    delay: 0,
    config: config.slow,
  });

  return (
    <>
      <div className="flex flex-row justify-between">
        <SectionTitle>
          <animated.span>
            {count.interpolate((x) => `Facility Count: ${Math.round(x)}`)}
          </animated.span>
        </SectionTitle>
        <SectionTitle>
          <animated.span>
            {patients.interpolate((x) => `Patient Count: ${Math.round(x)}`)}
          </animated.span>
        </SectionTitle>
      </div>
      <div className="grid gap-6 mb-8 md:grid-cols-2 xl:grid-cols-4">
        {Object.keys(testsTypes).map((k, i) => {
          if (k != "total_patients") {
            return (
              <InfoCard
                key={i}
                title={testsTypes[k]}
                value={facilitiesTrivia.current[k]}
                delta={
                  facilitiesTrivia.current[k] - facilitiesTrivia.previous[k]
                }
              />
            );
          }
        })}
      </div>

      <FacilityTable
        className="mb-8"
        columns={["Name", "Last Updated", ...Object.values(testsTypes)]}
        data={filteredFacilities.reduce((a, c) => {
          if (c.date !== dateString(date)) {
            return a;
          }
          return [
            ...a,
            [
              [c.facility_name, c.facilityType],
              c.modifiedDate,
              ...Object.keys(testsTypes).map((i) => c[i]),
            ],
          ];
        }, [])}
      ></FacilityTable>
    </>
  );
}

export default Tests;
