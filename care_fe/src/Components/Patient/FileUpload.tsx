import axios from "axios";
import {
  Button,
  Card,
  CardContent,
  CircularProgress,
  InputLabel,
} from "@material-ui/core";
import moment from "moment";
import CloudUploadOutlineIcon from "@material-ui/icons/CloudUpload";
import loadable from "@loadable/component";
import React, {
  useCallback,
  useState,
  useRef,
  ChangeEvent,
  useEffect,
} from "react";
import { useDispatch } from "react-redux";
import { statusType, useAbortableEffect } from "../../Common/utils";
import {
  viewUpload,
  retrieveUpload,
  createUpload,
  getUserList,
} from "../../Redux/actions";
import { FlowModel, FileUploadModel } from "./models";
import { TextInputField } from "../Common/HelperInputFields";
import LinearProgress from "@material-ui/core/LinearProgress";
import Typography from "@material-ui/core/Typography";
import Box from "@material-ui/core/Box";
import GetAppIcon from "@material-ui/icons/GetApp";
import * as Notification from "../../Utils/Notifications.js";
import { VoiceRecorder } from "../../Utils/VoiceRecorder";

const Loading = loadable(() => import("../Common/Loading"));
const PageTitle = loadable(() => import("../Common/PageTitle"));

const LinearProgressWithLabel = (props: any) => {
  return (
    <Box display="flex" alignItems="center">
      <Box width="100%" mr={1}>
        <LinearProgress variant="determinate" {...props} />
      </Box>
      <Box minWidth={35}>
        <Typography variant="body2" color="textSecondary">{`${Math.round(
          props.value
        )}%`}</Typography>
      </Box>
    </Box>
  );
};

interface FileUploadProps {
  type: string;
  patientId: any;
  facilityId: any;
  consultationId: any;
  hideBack: boolean;
  audio: boolean;
  unspecified: boolean;
}

interface AudioURLS {
  [id: string]: string;
}

export const FileUpload = (props: FileUploadProps) => {
  const [audioBlob, setAudioBlob] = useState<Blob>();
  const [file, setfile] = useState<File>();
  const {
    facilityId,
    consultationId,
    patientId,
    type,
    hideBack,
    audio,
    unspecified,
  } = props;
  const id = patientId;
  const dispatch: any = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setuploadedFiles] = useState<Array<FileUploadModel>>([
    {},
  ]);
  const [uploadStarted, setUploadStarted] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [reload, setReload] = useState<boolean>(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadFileName, setUploadFileName] = useState<string>("");
  const [url, seturl] = useState<AudioURLS>({});

  const UPLOAD_HEADING: { [index: string]: string } = {
    PATIENT: "Upload Patient Files",
    CONSULTATION: "Upload Consultation Files",
  };
  const VIEW_HEADING: { [index: string]: string } = {
    PATIENT: "View Patient Files",
    CONSULTATION: "View Consultation Files",
  };

  const getAssociatedId = () => {
    switch (type) {
      case "PATIENT": {
        return patientId;
      }
      case "CONSULTATION": {
        return consultationId;
      }
    }
  };

  const fetchData = useCallback(
    async (status: statusType) => {
      setIsLoading(true);
      var data = { file_type: type, associating_id: getAssociatedId() };
      const res = await dispatch(viewUpload(data));
      if (!status.aborted) {
        if (res && res.data) {
          audio_urls(res.data.results);
          console.log("Results is ", res.data.results);
          setuploadedFiles(res.data.results);
        }
        setIsLoading(false);
      }
    },
    [dispatch, id]
  );

  // Store all audio urls for each audio file
  const audio_urls = (files: any) => {
    let audio_files = files;
    audio_files = audio_files.filter(
      (x: FileUploadModel) => x.file_category === "AUDIO"
    );

    const getURL = async (audio_files: any) => {
      var data = { file_type: type, associating_id: getAssociatedId() };
      let all_urls: any = {};

      for (const x of audio_files) {
        if (x.id) {
          var responseData = await dispatch(retrieveUpload(data, x.id));
          all_urls[`${x.id}`] = responseData.data.read_signed_url;
        }
      }
      seturl(all_urls);
    };
    getURL(audio_files);
  };

  useAbortableEffect(
    (status: statusType) => {
      fetchData(status);
    },
    [dispatch, fetchData, id, reload]
  );

  const loadFile = async (id: any) => {
    var data = { file_type: type, associating_id: getAssociatedId() };
    var responseData = await dispatch(retrieveUpload(data, id));
    window.open(responseData.data.read_signed_url, "_blank");
    console.log(responseData);
  };

  const renderFileUpload = (item: FileUploadModel) => {
    return (
      <Card className="mt-4" key={item.id}>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <div>
              <span className="font-semibold leading-relaxed">Name: </span>{" "}
              {item.name}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">Created By:</span>{" "}
              {item.uploaded_by ? item.uploaded_by.username : null}
            </div>
            <div>
              <span className="font-semibold leading-relaxed">
                Created On :
              </span>{" "}
              {item.created_date
                ? moment(item.created_date).format("lll")
                : "-"}
            </div>
            <div>
              {item.file_category === "AUDIO" ? (
                <div>
                  {item.id ? (
                    Object.keys(url).length > 0 ? (
                      <audio src={url[item.id]} controls preload="auto" />
                    ) : (
                      <CircularProgress />
                    )
                  ) : (
                    <div>File Not found</div>
                  )}
                </div>
              ) : (
                <div>
                  <Button
                    color="primary"
                    variant="contained"
                    type="submit"
                    style={{ marginLeft: "auto" }}
                    startIcon={<GetAppIcon>load</GetAppIcon>}
                    onClick={() => {
                      loadFile(item.id);
                    }}
                  >
                    Load File
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return <Loading />;
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>): any => {
    if (e.target.files == null) {
      throw new Error("Error finding e.target.files");
    }
    setfile(e.target.files[0]);
    return e.target.files[0];
  };

  const uploadfile = (response: any) => {
    var url = response.data.signed_url;
    var internal_name = response.data.internal_name;
    const f = file;
    if (f === undefined) return;
    const newFile = new File([f], `${internal_name}`);

    console.log(newFile);

    const config = {
      onUploadProgress: (progressEvent: any) => {
        var percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadPercent(percentCompleted);
      },
    };

    axios
      .put(url, newFile, config)
      .then((result) => {
        setUploadStarted(false);
        setUploadSuccess(true);
        setUploadFileName("");
        setReload(!reload);
        Notification.Success({
          msg: "File Uploaded Successfully",
        });
      })
      .catch((error) => {
        setUploadStarted(false);
      });
  };

  const handleUpload = async (e: any) => {
    const f = file;
    if (f === undefined) return;
    const category = "UNSPECIFIED";
    const filename = uploadFileName;
    let name = f.name;
    setUploadStarted(true);
    setUploadSuccess(false);
    const requestData = {
      original_name: name,
      file_type: type,
      name: filename,
      associating_id: getAssociatedId(),
      file_category: category,
    };
    dispatch(createUpload(requestData))
      .then(uploadfile)
      .catch(() => {
        setUploadStarted(false);
      });
  };

  const createAudioBlob = (createdBlob: Blob) => {
    setAudioBlob(createdBlob);
    console.log("from file upload");
    console.log(audioBlob);
  };

  const uploadAudiofile = (response: any) => {
    var url = response.data.signed_url;
    var internal_name = response.data.internal_name + ".mp3";
    const f = audioBlob;
    if (f === undefined) return;
    const newFile = new File([f], `${internal_name}`, { type: "audio/mpeg" });

    console.log(newFile);

    const config = {
      onUploadProgress: (progressEvent: any) => {
        var percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setUploadPercent(percentCompleted);
      },
    };

    axios
      .put(url, newFile, config)
      .then((result) => {
        setUploadStarted(false);
        setUploadSuccess(true);
        setUploadFileName("");
        setReload(!reload);
        Notification.Success({
          msg: "File Uploaded Successfully",
        });
      })
      .catch((error) => {
        setUploadStarted(false);
      });
  };

  const handleAudioUpload = async (e: any) => {
    const f = audioBlob;
    if (f === undefined) return;
    const category = "AUDIO";
    const filename = Date.now().toString();
    let name = "audio";
    setUploadStarted(true);
    setUploadSuccess(false);
    const requestData = {
      original_name: name,
      file_type: type,
      name: filename,
      associating_id: getAssociatedId(),
      file_category: category,
    };
    dispatch(createUpload(requestData))
      .then(uploadAudiofile)
      .catch(() => {
        setUploadStarted(false);
      });
  };

  return (
    <div className={hideBack ? "py-2" : "p-4"}>
      <PageTitle title={`${UPLOAD_HEADING[type]}`} hideBack={hideBack} />
      <Card className="mt-4">
        <CardContent>
          <div className="md:grid grid-cols-1 ">
            {audio ? (
              <div>
                <div>
                  <h4>Record and Upload Audio File</h4>
                </div>
                <VoiceRecorder createAudioBlob={createAudioBlob} />
                <Button
                  color="primary"
                  variant="contained"
                  type="submit"
                  style={{ marginLeft: "auto", float: "right" }}
                  startIcon={
                    <CloudUploadOutlineIcon>save</CloudUploadOutlineIcon>
                  }
                  onClick={(e) => {
                    handleAudioUpload(e);
                  }}
                >
                  Upload
                </Button>
              </div>
            ) : null}
            {unspecified ? (
              <div>
                <div>
                  <h4>Upload New File</h4>
                </div>
                <div>
                  <InputLabel id="spo2-label">Enter File Name</InputLabel>
                  <TextInputField
                    name="temperature"
                    variant="outlined"
                    margin="dense"
                    type="text"
                    InputLabelProps={{ shrink: !!uploadFileName }}
                    value={uploadFileName}
                    disabled={uploadStarted}
                    onChange={(e) => {
                      setUploadFileName(e.target.value);
                    }}
                    errors={`${[]}`}
                  />
                </div>
                <div className="mt-4">
                  {uploadStarted ? (
                    <LinearProgressWithLabel value={uploadPercent} />
                  ) : (
                    <div>
                      <input
                        title="changeFile"
                        onChange={onFileChange}
                        type="file"
                      />
                      <Button
                        color="primary"
                        variant="contained"
                        type="submit"
                        style={{ marginLeft: "auto", float: "right" }}
                        startIcon={
                          <CloudUploadOutlineIcon>save</CloudUploadOutlineIcon>
                        }
                        onClick={(e) => {
                          handleUpload(e);
                        }}
                      >
                        Upload
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <PageTitle title={`${VIEW_HEADING[type]}`} hideBack={true} />
      {uploadedFiles.length > 0 &&
        uploadedFiles.map((item: FileUploadModel) => renderFileUpload(item))}
    </div>
  );
};
