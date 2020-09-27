import React, { useState, useCallback } from "react";
import loadable from "@loadable/component";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { externalResult } from "../../Redux/actions";
import { navigate, Link } from "raviger";
import Button from "@material-ui/core/Button";
import QRCode from "qrcode.react";
import { GENDER_TYPES, TEST_TYPE_CHOICES } from "../../Common/constants";
import moment from "moment";
import Dialog from "@material-ui/core/Dialog";
import DialogActions from "@material-ui/core/DialogActions";
import DialogContent from "@material-ui/core/DialogContent";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogTitle from "@material-ui/core/DialogTitle";
import * as Notification from "../../Utils/Notifications.js";
const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

export default function ResultItem(props: any) {
  console.log("hola")
  const dispatch: any = useDispatch();
  let initialData: any = {};
  const [data, setData] = useState(initialData);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(externalResult(props.id));
      if (!status.aborted) {
        if (res && res.data) {
          setData(res.data);
        }
        setIsLoading(false);
      }
    },
    [props.id, dispatch]
  );

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [fetchData]
  );

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="mt-4">
      <PageTitle title={"Result details"} />
      <div className="mx-3 md:mx-8 mb-10">
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {data.name} - {data.age} {data.age_in}  | {data.result}
            </h3>
            <p className="mt-1 max-w-2xl text-sm leading-5 text-gray-500">
              SRF ID: {data.srf_id}
            </p>
          </div>
          <div className="px-4 py-5 sm:p-0">
            <dl>
              <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 sm:py-5">
                <dt className="text-sm leading-5 font-medium text-gray-500">
                  Gender
                </dt>
                <dd className="mt-1 text-sm leading-5 text-gray-900 sm:mt-0 sm:col-span-2">
                  {data.gender}
                </dd>
              </div>
              <div className="mt-8 sm:mt-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:border-t sm:border-gray-200 sm:px-6 sm:py-5">
                <dt className="text-sm leading-5 font-medium text-gray-500">
                  Address
                </dt>
                <dd className="mt-1 text-sm leading-5 text-gray-900 sm:mt-0 sm:col-span-2">
                  {data.address}

                  {data.ward_object && <div className="mt-1">
                    Ward: {data.ward_object.number} {data.ward_object.name}
                  </div>}
                  {data.local_body_object && <div className="mt-1">
                    {data.local_body_object.name}
                  </div>}
                </dd>
              </div>
              <div className="mt-8 sm:mt-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:border-t sm:border-gray-200 sm:px-6 sm:py-5">
                <dt className="text-sm leading-5 font-medium text-gray-500">
                  Mobile Number
                </dt>
                <dd className="mt-1 text-sm leading-5 text-gray-900 sm:mt-0 sm:col-span-2">
                  {data.mobile_number}
                </dd>
              </div>
              <div className="mt-8 sm:mt-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:border-t sm:border-gray-200 sm:px-6 sm:py-5">
                <dt className="text-sm leading-5 font-medium text-gray-500">
                  Repeat?
                </dt>
                <dd className="mt-1 text-sm leading-5 text-gray-900 sm:mt-0 sm:col-span-2">
                  {data.is_repeat ? "Yes" : "No"}
                </dd>
              </div>
              <div className="mt-8 sm:mt-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:border-t sm:border-gray-200 sm:px-6 sm:py-5">
                <dt className="text-sm leading-5 font-medium text-gray-500">
                  Patient Status
                 </dt>
                <dd className="mt-1 text-sm leading-5 text-gray-900 sm:mt-0 sm:col-span-2">
                  {data.patient_status}
                </dd>
              </div>
              <div className="mt-8 sm:mt-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:border-t sm:border-gray-200 sm:px-6 sm:py-5">
                <dt className="text-sm leading-5 font-medium text-gray-500">
                  Sample Type
                 </dt>
                <dd className="mt-1 text-sm leading-5 text-gray-900 sm:mt-0 sm:col-span-2">
                  {data.sample_type}
                </dd>
              </div>
              <div className="mt-8 sm:mt-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:border-t sm:border-gray-200 sm:px-6 sm:py-5">
                <dt className="text-sm leading-5 font-medium text-gray-500">
                  Test Type
                 </dt>
                <dd className="mt-1 text-sm leading-5 text-gray-900 sm:mt-0 sm:col-span-2">
                  {data.test_type}
                </dd>
              </div>
              <div className="mt-8 sm:mt-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:border-t sm:border-gray-200 sm:px-6 sm:py-5">
                <dt className="text-sm leading-5 font-medium text-gray-500">
                  Sample collection date
                 </dt>
                <dd className="mt-1 text-sm leading-5 text-gray-900 sm:mt-0 sm:col-span-2">
                  {moment(data.sample_collection_date).format("lll")}
                </dd>
              </div>
              <div className="mt-8 sm:mt-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:border-t sm:border-gray-200 sm:px-6 sm:py-5">
                <dt className="text-sm leading-5 font-medium text-gray-500">
                  Result Date
                 </dt>
                <dd className="mt-1 text-sm leading-5 text-gray-900 sm:mt-0 sm:col-span-2">
                  {moment(data.result_date).format("lll")}
                </dd>
              </div>
              <div className="mt-8 sm:mt-0 sm:grid sm:grid-cols-3 sm:gap-4 sm:border-t sm:border-gray-200 sm:px-6 sm:py-5">
                <dt className="text-sm leading-5 font-medium text-gray-500">
                  Result
                 </dt>
                <dd className="mt-1 text-sm leading-5 text-gray-900 sm:mt-0 sm:col-span-2">
                  {data.result}
                </dd>
              </div>
            </dl>
          </div>
        </div>

      </div>
    </div>
  )
}
