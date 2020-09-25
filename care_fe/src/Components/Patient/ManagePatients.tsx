import loadable from '@loadable/component';
import Box from '@material-ui/core/Box';
import Button from "@material-ui/core/Button";
import Grid from "@material-ui/core/Grid";
import { makeStyles, Theme, useTheme } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import { navigate, useQueryParams } from 'raviger';
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import moment from 'moment';
import React, { useEffect, useState } from "react";
import { CSVLink } from "react-csv";
import { useDispatch } from "react-redux";
import SwipeableViews from 'react-swipeable-views';
import { getAllPatient } from "../../Redux/actions";
import { PhoneNumberField } from '../Common/HelperInputFields';
import NavTabs from '../Common/NavTabs';
import Pagination from "../Common/Pagination";
import { InputSearchBox } from "../Common/SearchBox";
import { PatientFilter } from "./PatientFilter";
import { TELEMEDICINE_ACTIONS } from "../../Common/constants";
const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

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

function Badge(props: { color: string, icon: string, text: string }) {
  return (
    <span className="m-1 inline-flex items-center px-3 py-1 rounded-full text-xs font-medium leading-4 bg-gray-100 text-gray-700" title={props.text}>
      <i className={"mr-2 text-md text-" + props.color + "-500 fas fa-" + props.icon}></i>
      {props.text}
    </span>
  )
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


const RESULT_LIMIT = 30;


export const PatientManager = (props: any) => {
  const { facilityId } = props;
  const classes = useStyles();
  const classesTab = useStylesTab();
  const theme = useTheme();
  const dispatch: any = useDispatch();


  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [DownloadFile, setDownloadFile] = useState("");
  const [qParams, setQueryParams] = useQueryParams();

  const tabValue = qParams.is_active === 'False' ? 1 : 0;

  let managePatients: any = null;
  const handleDownload = async (isFiltered: boolean) => {
    const params = isFiltered ? {
      disease_status: qParams.disease_status,
      is_active: qParams.is_active || 'True'
    } : {};
    const res = await dispatch(getAllPatient({
      ...params,
      csv: true,
      facility: facilityId
    }, 'downloadPatients'))
    if (res && res.data) {
      setDownloadFile(res.data);
      document.getElementById("downloadlink")?.click();
    }
  };
  const handleDownloadAll = async () => {
    await handleDownload(false)
  }
  const handleDownloadFiltered = async () => {
    await handleDownload(true)
  }

  useEffect(() => {
    setIsLoading(true);
    const params = {
      page: qParams.page || 1,
      name: qParams.name || undefined,
      disease_status: qParams.disease_status || undefined,
      phone_number: qParams.phone_number ? parsePhoneNumberFromString(qParams.phone_number)?.format('E.164') : undefined,
      facility: facilityId,
      offset: (qParams.page ? qParams.page - 1 : 0) * RESULT_LIMIT
    };

    dispatch(getAllPatient(params, 'listPatients'))
      .then((res: any) => {
        if (res && res.data) {
          setData(res.data.results);
          setTotalCount(res.data.count);
        }
        setIsLoading(false);
      }).catch(() => {
        setIsLoading(false);
      })
  }, [dispatch, facilityId, qParams.disease_status, qParams.name, qParams.page, qParams.phone_number]);

  const updateQuery = (params: any) => {
    const nParams = Object.assign({}, qParams, params);
    setQueryParams(nParams, true);
  }

  const handleTabChange = async (tab: number) => {

    updateQuery({
      ...qParams,
      is_active: tab ? 'False' : 'True',
      page: 1,
    });
  };

  const handlePagination = (page: number, limit: number) => {
    updateQuery({ page, limit });
  };

  const searchByName = (value: string) => {
    updateQuery({ name: value, page: 1 });
  }

  const searchByPhone = (value: string) => {
    updateQuery({ phone_number: value, page: 1 });
  }

  const handleFilter = (value: string) => {
    updateQuery({ disease_status: value, page: 1 });
  }

  let patientList: any[] = [];
  if (data && data.length) {
    patientList = data.map((patient: any, idx: number) => {
      const patientUrl = patient.facility
        ? `/facility/${patient.facility}/patient/${patient.id}`
        : `/patient/${patient.id}`;
      return (
        <div
          key={`usr_${patient.id}`}
          onClick={() => navigate(patientUrl)}
          className={"w-full pb-2 cursor-pointer border-b md:flex justify-between items-center mb-3 " + (patient.disease_status == "POSITIVE" ? "bg-red-50" : "")}
        >
          <div className="px-4 md:w-1/2">
            <div className="md:flex justify-between w-full">
              <div className="text-xl font-normal capitalize">
                {patient.name} - {patient.age}
                {
                  patient.action && patient.action != 10 && <span className="font-semibold ml-2">- {TELEMEDICINE_ACTIONS.find(i => i.id === patient.action)?.desc}</span>
                }
              </div>
            </div>
            {patient.facility_object &&
              <div className="font-normal text-sm">
                {patient.facility_object.name},
                <span className="text-xs ml-2">
                  Updated at: {moment(patient.modified_date).format("lll")}
                </span>
                {
                  patient.review_time &&
                  <span className={"m-1 inline-flex items-center px-3 py-1 rounded-full text-xs leading-4 font-semibold " + (moment().isBefore(patient.review_time) ? " bg-gray-100" : "rounded p-1 bg-red-400 text-white")}>
                    <i className="mr-2 text-md fas fa-clock"></i>
                    {(moment().isBefore(patient.review_time) ? "Review at: " : "Review Missed: ") + moment(patient.review_time).format("lll")}
                  </span>
                }
              </div>
            }
          </div>
          <div className="md:flex">
            <div className="md:flex flex-wrap justify-end">
              {patient.allow_transfer ?
                <Badge color="yellow" icon="unlock" text="Transfer Allowed" />
                : <Badge color="green" icon="lock" text="Transfer Blocked" />}
              {patient.disease_status === 'POSITIVE' && (
                <Badge color="red" icon="radiation" text="Positive" />
              )}
              {['NEGATIVE', 'RECOVERY', 'RECOVERED'].indexOf(patient.disease_status) >= 0 && (
                <Badge color="green" icon="smile-beam" text={patient.disease_status} />
              )}
              {
                patient.is_antenatal && patient.is_active &&
                <Badge color="blue" icon="baby-carriage" text="Antenatal" />
              }
              {patient.is_medical_worker && patient.is_active && (
                <Badge color="blue" icon="user-md" text="Medical Worker" />
              )}
              {patient.contact_with_confirmed_carrier && (
                <Badge color="red" icon="exclamation-triangle" text="Contact with confirmed carrier" />
              )}
              {patient.contact_with_suspected_carrier && (
                <Badge color="yellow" icon="exclamation-triangle" text="Contact with suspected carrier" />
              )}
            </div>
            <div className="px-2">
              <div className="btn btn-default bg-white">
                Details
              </div>
            </div>
          </div>
        </div >
      );
    });
  }

  if (isLoading || !data) {
    managePatients = <Loading />;
  } else if (data && data.length) {
    managePatients = (
      <>
        {patientList}
        {totalCount > RESULT_LIMIT && (
          <div className="mt-4 flex w-full justify-center">
            <Pagination
              cPage={qParams.page}
              defaultPerPage={RESULT_LIMIT}
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
          <h5> No Patients Found</h5>
        </Grid>
      </Grid>
    );
  }

  return (
    <div className="px-6">
      <PageTitle
        title="Patients"
        hideBack={!facilityId}
        className="mt-4" />
      <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-3 my-4 px-2 md:px-0 relative">
        <div className="title-text">
          <Button
            color="primary"
            onClick={handleDownloadAll}
            size="small"
            startIcon={<ArrowDownwardIcon>download</ArrowDownwardIcon>}>
            All Patients
          </Button>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dl>
              <dt className="text-sm leading-5 font-medium text-gray-500 truncate">
                Total Patients
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
              value={qParams.name}
              placeholder='Search by Patient Name'
              errors=''
            />
          </div>
          <div>
            <div className="text-sm font-semibold mt-2">
              Search by number
          </div>
            <PhoneNumberField
              value={qParams.phone_number}
              onChange={searchByPhone}
              turnOffAutoFormat={true}
              errors=""
            />
          </div>
        </div>
        <div className="flex flex-col justify-between">
          <div>
            <div className="text-sm font-semibold">Filter by Status</div>
            <PatientFilter filter={handleFilter} value={qParams.disease_status} />
          </div>
          <div className="mb-1">
            <Button
              variant="outlined"
              color="primary"
              className="bg-white"
              onClick={handleDownloadFiltered}
              startIcon={<ArrowDownwardIcon>download</ArrowDownwardIcon>}
            >
              {tabValue === 0 ? 'Live' : 'Discharged'} List
              </Button>
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
        <NavTabs
          onChange={handleTabChange}
          options={[{ value: 0, label: "Live" }, { value: 1, label: "Discharged" }]}
          active={tabValue}
        />
        <SwipeableViews
          axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
          index={tabValue}
        >

          <TabPanel value={tabValue} index={0} dir={theme.direction}>
            <div className="flex flex-wrap md:-mx-4">{managePatients}</div>
          </TabPanel>
          <TabPanel value={tabValue} index={1} dir={theme.direction}>
            <div className="flex flex-wrap md:-mx-4">{managePatients}</div>
          </TabPanel>
        </SwipeableViews>
      </div>

    </div>
  );
};
