import React, { useState } from "react";
import { FacilitySelect } from "../Common/FacilitySelect";
import { SelectField, DateInputField, TextInputField } from "../Common/HelperInputFields";
import moment from "moment";
// import { SHIFTING_CHOICES } from "../../Common/constants";

// const shiftStatusOptions = ['Show All', ...SHIFTING_CHOICES.map(obj => obj.text)];

export default function ListFilter(props: any) {
  let { filter, onChange, closeFilter } = props;
  const [filterState, setFilterState] = useState(filter);

  const setFacility = (selected: any, name: string) => {
    const filterData: any = { ...filterState };
    filterData[`${name}_ref`] = selected;
    filterData[name] = (selected || {}).id;

    setFilterState(filterData);
  };

  const handleChange = (event: any) => {
    let { name, value } = event.target;

    const filterData: any = { ...filterState };
    filterData[name] = value;

    setFilterState(filterData);
  };

  const applyFilter = () => {
    const {
      created_date_before,
      created_date_after,
      modified_date_before,
      modified_date_after,
      ...others
    } = filterState;
    const data = {
      ...others,
      created_date_before: created_date_before && moment(created_date_before).isValid() ? created_date_before : null,
      created_date_after: created_date_after && moment(created_date_after).isValid() ? created_date_after : null,
      modified_date_before: modified_date_before && moment(modified_date_before).isValid() ? modified_date_before : null,
      modified_date_after: modified_date_after && moment(modified_date_after).isValid() ? modified_date_after : null,
    }
    onChange(data);
  };

  return (
    <div>
      <div className="flex justify-between">
        <button className="btn btn-default" onClick={closeFilter}>
          <i className="fas fa-times mr-2" />Cancel
        </button>
          <button className="btn btn-primary" onClick={applyFilter}>
            <i className="fas fa-check mr-2" />Apply
        </button>
      </div>
      <div className="font-light text-md mt-2">
        Filter By:
      </div>
      <div className="flex flex-wrap gap-2">
        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Origin facility</span>
          <div className="">
            <FacilitySelect
              multiple={false}
              name="orgin_facility"
              selected={filterState.orgin_facility_ref}
              setSelected={(obj) => setFacility(obj, 'orgin_facility')}
              className="shifting-page-filter-dropdown"
              errors={''} />
          </div>
        </div>

        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Shifting approving facility</span>
          <div className="">
            <FacilitySelect
              multiple={false}
              name="shifting_approving_facility"
              selected={filterState.shifting_approving_facility_ref}
              setSelected={(obj) => setFacility(obj, 'shifting_approving_facility')}
              className="shifting-page-filter-dropdown"
              errors={''} />
          </div>
        </div>

        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Assigned facility</span>
          <div className="">
            <FacilitySelect
              multiple={false}
              name="assigned_facility"
              selected={filterState.assigned_facility_ref}
              setSelected={(obj) => setFacility(obj, 'assigned_facility')}
              className="shifting-page-filter-dropdown"
              errors={''} />
          </div>
        </div>

        {/* <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Status</span>
          <SelectField
                name="status"
                variant="outlined"
                margin="dense"
                optionArray={true}
                value={filterState.status}
                options={shiftStatusOptions}
                onChange={handleChange}
                className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"/>
        </div> */}

        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Is emergency case</span>
          <SelectField
            name="emergency"
            variant="outlined"
            margin="dense"
            optionArray={true}
            value={filterState.emergency}
            options={['--', 'yes', 'no']}
            onChange={handleChange}
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9" />
        </div>

        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Is upshift case</span>
          <SelectField
            name="is_up_shift"
            variant="outlined"
            margin="dense"
            optionArray={true}
            value={filterState.is_up_shift}
            options={['--', 'yes', 'no']}
            onChange={handleChange}
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9" />
        </div>
        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Patient Phone Number</span>
          <TextInputField
            name="patient_phone_number"
            variant="outlined"
            margin="dense"
            errors=""
            value={filterState.patient_phone_number}
            onChange={handleChange}
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
            onChange={date => handleChange({ target: { name: "created_date_before", value: date } })}
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9" />
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
            onChange={date => handleChange({ target: { name: "created_date_after", value: date } })}
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9" />
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
            onChange={date => handleChange({ target: { name: "modified_date_before", value: date } })}
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9" />
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
            onChange={date => handleChange({ target: { name: "modified_date_after", value: date } })}
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9" />
        </div>
      </div>
    </div>
  )
}
