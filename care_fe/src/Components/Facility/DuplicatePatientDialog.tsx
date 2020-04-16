import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Paper, FormControlLabel, Radio, Box, RadioGroup, InputLabel } from '@material-ui/core';
import CheckCircleOutlineIcon from '@material-ui/icons/CheckCircleOutline';
import { WithStyles, withStyles } from '@material-ui/styles';
import React, { useState } from 'react';
import { CheckboxField } from '../Common/HelperInputFields';
import { VirtualizedTable } from '../Common/VirtualizedTable';
import { DupPatientModel } from './models';

interface Props {
    patientList: Array<DupPatientModel>;
    handleOk: (action: string) => void;
    handleCancel: () => void;
    isNew: boolean;
};

const styles = {
    paper: {
        "max-width": "650px",
        "min-width": "400px",
    }
};

const columns = [
    {
        width: 120,
        label: 'Patient ID',
        dataKey: 'patient_id'
    },
    {
        width: 200,
        flexGrow: 1,
        label: 'Name',
        dataKey: 'name',
    },
    {
        width: 120,
        label: 'Gender',
        dataKey: 'gender',
    },
];

const DuplicatePatientDialog = (props: Props & WithStyles<typeof styles>) => {
    const { patientList, handleOk, handleCancel, classes, isNew } = props;
    const [action, setAction] = useState("")

    const text = isNew ? 'registration' : 'update';

    return (
        <Dialog
            open={true}
            classes={{
                paper: classes.paper,
            }}
        >
            <DialogTitle id="test-sample-title">Possible Duplicate Entry!</DialogTitle>
            <DialogContent>
                <div className="grid gap-4 grid-cols-1">
                    <div>
                        <p className="leading-relaxed">The following suspect's / patient's are having the Phone Number <span className="font-bold">{patientList[0].phone_number}</span>:</p>
                    </div>
                    <div>
                        <Paper variant="outlined" style={{ height: 200, width: '100%' }}>
                            <VirtualizedTable
                                rowCount={patientList.length}
                                rowGetter={({ index }: any) => patientList[index]}
                                columns={columns}
                            />
                        </Paper>
                    </div>
                    <div>
                        <InputLabel className="mb-2">Please select one option to continue or click Cancel</InputLabel>
                        <RadioGroup
                            name="confirm_action"
                            value={action}
                            onChange={(e: any) => setAction(e.target.value)}
                            style={{ padding: "0px 5px" }}
                        >
                            <Box display="flex" flexDirection="column">
                                <FormControlLabel
                                    value="close"
                                    control={<Radio />}
                                    label="I confirm that the suspect / patient is different from the above list"
                                />
                                <FormControlLabel
                                    value="transfer"
                                    control={<Radio />}
                                    label="I want to transfer the suspect / patient to my facility"
                                />
                            </Box>
                        </RadioGroup>
                        {/* <CheckboxField
                            checked={confirm}
                            onChange={(e: any) => setConfirm(e.target.checked)}
                            name="confirm"
                            label="I confirm that I'm registering a different suspect / patient"
                        /> */}
                    </div>
                </div>
            </DialogContent>
            <DialogActions style={{ justifyContent: "space-between" }}>
                <Button
                    className="capitalize"
                    color="secondary"
                    onClick={() => handleCancel()}
                >Cancel {text}</Button>
                <Button
                    onClick={() => handleOk(action)}
                    color="primary"
                    variant="contained"
                    disabled={!action}
                    startIcon={<CheckCircleOutlineIcon>save</CheckCircleOutlineIcon>}
                >Continue</Button>
            </DialogActions>
        </Dialog>
    );
};

export default withStyles(styles)(DuplicatePatientDialog);
