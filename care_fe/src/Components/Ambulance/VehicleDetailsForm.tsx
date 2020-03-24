import React, {useState} from "react";
import {Box, Button, Card, CardActions, CardContent, CardHeader, Checkbox, Grid, Typography, InputLabel, FormControl} from "@material-ui/core";
import {DateInputField, ErrorHelperText, NativeSelectField, TextInputField} from "../Common/HelperInputFields";
import {DISTRICT_CHOICES} from "./constants";
import {isEmpty} from "lodash";


//add empty option to districts
const districtOptions = [
    {
        id: "",
        text: "District Choice Priority"
    },
    ...DISTRICT_CHOICES];

export const VehicleDetailsForm = (props: any) => {
    const {classes, setVehicleObj, vehicleDetails} = props;
    const initForm: any = {
        registrationNumber: "",
        insuranceValidTill: null,
        nameOfOwner: "",
        ownerPhoneNumber: "",
        isSmartPhone: false,
        primaryDistrict: null,
        secondaryDistrict: null,
        thirdDistrict: null,
        hasOxygenSupply: false,
        hasVentilator: false,
        hasSuctionMachine: false,
        hasDefibrillator: false
    };
    const initErr: any = {};
    const [form, setForm] = useState<any>(Object.assign(initForm, vehicleDetails));
    const [errors, setErrors] = useState(initErr);
    const inputLabel = React.useRef<HTMLLabelElement>(null);
    const validTill = [{
        id: "",
        text: "Select"
    }];
    for(let i=0;i<=2;i++){
        let text = `202${i}`
        validTill.push({id:text,text})
    }

    const handleChange = (e: any) => {
        const {value, name} = e.target;
        const fieldValue = Object.assign({}, form);
        const errorField = Object.assign({}, errors);
        if (errorField[name]) {
            errorField[name] = null;
            setErrors(errorField);
        }
        let fValue = value;
        if(name === 'primaryDistrict' ||  name === 'secondaryDistrict' || name === 'thirdDistrict' || name === 'insuranceValidTill'){
            fValue = parseInt(fValue)
        }
        fieldValue[name] = fValue;
        setForm(fieldValue);
    };

    const handleCheckboxFieldChange = (e: any) => {
        const {checked, name} = e.target;
        const fieldValue = Object.assign({}, form);
        fieldValue[name] = checked;
        setForm(fieldValue);
    };

    const validateData = () => {
        const err:any = {};
        Object.keys(form).forEach(key => {
            const value = form[key];
            switch (key) {
                case "registrationNumber":
                    if (!value) {
                        err[key] = "This field is required";
                    }else if(value && !(/^[a-zA-Z]{2}[0-9]{1,2}[a-zA-Z]{1,2}[0-9]{1,4}$/.test(value))){
                        err[key] = "Please Enter the vehicle number in all uppercase without spaces, eg: KL13AB1234";
                    }
                    break;
                case "insuranceValidTill":
                    !value && (err[key] = "This field is required");
                    break;
                case "nameOfOwner":
                    !value && (err[key] = "This field is required");
                    break;
                case "ownerPhoneNumber":
                    if (!value) {
                        err[key] = "This field is required";
                    } else if(value &&!(/^[0-9]{10}$/.test(value))) {
                        err[key] = "Invalid phone number";
                    }
                    break;
                case "primaryDistrict":
                case "secondaryDistrict":
                case "thirdDistrict":
                    !value && (err[key] = "This field is required");
                    break;
                default:
                    break;
            }
        });
        if (!isEmpty(err)) {
            setErrors(err);
            return false;
        }
        return form;
    };

    const handleSubmit = (e: any) => {
        e.preventDefault();
        const valid = validateData();
        if (valid) {
            setVehicleObj(form);
        }
    };
    
    return (
        <div>
            <Grid container alignContent="center" justify="center">
                <Grid item xs={12}>
                    <Card style={{marginBottom: '20px'}}>
                        <CardHeader title="Vehicle Details"/>
                        <form onSubmit={e => {
                            handleSubmit(e)
                        }} className={`${classes.formBottomPadding}`}>
                            <CardContent className={classes.cardContent}>
                                <Box display="flex" flexDirection="column">
                                    <TextInputField
                                        label="Vehicle registration number"
                                        name="registrationNumber"
                                        placeholder="eg: KL13AB1234"
                                        variant="outlined"
                                        margin="dense"
                                        InputLabelProps={{shrink: !!form.registrationNumber}}
                                        value={form.registrationNumber}
                                        onChange={handleChange}
                                        errors={errors.registrationNumber}
                                    />

                                    <div className={`nativeSelectMod ${classes.selectField}`}>
                                        <InputLabel className={classes.selectLabel} ref={inputLabel} id="insuranceValidTill">
                                            Insurance valid till
                                        </InputLabel>
                                        <NativeSelectField
                                            inputProps={{
                                                name: "insuranceValidTill"
                                            }}
                                            placeholder="Insurance valid till"
                                            variant="outlined"
                                            margin="dense"
                                            InputLabelProps={{shrink: !!form.insuranceValidTill}}
                                            options={validTill}
                                            value={form.insuranceValidTill}
                                            onChange={handleChange}

                                        />
                                        <ErrorHelperText
                                            error={errors.insuranceValidTill}
                                        />
                                    </div>
                                    <TextInputField
                                        label="Name of owner"
                                        name="nameOfOwner"
                                        placeholder=""
                                        variant="outlined"
                                        margin="dense"
                                        value={form.nameOfOwner}
                                        InputLabelProps={{shrink: !!form.nameOfOwner}}
                                        onChange={handleChange}
                                        errors={errors.nameOfOwner}
                                    />
                                    <TextInputField
                                        label="Owner phone number"
                                        name="ownerPhoneNumber"
                                        placeholder=""
                                        variant="outlined"
                                        margin="dense"
                                        value={form.ownerPhoneNumber}
                                        InputLabelProps={{shrink: !!form.ownerPhoneNumber}}
                                        onChange={handleChange}
                                        errors={errors.ownerPhoneNumber}
                                    />
                                    <Box display="flex" flexDirection="row" justifyItems="flex-start"
                                         alignItems="center">
                                        <Checkbox
                                            checked={form.isSmartPhone}
                                            onChange={handleCheckboxFieldChange}
                                            name="isSmartPhone"
                                        />
                                        <Typography className={classes.checkBoxLabel}> Do you have a smart phone
                                            ?</Typography>
                                    </Box>
                                    <Box>
                                        <Typography>
                                            Select Serviceable Districts
                                        </Typography>
                                    </Box>
                                    <div className={`nativeSelectMod ${classes.selectField}`}>
                                        <NativeSelectField
                                            inputProps={{
                                                name: "primaryDistrict"
                                            }}
                                            placeholder="Primary district served"
                                            variant="outlined"
                                            margin="dense"
                                            InputLabelProps={{shrink: !!form.primaryDistrict}}
                                            options={districtOptions}
                                            value={form.primaryDistrict}
                                            onChange={handleChange}

                                        />
                                        <ErrorHelperText
                                            error={errors.primaryDistrict}
                                        />
                                    </div>
                                    <div className={`nativeSelectMod ${classes.selectField}`}>
                                        <NativeSelectField
                                            inputProps={{
                                                name: "secondaryDistrict"
                                            }}
                                            placeholder="Secondary district served"
                                            variant="outlined"
                                            margin="dense"

                                            options={districtOptions}
                                            value={form.secondaryDistrict}
                                            onChange={handleChange}
                                        />
                                        <ErrorHelperText
                                            error={errors.secondaryDistrict}
                                        />
                                    </div>
                                    <div className={`nativeSelectMod ${classes.selectField}`}>
                                        <NativeSelectField
                                            inputProps={{
                                                name: "thirdDistrict"
                                            }}
                                            placeholder="Third district served"
                                            variant="outlined"
                                            margin="dense"
                                            options={districtOptions}
                                            value={form.thirdDistrict}
                                            onChange={handleChange}
                                        />
                                        <ErrorHelperText error={errors.thirdDistrict}/>
                                    </div>
                                    <Box>
                                        <Typography>
                                            Select Your Ambulance Features
                                        </Typography>
                                    </Box>
                                    <Box display="flex" flexDirection="row" justifyItems="flex-start"
                                         alignItems="center">
                                        <Checkbox
                                            checked={form.hasOxygenSupply}
                                            onChange={handleCheckboxFieldChange}
                                            name="hasOxygenSupply"
                                        />
                                        <Typography className={classes.checkBoxLabel}>
                                            Has Oxygen Supply
                                        </Typography>
                                    </Box>
                                    <Box display="flex" flexDirection="row" justifyItems="flex-start"
                                         alignItems="center">
                                        <Checkbox
                                            checked={form.hasVentilator}
                                            onChange={handleCheckboxFieldChange}
                                            name="hasVentilator"
                                        />
                                        <Typography className={classes.checkBoxLabel}>
                                            Has ventilator
                                        </Typography>
                                    </Box>
                                    <Box display="flex" flexDirection="row" justifyItems="flex-start"
                                         alignItems="center">
                                        <Checkbox
                                            checked={form.hasSuctionMachine}
                                            onChange={handleCheckboxFieldChange}
                                            name="hasSuctionMachine"
                                        />
                                        <Typography className={classes.checkBoxLabel}>
                                            Has suction machine
                                        </Typography>
                                    </Box>
                                    <Box display="flex" flexDirection="row" justifyItems="flex-start"
                                         alignItems="center">
                                        <Checkbox
                                            checked={form.hasDefibrillator}
                                            onChange={handleCheckboxFieldChange}
                                            name="hasDefibrillator"
                                        />
                                        <Typography className={classes.checkBoxLabel}>
                                            Has defibrilator
                                        </Typography>
                                    </Box>
                                </Box>
                            </CardContent>

                            <CardActions>
                                <Button
                                    color="primary"
                                    variant="contained"
                                    type="submit"
                                    style={{marginLeft: "auto"}}
                                    onClick={e => handleSubmit(e)}
                                >
                                    Next
                                </Button>
                            </CardActions>
                        </form>
                    </Card>
                </Grid>
            </Grid>
        </div>
    );
};
