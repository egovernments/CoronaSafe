import { CircularProgress, Grid, Typography } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import { navigate } from "hookrouter";
import moment from 'moment';
import React, { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import { getConsultation, getDailyReport } from "../../Redux/actions";
import { Loading } from "../Common/Loading";
import PageTitle from "../Common/PageTitle";
import Pagination from "../Common/Pagination";
import { ConsultationModel } from "./models";
import { DailyRoundsModel } from "../Patient/models";
import { PATIENT_CATEGORY, SYMPTOM_CHOICES } from "../../Common/constants";

const symptomChoices = [...SYMPTOM_CHOICES];
const patientCategoryChoices = [...PATIENT_CATEGORY]

export const ConsultationDetails = (props: any) => {
    const { facilityId, patientId, consultationId } = props;
    const dispatch: any = useDispatch();
    const [isLoading, setIsLoading] = useState(false);
    const [isDailyRoundLoading, setIsDailyRoundLoading] = useState(false);
    const [consultationData, setConsultationData] = useState<ConsultationModel>({});
    const [dailyRoundsListData, setDailyRoundsListData] = useState<Array<DailyRoundsModel>>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [offset, setOffset] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const limit = 5;

    const fetchData = useCallback(
        async (status: statusType) => {
            setIsLoading(true);
            const res = await dispatch(getConsultation(consultationId));
            if (!status.aborted) {
                if (res && res.data) {
                    const data: ConsultationModel = {
                        ...res.data,
                        symptoms_text: '',
                        category: patientCategoryChoices.find(i => i.id === res.data.category)?.text || res.data.category,
                    }
                    if (res.data.symptoms && res.data.symptoms.length) {
                        const symptoms = res.data.symptoms.filter((symptom: number) => symptom !== 9).map((symptom: number) => {
                            const option = symptomChoices.find(i => i.id === symptom);
                            return option ? option.text.toLowerCase() : symptom;
                        });
                        data.symptoms_text = symptoms.join(', ');
                    }
                    setConsultationData(data);
                }
                setIsLoading(false);
            }
        },
        [consultationId, dispatch]
    );

    const fetchDailyRounds = useCallback(
        async (status: statusType) => {
            setIsDailyRoundLoading(true);
            const res = await dispatch(getDailyReport({ limit, offset }, { consultationId }));
            if (!status.aborted) {
                if (res && res.data) {
                    setDailyRoundsListData(res.data.results);
                    setTotalCount(res.data.count);
                }
                setIsDailyRoundLoading(false);
            }
        },
        [consultationId, dispatch, offset]
    );

    useAbortableEffect((status: statusType) => {
        fetchData(status);
        fetchDailyRounds(status);
    }, []);

    const handlePagination = (page: number, limit: number) => {
        const offset = (page - 1) * limit;
        setCurrentPage(page);
        setOffset(offset);
    };

    if (isLoading) {
        return <Loading />;
    }

    let roundsList: any;
    if (isDailyRoundLoading) {
        roundsList = <CircularProgress size={20} />;
    } else if (dailyRoundsListData.length === 0) {
        roundsList = <Typography>No Daily Rounds data is available.</Typography>
    } else if (dailyRoundsListData.length > 0) {
        roundsList = dailyRoundsListData.map((itemData, idx) => {
            return (
                <div key={`daily_round_${idx}`} className="w-full mt-4 px-2">
                    <div className="block border rounded-lg bg-white shadow h-full cursor-pointer hover:border-primary-500 text-black">
                        <div className="p-4">
                            <Grid container justify="space-between" alignItems="center">
                                <Grid item xs={11} container spacing={1}>
                                    <Grid item xs={6}>
                                        <Typography>
                                            <span className="text-gray-700">Temperature:</span>{" "}
                                            {itemData.temperature}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={6}>
                                        <Typography>
                                            <span className="text-gray-700">Taken at :</span>{" "}
                                            {itemData.temperature_measured_at ? moment(itemData.temperature_measured_at).format('lll') : "-"}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography>
                                            <span className="text-gray-700">Physical Examination Info:</span>{" "}
                                            {itemData.physical_examination_info}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography>
                                            <span className="text-gray-700">Other Details:</span>{" "}
                                            {itemData.other_details}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </Grid>
                            <div className="mt-2">
                                <Button
                                    size="small"
                                    variant="outlined"
                                    fullWidth
                                    onClick={(e) => navigate(`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/daily-rounds/${itemData.id}`)}
                                >View Daily Rounds Details</Button>
                            </div>
                        </div>
                    </div>
                </div >
            );
        });
    }

    return (
        <div>
            <PageTitle title={`Consultation #${consultationId}`} />
            <div className="border rounded-lg bg-white shadow h-full cursor-pointer hover:border-primary-500 text-black mt-4 p-4">
                <div className="flex justify-between">
                    <div className="grid gap-2 grid-cols-1">
                        <div className="capitalize">
                            <span className="font-semibold leading-relaxed">Suggestion: </span>
                            {consultationData.suggestion_text?.toLocaleLowerCase()}
                        </div>
                        <div>
                            <span className="font-semibold leading-relaxed">Facility: </span>
                            {consultationData.facility_name || '-'}
                        </div>
                    </div>
                    <div>
                        {/* <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            size="small"
                            onClick={() =>
                                navigate(`/facility/${facilityId}/patient/${patientId}/consultation/${consultationId}/update`)
                            }
                        >Update Details</Button> */}
                    </div>
                </div>
                <div className="grid gap-2 grid-cols-1 md:grid-cols-2 mt-2">
                    <div className="md:col-span-2">
                        <span className="font-semibold leading-relaxed">Category: </span>
                        {consultationData.category || '-'}
                    </div>
                    <div>
                        <span className="font-semibold leading-relaxed">Updated on: </span>
                        {consultationData.created_date ? moment(consultationData.created_date).format("lll") : "-"}
                    </div>
                    <div>
                        <span className="font-semibold leading-relaxed">Admitted: </span>
                        {consultationData.admitted ? "Yes" : "No"}
                    </div>
                    {consultationData.admitted && (<>
                        <div>
                            <span className="font-semibold leading-relaxed">Admitted To: </span>
                            {consultationData.admitted_to || '-'}
                        </div>
                        <div>
                            <span className="font-semibold leading-relaxed">Admitted on: </span>
                            {consultationData.admission_date ? moment(consultationData.admission_date).format("lll") : '-'}
                        </div>
                        <div>
                            <span className="font-semibold leading-relaxed">Discharged on: </span>
                            {consultationData.discharge_date ? moment(consultationData.discharge_date).format("lll") : '-'}
                        </div>
                    </>)}
                </div>
                <div className="grid gap-2 grid-cols-1 md:grid-cols-2 mt-2">
                    <div className="capitalize">
                        <span className="font-semibold leading-relaxed">Symptoms: </span>
                        {consultationData.symptoms_text || '-'}
                    </div>
                    {consultationData.symptoms_onset_date && <div>
                        <span className="font-semibold leading-relaxed">Symptoms Onset Date: </span>
                        {moment(consultationData.symptoms_onset_date).format("lll")}
                    </div>}
                    {consultationData.other_symptoms && <div className="md:col-span-2 capitalize">
                        <span className="font-semibold leading-relaxed">Other Symptoms: </span>
                        {consultationData.other_symptoms}
                    </div>}
                    <div className="md:col-span-2">
                        <span className="font-semibold leading-relaxed">Existing Medication: </span>
                        {consultationData.existing_medication || '-'}
                    </div>
                    <div className="md:col-span-2">
                        <span className="font-semibold leading-relaxed">Examination Details: </span>
                        {consultationData.examination_details || '-'}
                    </div>
                    <div className="md:col-span-2">
                        <span className="font-semibold leading-relaxed">Prescribed Medication: </span>
                        {consultationData.prescribed_medication || '-'}
                    </div>
                </div>
            </div>
            <div>
                <PageTitle title="Daily Rounds" hideBack={true} />
                <div className="flex flex-wrap mt-4">
                    {roundsList}
                    {!isDailyRoundLoading && totalCount > limit && (
                        <div className="mt-4 flex w-full justify-center">
                            <Pagination
                                cPage={currentPage}
                                defaultPerPage={limit}
                                data={{ totalCount }}
                                onChange={handlePagination}
                            />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
