import React, { useCallback, useEffect, useState } from "react";
import { FacilitySelect } from "../Common/FacilitySelect";
import {
  SelectField,
  MultiSelectField,
  DateInputField,
  TextInputField,
  AutoCompleteAsyncField,
} from "../Common/HelperInputFields";
import {
  PATIENT_FILTER_ORDER,
  GENDER_TYPES,
  DISEASE_STATUS,
  PATIENT_FILTER_CATEGORY,
  PATIENT_FILTER_ADMITTED_TO,
} from "../../Common/constants";
import moment from "moment";
import { getAllLocalBody, getFacility } from "../../Redux/actions";
import { useDispatch } from "react-redux";
import { CircularProgress } from "@material-ui/core";
import { navigate } from "raviger";
const debounce = require("lodash.debounce");

const useMergeState = (initialState: any) => {
  const [state, setState] = useState(initialState);
  const setMergedState = (newState: any) =>
    setState((prevState: any) => Object.assign({}, prevState, newState));
  return [state, setMergedState];
};

export default function PatientFilterV2(props: any) {
  let { filter, onChange, closeFilter } = props;
  const [isFacilityLoading, setFacilityLoading] = useState(false);
  const [lsgBody, setLsgBody] = useState<any[]>([]);
  const [isLsgLoading, setLsgLoading] = useState(false);
  const [hasLsgSearchText, setHasLsgSearchText] = useState(false);

  const handleLsgChange = (current: any) => {
    if (!current) {
      setLsgBody([]);
      setLsgLoading(false);
      setHasLsgSearchText(false);
    }
    setFacility(current, "lsgBody");
  };

  const [filterState, setFilterState] = useMergeState({
    facility: filter.facility || "",
    lsgBody: filter.lsgBody || "",
    facility_ref: null,
    lsgBody_ref: null,
    created_date_before: filter.created_date_before || null,
    created_date_after: filter.created_date_after || null,
    modified_date_before: filter.modified_date_before || null,
    modified_date_after: filter.modified_date_after || null,
    ordering: filter.ordering,
    category: filter.category || null,
    gender: filter.gender || null,
    disease_status: filter.disease_status || null,
    age_min: filter.age_min || null,
    age_max: filter.age_max || null,
    date_of_result: filter.date_of_result || null,
    last_consultation_admission_date_before:
      filter.last_consultation_admission_date_before || null,
    last_consultation_admission_date_after:
      filter.last_consultation_admission_date_after || null,
    last_consultation_discharge_date_before:
      filter.last_consultation_discharge_date_before || null,
    last_consultation_discharge_date_after:
      filter.last_consultation_discharge_date_after || null,
    last_consultation_admitted_to_list:
      filter.last_consultation_admitted_to_list
        ? filter.last_consultation_admitted_to_list.split(",")
        : [],
    srf_id: filter.srf_id || null,
    is_vaccinated: filter.is_vaccinated || null,
    covin_id: filter.covin_id || null,
  });
  const dispatch: any = useDispatch();

  useEffect(() => {
    async function fetchData() {
      if (filter.facility) {
        setFacilityLoading(true);
        const { data: facilityData } = await dispatch(
          getFacility(filter.facility, "facility")
        );
        setFilterState({ facility_ref: facilityData });
        setFacilityLoading(false);
      }

      if (filter.lsgBody) {
        setLsgLoading(true);
        const { data: lsgRes } = await dispatch(getAllLocalBody({}));
        const lsgBodyData = lsgRes.results.map((obj: any) => ({
          id: obj.id,
          name: obj.name,
        }));
        setLsgBody(lsgBodyData);
        setFilterState({
          lsgBody_ref: lsgBodyData.filter(
            (obj: any) => obj.id.toString() === filter.lsgBody.toString()
          )[0],
        });
        setLsgLoading(false);
      }
    }
    fetchData();
  }, [dispatch]);

  const VACCINATED_FILTER = [
    { id: "", text: "Show All" },
    { id: "false", text: "Unvaccinated" },
    { id: "true", text: "Vaccinated" },
  ];

  const setFacility = (selected: any, name: string) => {
    const filterData: any = { ...filterState };
    filterData[`${name}_ref`] = selected;
    filterData[name] = (selected || {}).id;

    setFilterState(filterData);
  };

  const handleChange = (event: any) => {
    const { name, value } = event.target;

    const filterData: any = { ...filterState };
    filterData[name] = value;

    setFilterState(filterData);
  };

  const handleMultiSelectChange = (event: any) => {
    const { name, value } = event.target;

    const filterData: any = { ...filterState };
    filterData[name] = [...value];

    setFilterState(filterData);
  };

  const handleLsgSearch = (e: any) => {
    setHasLsgSearchText(!!e.target.value);
    setLsgLoading(true);
    onLsgSearch(e.target.value);
  };

  const onLsgSearch = useCallback(
    debounce(async (text: string) => {
      if (text) {
        const {
          data: { results: lsgBodies },
        } = await dispatch(getAllLocalBody({ local_body_name: text }));
        setLsgBody(lsgBodies);
        setLsgLoading(false);
      } else {
        setLsgBody([]);
        setLsgLoading(false);
      }
    }, 300),
    []
  );

  const applyFilter = () => {
    const {
      facility,
      lsgBody,
      created_date_before,
      created_date_after,
      modified_date_before,
      modified_date_after,
      ordering,
      category,
      gender,
      disease_status,
      age_min,
      age_max,
      date_of_result,
      last_consultation_admission_date_before,
      last_consultation_admission_date_after,
      last_consultation_discharge_date_before,
      last_consultation_discharge_date_after,
      last_consultation_admitted_to_list,
      is_vaccinated,
      covin_id,
      srf_id,
    } = filterState;
    const data = {
      lsgBody: lsgBody || "",
      facility: facility || "",
      created_date_before:
        created_date_before && moment(created_date_before).isValid()
          ? moment(created_date_before).format("YYYY-MM-DD")
          : "",
      created_date_after:
        created_date_after && moment(created_date_after).isValid()
          ? moment(created_date_after).format("YYYY-MM-DD")
          : "",
      modified_date_before:
        modified_date_before && moment(modified_date_before).isValid()
          ? moment(modified_date_before).format("YYYY-MM-DD")
          : "",
      modified_date_after:
        modified_date_after && moment(modified_date_after).isValid()
          ? moment(modified_date_after).format("YYYY-MM-DD")
          : "",
      date_of_result:
        date_of_result && moment(date_of_result).isValid()
          ? moment(date_of_result).format("YYYY-MM-DD")
          : "",
      last_consultation_admission_date_before:
        last_consultation_admission_date_before &&
        moment(last_consultation_admission_date_before).isValid()
          ? moment(last_consultation_admission_date_before).format("YYYY-MM-DD")
          : "",
      last_consultation_admission_date_after:
        last_consultation_admission_date_after &&
        moment(last_consultation_admission_date_after).isValid()
          ? moment(last_consultation_admission_date_after).format("YYYY-MM-DD")
          : "",
      last_consultation_discharge_date_before:
        last_consultation_discharge_date_before &&
        moment(last_consultation_discharge_date_before).isValid()
          ? moment(last_consultation_discharge_date_before).format("YYYY-MM-DD")
          : "",
      last_consultation_discharge_date_after:
        last_consultation_discharge_date_after &&
        moment(last_consultation_discharge_date_after).isValid()
          ? moment(last_consultation_discharge_date_after).format("YYYY-MM-DD")
          : "",
      ordering: ordering || "",
      category: category || "",
      gender: gender || "",
      disease_status:
        (disease_status == "Show All" ? "" : disease_status) || "",
      age_min: age_min || "",
      age_max: age_max || "",
      last_consultation_admitted_to_list:
        last_consultation_admitted_to_list || [],
      srf_id: srf_id || "",
      is_vaccinated: is_vaccinated || "",
      covin_id: covin_id || "",
    };
    onChange(data);
  };

  return (
    <div>
      <div className="flex justify-between">
        <button className="btn btn-default" onClick={closeFilter}>
          <i className="fas fa-times mr-2" />
          Cancel
        </button>
        <button
          className="btn btn-default"
          onClick={(_) => {
            navigate("/patients");
          }}
        >
          <i className="fas fa-times mr-2" />
          Clear Filter
        </button>
        <button className="btn btn-primary" onClick={applyFilter}>
          <i className="fas fa-check mr-2" />
          Apply
        </button>
      </div>
      <div className="w-64 flex-none mt-2">
        <span className="text-sm font-semibold">Ordering</span>
        <SelectField
          name="ordering"
          variant="outlined"
          margin="dense"
          optionKey="text"
          optionValue="desc"
          value={filterState.ordering}
          options={[{ desc: "Select", text: "" }, ...PATIENT_FILTER_ORDER]}
          onChange={handleChange}
          className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"
        />
      </div>
      <div className="font-light text-md mt-2">Filter By:</div>
      <div className="flex flex-wrap gap-2">
        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">LSG body</span>
          <div className="">
            <AutoCompleteAsyncField
              name="lsgBody"
              multiple={false}
              variant="outlined"
              value={filterState.lsgBody_ref}
              options={lsgBody}
              onSearch={handleLsgSearch}
              onChange={(e: object, value: any) => handleLsgChange(value)}
              loading={isLsgLoading}
              placeholder="Search by LSG body name"
              noOptionsText={
                hasLsgSearchText
                  ? "No LSG body found, please try again"
                  : "Start typing to begin search"
              }
              renderOption={(option: any) => <div>{option.name}</div>}
              freeSolo={false}
              getOptionSelected={(option: any, value: any) =>
                option.id === value.id
              }
              getOptionLabel={(option: any) => option.name}
              className="shifting-page-filter-dropdown"
            />
          </div>
        </div>
        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Facility</span>
          <div className="">
            {isFacilityLoading ? (
              <CircularProgress size={20} />
            ) : (
              <FacilitySelect
                multiple={false}
                name="facility"
                selected={filterState.facility_ref}
                showAll={false}
                setSelected={(obj) => setFacility(obj, "facility")}
                className="shifting-page-filter-dropdown"
                errors={""}
              />
            )}
          </div>
        </div>
        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Gender</span>
          <SelectField
            name="gender"
            variant="outlined"
            margin="dense"
            value={filterState.gender}
            options={[{ id: "", text: "Show All" }, ...GENDER_TYPES]}
            onChange={handleChange}
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"
          />
        </div>

        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Category</span>
          <SelectField
            name="category"
            variant="outlined"
            margin="dense"
            value={filterState.category}
            options={[{ id: "", text: "Show All" }, ...PATIENT_FILTER_CATEGORY]}
            onChange={handleChange}
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"
          />
        </div>

        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Disease Status</span>
          <SelectField
            name="disease_status"
            variant="outlined"
            margin="dense"
            optionArray={true}
            value={filterState.disease_status}
            options={["Show All", ...DISEASE_STATUS]}
            onChange={handleChange}
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"
          />
        </div>
        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Vaccinated</span>
          <SelectField
            name="is_vaccinated"
            variant="outlined"
            margin="dense"
            value={filterState.is_vaccinated}
            options={VACCINATED_FILTER}
            onChange={handleChange}
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"
          />
        </div>
        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">COVIN ID</span>
          <div className="flex justify-between">
            <TextInputField
              id="covin_id"
              name="covin_id"
              variant="outlined"
              margin="dense"
              errors=""
              value={filterState.covin_id}
              onChange={handleChange}
              label="covin id"
              className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9 mr-1"
            />
          </div>
        </div>
        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">
            Last Admitted to (Bed Type)
          </span>
          <MultiSelectField
            name="last_consultation_admitted_to_list"
            variant="outlined"
            value={filterState.last_consultation_admitted_to_list}
            options={[...PATIENT_FILTER_ADMITTED_TO]}
            onChange={handleMultiSelectChange}
          />
        </div>
        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Date of Result</span>
          <DateInputField
            id="date_of_result"
            name="date_of_result"
            inputVariant="outlined"
            margin="dense"
            errors=""
            value={filterState.date_of_result}
            onChange={(date) =>
              handleChange({
                target: {
                  name: "date_of_result",
                  value: date,
                },
              })
            }
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"
          />
        </div>
        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Created Date Before</span>
          <DateInputField
            id="created_date_before"
            name="created_date_before"
            inputVariant="outlined"
            margin="dense"
            errors=""
            value={filterState.created_date_before}
            onChange={(date) =>
              handleChange({
                target: { name: "created_date_before", value: date },
              })
            }
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"
          />
        </div>
        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Created Date After</span>
          <DateInputField
            id="created_date_after"
            name="created_date_after"
            inputVariant="outlined"
            margin="dense"
            errors=""
            value={filterState.created_date_after}
            onChange={(date) =>
              handleChange({
                target: { name: "created_date_after", value: date },
              })
            }
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"
          />
        </div>

        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Modified Date Before</span>
          <DateInputField
            id="modified_date_before"
            name="modified_date_before"
            inputVariant="outlined"
            margin="dense"
            errors=""
            value={filterState.modified_date_before}
            onChange={(date) =>
              handleChange({
                target: { name: "modified_date_before", value: date },
              })
            }
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"
          />
        </div>
        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Modified Date After</span>
          <DateInputField
            id="modified_date_after"
            name="modified_date_after"
            inputVariant="outlined"
            margin="dense"
            errors=""
            value={filterState.modified_date_after}
            onChange={(date) =>
              handleChange({
                target: { name: "modified_date_after", value: date },
              })
            }
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"
          />
        </div>
        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Admitted Before</span>
          <DateInputField
            id="last_consultation_admission_date_before"
            name="last_consultation_admission_date_before"
            inputVariant="outlined"
            margin="dense"
            errors=""
            value={filterState.last_consultation_admission_date_before}
            onChange={(date) =>
              handleChange({
                target: {
                  name: "last_consultation_admission_date_before",
                  value: date,
                },
              })
            }
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"
          />
        </div>
        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Admitted After</span>
          <DateInputField
            id="last_consultation_admission_date_after"
            name="last_consultation_admission_date_after"
            inputVariant="outlined"
            margin="dense"
            errors=""
            value={filterState.last_consultation_admission_date_after}
            onChange={(date) =>
              handleChange({
                target: {
                  name: "last_consultation_admission_date_after",
                  value: date,
                },
              })
            }
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"
          />
        </div>
        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Discharge Before</span>
          <DateInputField
            id="last_consultation_discharge_date_before"
            name="last_consultation_discharge_date_before"
            inputVariant="outlined"
            margin="dense"
            errors=""
            value={filterState.last_consultation_discharge_date_before}
            onChange={(date) =>
              handleChange({
                target: {
                  name: "last_consultation_discharge_date_before",
                  value: date,
                },
              })
            }
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"
          />
        </div>
        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Discharge After</span>
          <DateInputField
            id="last_consultation_discharge_date_after"
            name="last_consultation_discharge_date_after"
            inputVariant="outlined"
            margin="dense"
            errors=""
            value={filterState.last_consultation_discharge_date_after}
            onChange={(date) =>
              handleChange({
                target: {
                  name: "last_consultation_discharge_date_after",
                  value: date,
                },
              })
            }
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"
          />
        </div>
        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Age</span>
          <div className="flex justify-between">
            <TextInputField
              id="age_min"
              name="age_min"
              variant="outlined"
              margin="dense"
              errors=""
              value={filterState.age_min}
              onChange={handleChange}
              label="Min Age"
              className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9 mr-1"
            />
            <TextInputField
              id="age_max"
              name="age_max"
              variant="outlined"
              margin="dense"
              errors=""
              value={filterState.age_max}
              onChange={handleChange}
              label="Max Age"
              className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"
            />
          </div>
        </div>
        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">SRF ID</span>
          <div className="flex justify-between">
            <TextInputField
              id="srf_id"
              name="srf_id"
              variant="outlined"
              margin="dense"
              errors=""
              value={filterState.srf_id}
              onChange={handleChange}
              label="Srf id"
              className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9 mr-1"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
