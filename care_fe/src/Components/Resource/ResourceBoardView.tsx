import React, { useState } from "react";
import { useQueryParams, navigate } from "raviger";
import ListFilter from "./ListFilter";
import ResourceBoard from "./ResourceBoard";
import { RESOURCE_CHOICES } from "../../Common/constants";
import { make as SlideOver } from "../Common/SlideOver.gen";
import { InputSearchBox } from "../Common/SearchBox";
import { downloadResourceRequests } from "../../Redux/actions";
import loadable from "@loadable/component";
import { CSVLink } from "react-csv";
import { useDispatch } from "react-redux";
import moment from "moment";
import GetAppIcon from "@material-ui/icons/GetApp";

import { formatFilter, badge } from "./Commons";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

const resourceStatusOptions = RESOURCE_CHOICES.map((obj) => obj.text);

const COMPLETED = ["COMPLETED", "REJECTED"];
const ACTIVE = resourceStatusOptions.filter(
  (option) => !COMPLETED.includes(option)
);

const now = moment().format("DD-MM-YYYY:hh:mm:ss");

export default function BoardView() {
  const [qParams, setQueryParams] = useQueryParams();
  const dispatch: any = useDispatch();
  const [boardFilter, setBoardFilter] = useState(ACTIVE);
  const [downloadFile, setDownloadFile] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  badge;

  const updateQuery = (filter: any) => {
    // prevent empty filters from cluttering the url
    const nParams = Object.keys(filter).reduce(
      (a, k) =>
        filter[k] && filter[k] !== "--"
          ? Object.assign(a, { [k]: filter[k] })
          : a,
      {}
    );
    setQueryParams(nParams, true);
  };

  const applyFilter = (data: any) => {
    const filter = { ...qParams, ...data };
    updateQuery(filter);
    setShowFilters(false);
  };

  const appliedFilters = formatFilter(qParams);

  const triggerDownload = async () => {
    const res = await dispatch(
      downloadResourceRequests({ ...formatFilter(qParams), csv: 1 })
    );
    setDownloadFile(res.data);
    document.getElementById(`resourceRequests-ALL`)?.click();
  };

  const onListViewBtnClick = () => {
    navigate("/resource/list-view", qParams);
    localStorage.setItem("defaultResourceView", "list");
  };

  return (
    <div className="flex flex-col h-screen px-2 pb-2">
      <div className="flex items-end justify-between px-4">
        <div className="flex items-center">
          <PageTitle title={"Resource"} hideBack={true} />
          <GetAppIcon
            className="cursor-pointer mt-4"
            onClick={triggerDownload}
          />
        </div>
        <div className="bg-gray-200 text-sm text-gray-500 leading-none border-2 border-gray-200 rounded-full inline-flex w-32">
          <button
            className={
              "flex leading-none border-2 border-gray-200 rounded-full items-center transition-colors duration-300 ease-in focus:outline-none hover:text-blue-400 focus:text-blue-400 rounded-r-full px-4 py-2" +
              (boardFilter === ACTIVE
                ? " bg-white text-gray-800"
                : " bg-gray-200 text-sm text-gray-500")
            }
            onClick={(_) => setBoardFilter(ACTIVE)}
          >
            <span>Active</span>
          </button>
          <button
            className={
              "flex leading-none border-2 border-gray-200 rounded-full items-center transition-colors duration-300 ease-in focus:outline-none hover:text-blue-400 focus:text-blue-400 rounded-r-full px-4 py-2" +
              (boardFilter === COMPLETED
                ? " bg-white text-gray-800"
                : " bg-gray-200 text-sm text-gray-500")
            }
            onClick={(_) => setBoardFilter(COMPLETED)}
          >
            <span>Completed</span>
          </button>
        </div>
        <button
          className="px-4 py-2 rounded-full border-2 border-gray-200 text-sm bg-white text-gray-800 w-32 leading-none transition-colors duration-300 ease-in focus:outline-none hover:text-primary-600 hover:border-gray-400 focus:text-primary-600 focus:border-gray-400"
          onClick={onListViewBtnClick}
        >
          <i className="fa fa-list-ul mr-1" aria-hidden="true"></i>
          List View
        </button>
        <div className="flex items-start gap-2">
          <button
            className="flex leading-none border-2 border-gray-200 bg-white rounded-full items-center transition-colors duration-300 ease-in focus:outline-none hover:text-primary-600 focus:text-primary-600 focus:border-gray-400 hover:border-gray-400 rounded-r-full px-4 py-2 text-sm"
            onClick={(_) => setShowFilters((show) => !show)}
          >
            <i className="fa fa-filter mr-1" aria-hidden="true"></i>
            <span>Filters</span>
          </button>
        </div>
      </div>
      <div className="flex space-x-2 mt-2 ml-2">
        {badge(
          "Emergency",
          appliedFilters.emergency === "true"
            ? "yes"
            : appliedFilters.emergency === "false"
            ? "no"
            : undefined
        )}
        {badge("Modified After", appliedFilters.modified_date_after)}
        {badge("Modified Before", appliedFilters.modified_date_before)}
        {badge("Created Before", appliedFilters.created_date_before)}
        {badge("Created After", appliedFilters.created_date_after)}
        {badge(
          "Filtered By",
          appliedFilters.assigned_facility && "Assigned Facility"
        )}
        {badge(
          "Filtered By",
          appliedFilters.orgin_facility && "Origin Facility"
        )}
        {badge(
          "Filtered By",
          appliedFilters.approving_facility && "Resource Approving Facility"
        )}
      </div>
      <div className="flex mt-4 pb-2 flex-1 items-start overflow-x-scroll">
        {isLoading ? (
          <Loading />
        ) : (
          boardFilter.map((board) => (
            <ResourceBoard
              filterProp={qParams}
              board={board}
              formatFilter={formatFilter}
            />
          ))
        )}
      </div>
      <CSVLink
        data={downloadFile}
        filename={`resource-requests--${now}.csv`}
        target="_blank"
        className="hidden"
        id={`resourceRequests-ALL`}
      />
      <SlideOver show={showFilters} setShow={setShowFilters}>
        <div className="bg-white min-h-screen p-4">
          <ListFilter
            filter={qParams}
            onChange={applyFilter}
            closeFilter={() => setShowFilters(false)}
          />
        </div>
      </SlideOver>
    </div>
  );
}
