import { Button } from "@material-ui/core";
import { navigate } from "hookrouter";
import moment from 'moment';
import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { CURRENT_HEALTH_CHANGE, PATIENT_CATEGORY, SYMPTOM_CHOICES } from "../../Common/constants";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getConsultationDailyRoundsDetails } from "../../Redux/actions";
import { Loading } from "../Common/Loading";
import PageTitle from "../Common/PageTitle";
import { DailyRoundsModel } from "./models";

const symptomChoices = [...SYMPTOM_CHOICES];
const currentHealthChoices = [...CURRENT_HEALTH_CHANGE];
const patientCategoryChoices = [...PATIENT_CATEGORY]

export const DailyRoundListDetails = (props: any) => {
  const { facilityId, patientId, consultationId, id } = props;
  const dispatch: any = useDispatch();
  const [dailyRoundListDetailsData, setDailyRoundListDetails] = useState<DailyRoundsModel>({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchpatient = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      const res = await dispatch(getConsultationDailyRoundsDetails(id, { consultationId }));
      if (!status.aborted) {
        if (res && res.data) {
          const currentHealth = currentHealthChoices.find(i => i.text === res.data.current_health);
          const data: DailyRoundsModel = {
            ...res.data,
            temperature: Number(res.data.temperature) ? res.data.temperature : '',
            additional_symptoms_text: '',
            patient_category: patientCategoryChoices.find(i => i.id === res.data.patient_category)?.text || res.data.patient_category,
            current_health: currentHealth ? currentHealth.desc : res.data.current_health,
          }
          if (res.data.additional_symptoms && res.data.additional_symptoms.length) {
            const symptoms = res.data.additional_symptoms.map((symptom: number) => {
              const option = symptomChoices.find(i => i.id === symptom);
              return option ? option.text.toLowerCase() : symptom;
            });
            data.additional_symptoms_text = symptoms.join(', ');
          }
          setDailyRoundListDetails(data);
        }
        setIsLoading(false);
      }
    },
    [consultationId, dispatch, id]
  );
  useAbortableEffect(
    (status: statusType) => {
      fetchpatient(status);
    },
    [dispatch, fetchpatient]
  );

  if (isLoading) {
    return <Loading />;
  }

  return (
    <div className="px-2">
      <PageTitle title={`Daily Rounds #${id}`} />
      <div className="border rounded-lg bg-white shadow h-full cursor-pointer hover:border-primary-500 text-black mt-4 p-4">
        <div className="flex justify-between">
          <div className="max-w-md">
            <div>
              <span className="font-semibold leading-relaxed">Patient Category: </span>
              {dailyRoundListDetailsData.patient_category || '-'}
            </div>
            <div className="capitalize mt-4">
              <span className="font-semibold leading-relaxed">Current Health: </span>
              {dailyRoundListDetailsData.current_health || '-'}
            </div>
          </div>

          <div>
            <div className="mt-2">
              <Button
                fullWidth
                variant="contained"
                color="primary"
                size="small"
                onClick={() =>
                  navigate(`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily-rounds/${id}/update`)
                }
              >Update Details</Button>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 grid-cols-1 md:grid-cols-2">
          <div>
            <span className="font-semibold leading-relaxed">Temperature: </span>
            {dailyRoundListDetailsData.temperature || '-'}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Taken at: </span>
            {dailyRoundListDetailsData.temperature_measured_at ? moment(dailyRoundListDetailsData.temperature_measured_at).format('lll') : '-'}
          </div>
          <div className="md:col-span-2 capitalize">
            <span className="font-semibold leading-relaxed">Additional Symptoms: </span>
            {dailyRoundListDetailsData.additional_symptoms_text || '-'}
          </div>
          <div className="md:col-span-2">
            <span className="font-semibold leading-relaxed">Physical Examination Info: </span>
            {dailyRoundListDetailsData.physical_examination_info || '-'}
          </div>
          <div className="md:col-span-2">
            <span className="font-semibold leading-relaxed">Other Symptoms: </span>
            {dailyRoundListDetailsData.other_symptoms || '-'}
          </div>
          <div className="md:col-span-2">
            <span className="font-semibold leading-relaxed">Other Details: </span>
            {dailyRoundListDetailsData.other_details || '-'}
          </div>
          <div>
            <span className="font-semibold leading-relaxed">Recommend Discharge: </span>
            {dailyRoundListDetailsData.recommend_discharge ? <span className="badge badge-pill badge-warning">Yes</span> : <span className="badge badge-pill badge-secondary">No</span>}
          </div>
        </div>

      </div>
    </div>
  );
};
