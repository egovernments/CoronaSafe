import loadable from "@loadable/component";
import { navigate, useQueryParams } from "raviger";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { getNotifications } from "../../Redux/actions";
import Pagination from "../Common/Pagination";
import { make as SlideOver } from "../Common/SlideOver.gen";
import { SelectField } from "../Common/HelperInputFields";
import { InputLabel } from "@material-ui/core";
import moment from "moment";
import axios from "axios";
import { useSelector } from "react-redux";
import { Button, CircularProgress } from "@material-ui/core";
import { NOTIFICATION_EVENTS } from "../../Common/constants";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

const RESULT_LIMIT = 15;
const now = moment().format("DD-MM-YYYY:hh:mm:ss");

export default function ResultList() {
  const rootState: any = useSelector((rootState) => rootState);
  const { currentUser } = rootState;

  const username = currentUser.data.username;
  const dispatch: any = useDispatch();
  const [data, setData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [offset, setOffset] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [reload, setReload] = useState(false);
  const [eventFilter, setEventFilter] = useState("");

  const [isSubscribed, setIsSubscribed] = useState("");

  const intialSubscriptionState = async () => {
    const res = await axios.get(`/api/v1/users/${username}/pnconfig/`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("care_access_token")}`,
      },
    });
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      setIsSubscribed("NotSubscribed");
    } else if (subscription.endpoint === res.data.pf_endpoint) {
      setIsSubscribed("SubscribedOnThisDevice");
    } else {
      setIsSubscribed("SubscribedOnAnotherDevice");
    }
  };

  const handleSubscribeClick = () => {
    const status = isSubscribed;
    if (status === "NotSubscribed" || status === "SubscribedOnAnotherDevice") {
      subscribe();
    } else {
      unsubscribe();
    }
  };

  const getButtonText = () => {
    const status = isSubscribed;
    if (status === "NotSubscribed") {
      return "Subscribe";
    } else if (status === "SubscribedOnAnotherDevice") {
      return "Subscribe On This Device";
    } else {
      return "Unsubscribe";
    }
  };

  console.log("Status:", isSubscribed);
  console.log("Notificiation Permission", Notification.permission);

  let manageResults: any = null;

  const unsubscribe = () => {
    navigator.serviceWorker.ready.then(function (reg) {
      reg.pushManager.getSubscription().then(function (subscription) {
        subscription
          ?.unsubscribe()
          .then(async function (successful) {
            const res = await axios.patch(
              `/api/v1/users/${username}/pnconfig/`,
              {
                pf_endpoint: "",
                pf_p256dh: "",
                pf_auth: "",
              },
              {
                headers: {
                  Authorization: `Bearer ${localStorage.getItem(
                    "care_access_token"
                  )}`,
                },
              }
            );
            setIsSubscribed("NotSubscribed");
          })
          .catch(function (e) {
            console.log("Unsubscription failed");
          });
      });
    });
  };

  async function subscribe() {
    const apiUrl = "/api/v1/notification/public_key/";
    const reponse = await axios.get(apiUrl);
    const public_key = reponse.data.public_key;
    const sw = await navigator.serviceWorker.ready;
    const push = await sw.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: public_key,
    });
    const p256dh = btoa(
      String.fromCharCode.apply(
        null,
        new Uint8Array(push.getKey("p256dh") as any) as any
      )
    );
    const auth = btoa(
      String.fromCharCode.apply(
        null,
        new Uint8Array(push.getKey("auth") as any) as any
      )
    );

    const res = await axios.patch(
      `/api/v1/users/${username}/pnconfig/`,
      {
        pf_endpoint: push.endpoint,
        pf_p256dh: p256dh,
        pf_auth: auth,
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("care_access_token")}`,
        },
      }
    );

    if (res.status >= 200 && res.status <= 300) {
      console.log("subscribed");
      setIsSubscribed("SubscribedOnThisDevice");
    } else {
      console.log("Error saving web push info.");
    }
  }

  useEffect(() => {
    setIsLoading(true);
    if (showNotifications) {
      dispatch(getNotifications({ offset, event: eventFilter }))
        .then((res: any) => {
          if (res && res.data) {
            setData((prev) => [...prev, ...res.data.results]);
            setTotalCount(res.data.count);
          }
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
          setOffset((prev) => prev - RESULT_LIMIT);
        });
    }
    intialSubscriptionState();
  }, [dispatch, reload, showNotifications, offset, eventFilter, isSubscribed]);

  // const handlePagination = (page: number, limit: number) => {
  //   updateQuery({ page, limit });
  // };

  let resultUrl = (event: string, data: any) => {
    switch (event) {
      case "PATIENT_CREATED":
        return `/facility/${data.facility}/patient/${data.patient}`;
      case "PATIENT_UPDATED":
        return `/facility/${data.facility}/patient/${data.patient}`;
      case "PATIENT_CONSULTATION_CREATED":
        return `/facility/${data.facility}/patient/${data.patient}/consultation/${data.consultation}`;
      case "PATIENT_CONSULTATION_UPDATED":
        return `/facility/${data.facility}/patient/${data.patient}/consultation/${data.consultation}`;
      case "PATIENT_CONSULTATION_UPDATE_CREATED":
        return `/facility/${data.facility}/patient/${data.patient}/consultation/${data.consultation}/daily-rounds/${data.daily_round}`;
      case "PATIENT_CONSULTATION_UPDATE_UPDATED":
        return `/facility/${data.facility}/patient/${data.patient}/consultation/${data.consultation}/daily-rounds/${data.daily_round}`;
      case "INVESTIGATION_SESSION_CREATED":
        return `/facility/${data.facility}/patient/${data.patient}/consultation/${data.consultation}/investigation/${data.session}`;
      default:
        return "#";
    }
  };

  let resultList: any[] = [];
  if (data && data.length) {
    resultList = data.map((result: any, idx: number) => {
      return (
        <div
          key={`usr_${result.id}`}
          onClick={() =>
            navigate(resultUrl(result.event, result.caused_objects))
          }
          className="relative py-5 px-4 lg:px-8 hover:bg-gray-200 focus:bg-gray-200 transition ease-in-out duration-150 cursor-pointer"
        >
          <div className="text-lg font-bold">{result.event}</div>
          <div className="text-sm">{result.message}</div>
          <div className="text-xs">
            {moment(result.created_date).format("lll")}
          </div>
          <a className="inline-flex items-center font-semibold p-2 md:py-1 bg-white hover:bg-gray-300 border rounded text-xs flex-shrink-0">
            <i className="fas fa-eye mr-2 text-primary-500" />
            Visit Link
          </a>
        </div>
      );
    });
  }
  if (!offset && isLoading) {
    manageResults = (
      <div className="flex items-center justify-center">
        <CircularProgress color="primary" />
      </div>
    );
  } else if (data && data.length) {
    manageResults = (
      <>
        {resultList}
        {isLoading && (
          <div className="flex items-center justify-center">
            <CircularProgress color="primary" />
          </div>
        )}
        {totalCount > RESULT_LIMIT && offset < totalCount - RESULT_LIMIT && (
          <div className="mt-4 flex w-full justify-center py-5 px-4 lg:px-8">
            <Button
              disabled={isLoading}
              variant="contained"
              color="primary"
              fullWidth
              onClick={() => {
                setOffset((prev) => prev + RESULT_LIMIT);
              }}
            >
              {isLoading ? "Loading..." : "Load More"}
            </Button>
          </div>
        )}
      </>
    );
  } else if (data && data.length === 0) {
    manageResults = (
      <div>
        <h5> No Results Found</h5>
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="mt-2 group flex w-full items-center px-2 py-2 text-base leading-5 font-medium text-green-300 rounded-md hover:text-white hover:bg-green-700 focus:outline-none focus:bg-green-900 transition ease-in-out duration-150"
      >
        <i
          className={
            "fas fa-bell text-green-400 mr-3 text-lg group-hover:text-green-300 group-focus:text-green-300 transition ease-in-out duration-150"
          }
        ></i>
        Notifications
      </button>

      <SlideOver show={showNotifications} setShow={setShowNotifications}>
        <div className="bg-white h-full">
          <div className="w-full bg-gray-100 border-b sticky top-0 z-30 px-4 pb-1 lg:px-8">
            <div className="flex flex-col pt-4 py-2">
              <div className="grid grid-cols-3">
                <div>
                  <button
                    onClick={(_) => {
                      setReload(!reload);
                      setData([]);
                      setOffset(0);
                    }}
                    className="inline-flex items-center font-semibold p-2 md:py-1 bg-white hover:bg-gray-300 border rounded text-xs flex-shrink-0"
                  >
                    <i className="fa-fw fas fa-sync cursor-pointer mr-2" />{" "}
                    Reload
                  </button>
                </div>
                <div>
                  <button
                    onClick={(_) => setShowNotifications(false)}
                    className="inline-flex items-center font-semibold p-2 md:py-1 bg-white hover:bg-gray-300 border rounded text-xs flex-shrink-0"
                  >
                    <i className="fa-fw fas fa-times cursor-pointer mr-2" />{" "}
                    Close
                  </button>
                </div>
                <div>
                  <button
                    onClick={handleSubscribeClick}
                    className="inline-flex items-center font-semibold p-2 md:py-1 bg-white hover:bg-gray-300 border rounded text-xs flex-shrink-0"
                  >
                    {getButtonText()}
                  </button>
                </div>
              </div>
              <div className="font-bold text-xl mt-4">Notifications</div>
            </div>

            <div>
              <div className="w-2/3">
                <span className="text-sm font-semibold">
                  Filter by category
                </span>
                <SelectField
                  name="event_filter"
                  variant="outlined"
                  margin="dense"
                  value={eventFilter}
                  options={[
                    { id: "", text: "Show All" },
                    ...NOTIFICATION_EVENTS,
                  ]}
                  onChange={(e: any) => setEventFilter(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div>{manageResults}</div>
        </div>
      </SlideOver>
    </div>
  );
}
