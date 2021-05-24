import React, { useEffect, useState } from "react";
import { FacilitySelect } from "../Common/FacilitySelect";
import { SelectField, DateInputField, TextInputField } from "../Common/HelperInputFields";
import { RESOURCE_FILTER_ORDER } from "../../Common/constants";
import moment from "moment";
import { getFacility } from '../../Redux/actions';
import { useDispatch } from 'react-redux';
import { CircularProgress } from '@material-ui/core';
import { RESOURCE_CHOICES } from "../../Common/constants";
import { Link } from 'raviger';

function useMergeState(initialState: any) {
  const [state, setState] = useState(initialState);
  const setMergedState = (newState: any) => setState((prevState: any) => Object.assign({}, prevState, newState));
  return [state, setMergedState];
}

const resourceStatusOptions = RESOURCE_CHOICES.map(obj => obj.text);


export default function ListFilter(props: any) {
  let { filter, onChange, closeFilter } = props;
  const [isOriginLoading, setOriginLoading] = useState(false);
  const [isResourceLoading, setResourceLoading] = useState(false);
  const [isAssignedLoading, setAssignedLoading] = useState(false);
  const [filterState, setFilterState] = useMergeState({
    orgin_facility: filter.orgin_facility || '',
    orgin_facility_ref: null,
    approving_facility: filter.approving_facility || '',
    approving_facility_ref: null,
    assigned_facility: filter.assigned_facility || '',
    assigned_facility_ref: null,
    emergency: filter.emergency || '--',
    created_date_before: filter.created_date_before || null,
    created_date_after: filter.created_date_after || null,
    modified_date_before: filter.modified_date_before || null,
    modified_date_after: filter.modified_date_after || null,
    ordering: filter.ordering || null,
    status: filter.status || null
  });
  const dispatch: any = useDispatch();

  useEffect(() => {
    async function fetchData() {
      if (filter.orgin_facility) {
        setOriginLoading(true);
        const res = await dispatch(getFacility(filter.orgin_facility, 'orgin_facility'))
        if (res && res.data) {
          setFilterState({ orgin_facility_ref: res.data });
        }
        setOriginLoading(false);
      }
    }
    fetchData();
  }, [dispatch]);

  useEffect(() => {
    async function fetchData() {
      if (filter.approving_facility) {
        setResourceLoading(true);
        const res = await dispatch(getFacility(filter.approving_facility, 'approving_facility'))
        if (res && res.data) {
          setFilterState({ approving_facility_ref: res.data });
        }
        setResourceLoading(false);
      }
    }
    fetchData();
  }, [dispatch]);

  useEffect(() => {
    async function fetchData() {
      if (filter.assigned_facility) {
        setAssignedLoading(true);
        const res = await dispatch(getFacility(filter.assigned_facility, 'assigned_facility'))
        if (res && res.data) {
          setFilterState({ assigned_facility_ref: res.data });
        }
        setAssignedLoading(false);
      }
    }
    fetchData();
  }, [dispatch]);

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
      orgin_facility,
      approving_facility,
      assigned_facility,
      emergency,
      created_date_before,
      created_date_after,
      modified_date_before,
      modified_date_after,
      ordering,
      status
    } = filterState;
    const data = {
      orgin_facility: orgin_facility || '',
      approving_facility: approving_facility || '',
      assigned_facility: assigned_facility || '',
      emergency: emergency || '',
      created_date_before: created_date_before && moment(created_date_before).isValid() ? moment(created_date_before).format('YYYY-MM-DD') : '',
      created_date_after: created_date_after && moment(created_date_after).isValid() ? moment(created_date_after).format('YYYY-MM-DD') : '',
      modified_date_before: modified_date_before && moment(modified_date_before).isValid() ? moment(modified_date_before).format('YYYY-MM-DD') : '',
      modified_date_after: modified_date_after && moment(modified_date_after).isValid() ? moment(modified_date_after).format('YYYY-MM-DD') : '',
      ordering: ordering || '',
      status: status || '',
    }
    onChange(data);
  };

  return (
    <div>
      <div className="flex justify-between">
        <button className="btn btn-default" onClick={closeFilter}>
          <i className="fas fa-times mr-2" />Cancel
        </button>
        <Link href='/resource' className='btn btn-default hover:text-gray-900'>
          <i className="fas fa-times mr-2" />Clear Filters
        </Link>
        <button className="btn btn-primary" onClick={applyFilter}>
          <i className="fas fa-check mr-2" />Apply
        </button>
      </div>
      <div className="font-light text-md mt-2">
        Filter By:
      </div>
      <div className="flex flex-wrap gap-2">
      {props.showResourceStatus && (
        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Status</span>
          <SelectField
            name="status"
            variant="outlined"
            margin="dense"
            optionArray={true}
            value={filterState.status}
            options={['--', ...resourceStatusOptions]}
            onChange={handleChange}
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9" />
        </div>
      )}
        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Origin facility</span>
          <div className="">
            {isOriginLoading ? (
              <CircularProgress size={20} />
            ) : (
                <FacilitySelect
                  multiple={false}
                  name="orgin_facility"
                  selected={filterState.orgin_facility_ref}
                  setSelected={(obj) => setFacility(obj, 'orgin_facility')}
                  className="resource-page-filter-dropdown"
                  errors={''} />
              )}
          </div>
        </div>

        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Resource approving facility</span>
          <div className="">
            {isResourceLoading ? (
              <CircularProgress size={20} />
            ) : (
                <FacilitySelect
                  multiple={false}
                  name="approving_facility"
                  selected={filterState.approving_facility_ref}
                  setSelected={(obj) => setFacility(obj, 'approving_facility')}
                  className="resource-page-filter-dropdown"
                  errors={''} />
              )}
          </div>
        </div>

        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Assigned facility</span>
          <div className="">
            {isAssignedLoading ? (
              <CircularProgress size={20} />
            ) : (
                <FacilitySelect
                  multiple={false}
                  name="assigned_facility"
                  selected={filterState.assigned_facility_ref}
                  setSelected={(obj) => setFacility(obj, 'assigned_facility')}
                  className="resource-page-filter-dropdown"
                  errors={''} />
              )}
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
                options={resourceStatusOptions}
                onChange={handleChange}
                className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"/>
        </div> */}

        <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Ordering</span>
          <SelectField
            name="ordering"
            variant="outlined"
            margin="dense"
            optionKey="text"
            optionValue="desc"
            value={filterState.ordering}
            options={RESOURCE_FILTER_ORDER}
            onChange={handleChange}
            className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9" />
        </div>

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

        {/* <div className="w-64 flex-none">
          <span className="text-sm font-semibold">Is upresource case</span>
          <DateTimeFiled
                name="X_before"
                inputVariant="outlined"
                margin="dense"
                errors=""
                value={filter.X_before}
                onChange={date => handleChange({target: {name: "X_before", value: date}})}
                className="bg-white h-10 shadow-sm md:text-sm md:leading-5 md:h-9"/>
        </div>         */}
      </div>
    </div>
  )
}
