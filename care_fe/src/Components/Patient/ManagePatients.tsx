import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import WarningRoundedIcon from "@material-ui/icons/WarningRounded";
import { navigate } from "hookrouter";
import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { downloadPatients, getAllPatient, searchPatientFilter } from "../../Redux/actions";
import { Loading } from "../Common/Loading";
import PageTitle from "../Common/PageTitle";
import Pagination from "../Common/Pagination";
import { PatientFilter } from "./PatientFilter";
import { InputSearchBox } from "../Common/SearchBox";
import { CSVLink } from "react-csv";
import moment from 'moment';
import SwipeableViews from 'react-swipeable-views';
import { makeStyles, Theme, useTheme } from '@material-ui/core/styles';
import AppBar from '@material-ui/core/AppBar';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import Typography from '@material-ui/core/Typography';
import Box from '@material-ui/core/Box';

interface TabPanelProps {
  children?: React.ReactNode;
  dir?: string;
  index: any;
  value: any;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
      <div
          role="tabpanel"
          hidden={value !== index}
          id={`full-width-tabpanel-${index}`}
          aria-labelledby={`full-width-tab-${index}`}
          {...other}
      >
        {value === index && (
            <Box p={3}>
              <Typography>{children}</Typography>
            </Box>
        )}
      </div>
  );
}

function a11yProps(index: any) {
  return {
    id: `full-width-tab-${index}`,
    'aria-controls': `full-width-tabpanel-${index}`,
  };
}

const useStylesTab = makeStyles((theme: Theme) => ({
  root: {
    flexGrow: 1,
    backgroundColor: theme.palette.background.paper
  },
}));

const now = moment().format('DD-MM-YYYY:hh:mm:ss');


const useStyles = makeStyles((theme) => ({
  paginateTopPadding: {
    paddingTop: "50px",
  },
  displayFlex: {
    display: "flex",
  },
}));

export const PatientManager = (props: any) => {
  const { facilityId } = props;
  const classes = useStyles();
  const classesTab = useStylesTab();
  const theme = useTheme();
  const [value, setValue] = React.useState(0);
  const dispatch: any = useDispatch();
  const initialData: any[] = [];
  const [data, setData] = useState(initialData);
  const [diseaseStatus, setDiseaseStatus] = useState('');
  let managePatients: any = null;
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [offset, setOffset] = useState(0);
  const [DownloadFile, setDownloadFile] = useState("");
  const limit = 14;
  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(
        getAllPatient({ facility: facilityId, limit, offset, disease_status: diseaseStatus })
      );
      if (!status.aborted) {
        if (res && res.data) {
          setData(res.data.results);
          setTotalCount(res.data.count);
        }
        setIsLoading(false);
      }
    },
    [diseaseStatus, dispatch, facilityId, offset]
  );
  const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setValue(newValue);
  };

  const handleChangeIndex = (index: number) => {
    setValue(index);
  };
  const handleDownload = async () => {
    const res = await dispatch(downloadPatients());
    setDownloadFile(res.data);
    document.getElementById("downloadlink")?.click();
  };

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [fetchData]
  );

  const handlePagination = (page: number, limit: number) => {
    const offset = (page - 1) * limit;
    setCurrentPage(page);
    setOffset(offset);
  };

  const searchByName = async (searchValue: string) => {
    setIsLoading(true);
    const res = await dispatch(searchPatientFilter({ limit, offset, name: searchValue }));
    if (res && res.data) {
      setData(res.data.results);
      setTotalCount(res.data.count);
    }
    setIsLoading(false);
  }

  const searchByPhone = async (searchValue: string) => {
    setIsLoading(true);
    const res = await dispatch(searchPatientFilter({ limit, offset, phone_number: encodeURI(searchValue) }));
    if (res && res.data) {
      setData(res.data.results);
      setTotalCount(res.data.count);
    }
    setIsLoading(false);
  }

  const handleFilter = async (diseaseStatus: string) => {
    setDiseaseStatus(diseaseStatus);
    setOffset(0);
    setCurrentPage(1);
  }

  let patientList: any[] = [];
  if (data && data.length) {
    patientList = data.map((patient: any, idx: number) => {
      const patientUrl = patient.facility
        ? `/facility/${patient.facility}/patient/${patient.id}`
        : `/patient/${patient.id}`;
      return (
        <div key={`usr_${patient.id}`} className="w-full md:w-1/2 mt-6 md:px-4">
          <div
            onClick={() => navigate(patientUrl)}
            className={`overflow-hidden shadow rounded-lg bg-white h-full cursor-pointer hover:border-primary-500
            ${patient.disease_status === 'POSITIVE' ? "border-red-700 bg-red-100" :
                ['NEGATIVE', 'RECOVERY', 'RECOVERED'].indexOf(patient.disease_status) >= 0 ? "border-green-700 bg-green-100" : ""}
            `}
          >
            <div className="px-6 py-4 h-full flex flex-col justify-between">
              <div>
                <div className="flex justify-between">
                  <div className="font-bold text-xl capitalize mb-2">
                    {patient.name}
                  </div>

                  <div className="flex">
                    <div>
                      {patient.is_medical_worker && patient.is_active && (
                        <span className="badge badge-pill badge-primary mr-2">
                          Medical Worker
                        </span>
                      )}
                    </div>
                    <div>
                      {patient.allow_transfer && (
                        <span className="badge badge-pill badge-primary mr-2">
                          Transfer allowed
                        </span>
                      )}
                    </div>
                    <div>
                      {!patient.allow_transfer && (
                        <span className="badge badge-pill badge-warning mr-2">
                          Transfer Not allowed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div>
                  <span className="font-semibold leading-relaxed">Age: </span>
                  {patient.age}
                </div>
                {patient.facility_object && (<div>
                  <span className="font-semibold leading-relaxed">Facility: </span>
                  {patient.facility_object.name}
                </div>)}
                {patient.contact_with_confirmed_carrier && (
                  <div className="flex">
                    <span className="font-semibold leading-relaxed">
                      Contact with confirmed carrier
                    </span>
                    <WarningRoundedIcon className="text-red-500">

                    </WarningRoundedIcon>
                  </div>
                )}
                {patient.contact_with_suspected_carrier &&
                  !patient.contact_with_confirmed_carrier && (
                    <div className="flex">
                      <span className="font-semibold leading-relaxed">
                        Contact with suspected carrier
                      </span>
                      <WarningRoundedIcon className="text-yellow-500">

                      </WarningRoundedIcon>
                    </div>
                  )}
                <div>
                  {patient.countries_travelled && !!patient.countries_travelled.length && (<>
                    <span className="font-semibold leading-relaxed">
                      Travel History:{" "}
                    </span>
                    {Array.isArray(patient.countries_travelled) ? patient.countries_travelled.join(", ") : patient.countries_travelled.split(',').join(', ')}
                  </>)}
                </div>
              </div>
              <div className="mt-2">
                <Button size="small" variant="outlined" fullWidth>
                  View Patient Details
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    });
  }

  if (isLoading || !data) {
    managePatients = <Loading />;
  } else if (data && data.length) {
    managePatients = (
      <>
        {patientList}
        {totalCount > limit && (
          <div className="mt-4 flex w-full justify-center">
            <Pagination
              cPage={currentPage}
              defaultPerPage={limit}
              data={{ totalCount }}
              onChange={handlePagination}
            />
          </div>
        )}
      </>
    );
  }
  else if (data && data.length === 0) {
    managePatients = (
      <Grid item xs={12} md={12} className={classes.displayFlex}>
        <Grid container justify="center" alignItems="center">
          <h5> No Covid Suspects Found</h5>
        </Grid>
      </Grid>
    );
  }

  return (
    <div>
      <PageTitle
        title="Covid Suspects"
        hideBack={!facilityId}
        className="mt-4 mx-2 md:mx-8" />
      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3 m-4 md:px-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dl>
              <dt className="text-sm leading-5 font-medium text-gray-500 truncate">
                Total Suspects
              </dt>
              <dd className="mt-4 text-5xl leading-9 font-semibold text-gray-900">
                {totalCount}
              </dd>
            </dl>
          </div>
        </div>
        <div>
          <div>
            <div className="text-sm font-semibold mb-2">
              Search by Name
          </div>
            <InputSearchBox
              search={searchByName}
              placeholder='Search by Patient Name'
              errors=''
            />
          </div>
          <div>
            <div className="text-sm font-semibold mt-2">
              Search by number
          </div>
            <InputSearchBox
              search={searchByPhone}
              placeholder='+919876543210'
              errors=''
            />
          </div>
        </div>
        <div className="flex flex-col justify-between">
          <div>
            <div className="text-sm font-semibold">Filter by Status</div>
            <PatientFilter filter={handleFilter} />
          </div>
          <div className="mt-2">
            <button
              type="button"
              className="inline-flex items-center mt-1 md:mt-0 lg:mt-0 px-1 py-2 ml-1  lg:px-3 border border-green-500 text-sm leading-4 font-medium rounded-md text-green-700 bg-white hover:text-green-500 focus:outline-none focus:border-green-300 focus:shadow-outline-blue active:text-green-800 active:bg-gray-50 transition ease-in-out duration-150 hover:shadow"
              onClick={handleDownload}
            >
              Download Patient List
          </button>
            <CSVLink
              id="downloadlink"
              className="hidden"
              data={DownloadFile}
              filename={`patients-${now}.csv`}
              target="_blank"
            >
            </CSVLink>
          </div>
        </div>
      </div>
      <div className={classesTab.root}>
        <AppBar position="static" color="default">
          <Tabs
              value={value}
              onChange={handleChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
              aria-label="full width tabs example"
          >
            <Tab label="Live" {...a11yProps(1)}/>
            <Tab label="Discharged" {...a11yProps(1)} />
          </Tabs>
        </AppBar>
        <SwipeableViews
            axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
            index={value}
            onChangeIndex={handleChangeIndex}
        >

          <TabPanel value={value} index={0} dir={theme.direction}>
            <div className="px-3 md:px-8">
              <div className="flex flex-wrap md:-mx-4">{managePatients}</div>
            </div>
          </TabPanel>
          <TabPanel value={value} index={1} dir={theme.direction}>
            <div className="px-3 md:px-8">
              <div className="flex flex-wrap md:-mx-4">{managePatients}</div>
            </div>
          </TabPanel>
        </SwipeableViews>
      </div>

    </div>
  );
};
