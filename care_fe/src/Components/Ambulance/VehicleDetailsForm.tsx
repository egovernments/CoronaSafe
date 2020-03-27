import React, {useState} from "react";
import {Box, Button, Card, CardActions, CardContent, CardHeader, Checkbox, Grid, Typography, InputLabel, Switch} from "@material-ui/core";
import {ErrorHelperText, NativeSelectField, TextInputField} from "../Common/HelperInputFields";
import {DISTRICT_CHOICES, VEHICLE_TYPES} from "./constants";
import {isEmpty} from "lodash";
import NavigateNextIcon from '@material-ui/icons/NavigateNext';

export interface vehicleForm {
    registrationNumber: string;
    vehicleType: string;
    insuranceValidTill: number;
    nameOfOwner: string;
    ownerPhoneNumber: string;
    isSmartPhone: boolean;
    primaryDistrict: number;
    secondaryDistrict: number;
    thirdDistrict: number;
    hasOxygenSupply: boolean;
    hasVentilator: boolean;
    hasSuctionMachine: boolean;
		hasDefibrillator: boolean;
		hasFreeService: boolean;
		pricePerKm: number;
    isValid: boolean;
}

export const initVehicleData: vehicleForm = {
    registrationNumber: '',
    vehicleType: '',
    insuranceValidTill: 0,
    nameOfOwner: '',
    ownerPhoneNumber: '',
    isSmartPhone: false,
    primaryDistrict: 0,
    secondaryDistrict: 0,
    thirdDistrict: 0,
    hasOxygenSupply: false,
    hasVentilator: false,
    hasSuctionMachine: false,
		hasDefibrillator: false,
		hasFreeService: true,
		pricePerKm: 0,
    isValid: false,
};

//add empty option to districts
const allDistrictOptions: Array<{ id: number; text: string }> = [
    {
        id: 0,
        text: 'District Choice Priority',
    },
    ...DISTRICT_CHOICES];

export const VehicleDetailsForm = (props: any) => {
    const {classes, setVehicleObj, vehicleDetails} = props;
    const initForm: vehicleForm = { ...initVehicleData };
    const initErr: any = {};
    const [form, setForm] = useState<any>(Object.assign(initForm, vehicleDetails));
    const [errors, setErrors] = useState(initErr);
    const validTill = [{
        id: 0,
        text: 'Select',
    }];
    for(let i=0;i<=2;i++){
        let text = `202${i}`
        validTill.push({id:parseInt(text),text})
    }

    const vehicleTypes = [{
        id: 0,
        text: 'Select',
    }, ...VEHICLE_TYPES]

    const [districtOptions, setDistrictOptions] = useState<any>({
        primaryDistrict: [...allDistrictOptions],
        secondaryDistrict: [...allDistrictOptions],
        thirdDistrict: [...allDistrictOptions],
    });

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
        // remove selected districts from the other district options
        if (name === 'primaryDistrict' || name === 'secondaryDistrict' || name === 'thirdDistrict') {
            setDistrictOptions({
                primaryDistrict: allDistrictOptions.filter(i => !i.id || !(i.id === fieldValue.secondaryDistrict || i.id === fieldValue.thirdDistrict)),
                secondaryDistrict: allDistrictOptions.filter(i => !i.id || !(i.id === fieldValue.primaryDistrict || i.id === fieldValue.thirdDistrict)),
                thirdDistrict: allDistrictOptions.filter(i => !i.id || !(i.id === fieldValue.primaryDistrict || i.id === fieldValue.secondaryDistrict)),
            });
        }
    };

    const handleCheckboxFieldChange = (e: any) => {
        const {checked, name} = e.target;
        const fieldValue = Object.assign({}, form);
        fieldValue[name] = checked;
        setForm(fieldValue);
		};
		
		const handleFreeServiceChange = (e: any) => {
			const { checked, name } = e.target;
			const fieldValue = Object.assign({}, form);
			fieldValue[name] = checked;
			fieldValue['pricePerKm'] = 0;
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
                        err[key] = "Please Enter the vehicle number without spaces, eg: KL13AB1234";
                    }
                    break;
                case "insuranceValidTill":
                    !value && (err[key] = "This field is required");
                    break;
                case "vehicleType":
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
								case 'pricePerKm':
									if (!form['hasFreeService']) {
										if (!value) {
											err[key] = 'This field is required';
										} else if (value && !/^[+]?\d+(\.\d+)?$/.test(value)) {
											err[key] = 'Invalid price';
										}
									}
									break;
                default:
                    break;
            }
        });
        if (!isEmpty(err)) {
            setErrors(err);
            setVehicleObj({
                ...initForm,
                isValid: false,
            });
            return;
        }
        setVehicleObj({
            ...form,
            isValid: true,
        });
    };

    const handleSubmit = (e: any) => {
        e.preventDefault();
        validateData();
    };

    const handleClear = (e: any) => {
        e.preventDefault();
        setDistrictOptions({
            primaryDistrict: [ ...allDistrictOptions ],
            secondaryDistrict: [ ...allDistrictOptions ],
            thirdDistrict: [ ...allDistrictOptions ],
        });
        setErrors(initErr);
        setForm(initVehicleData);
        setVehicleObj(initVehicleData);
    }
    
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
                                        inputProps={{ maxLength: 10 }}
                                    />
                                    <div className={`nativeSelectMod ${classes.selectField}`}>
                                        <NativeSelectField
                                            name= "vehicleType"
                                            variant="outlined"
                                            options={vehicleTypes}
                                            value={form.vehicleType}
                                            onChange={handleChange}
                                            label="Vehicle Type"
                                        />
                                        <ErrorHelperText
                                            error={errors.vehicleType}
                                        />
                                    </div>

                                    <div className={`nativeSelectMod ${classes.selectField}`}>
                                        <NativeSelectField
                                            name= "insuranceValidTill"
                                            variant="outlined"
                                            options={validTill}
                                            value={form.insuranceValidTill}
                                            onChange={handleChange}
                                            label="Insurance valid till"
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
                                        type="number"
                                        placeholder=""
                                        variant="outlined"
                                        margin="dense"
                                        value={form.ownerPhoneNumber}
                                        InputLabelProps={{shrink: !!form.ownerPhoneNumber}}
                                        onChange={handleChange}
                                        errors={errors.ownerPhoneNumber}
                                        inputProps={{ maxLength: 10 }}
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
                                        <Typography variant="h6">
                                            Select Serviceable Districts
                                        </Typography>
                                    </Box>
                                    <div className={`nativeSelectMod ${classes.selectField}`}>
                                        <NativeSelectField
                                            name= "primaryDistrict"
                                            label="Primary district served"
                                            variant="outlined"
                                            options={districtOptions.primaryDistrict}
                                            value={form.primaryDistrict}
                                            onChange={handleChange}

                                        />
                                        <ErrorHelperText
                                            error={errors.primaryDistrict}
                                        />
                                    </div>
                                    <div className={`nativeSelectMod ${classes.selectField}`}>
                                        <NativeSelectField
                                            name= "secondaryDistrict"
                                            label="Secondary district served"
                                            variant="outlined"
                                            options={districtOptions.secondaryDistrict}
                                            value={form.secondaryDistrict}
                                            onChange={handleChange}
                                        />
                                        <ErrorHelperText
                                            error={errors.secondaryDistrict}
                                        />
                                    </div>
                                    <div className={`nativeSelectMod ${classes.selectField}`}>
                                        <NativeSelectField
                                            name= "thirdDistrict"
                                            label="Third district served"
                                            variant="outlined"
                                            options={districtOptions.thirdDistrict}
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
																		<Box>
																			<Typography>
																				<Switch
																					checked={form.hasFreeService}
																					onChange={handleFreeServiceChange}
																					name='hasFreeService'
																					inputProps={{ 'aria-label': 'secondary checkbox' }}
																				/>
																				I / we will provide services free of any charge.
																			</Typography>
																		</Box>
																		{!form.hasFreeService && (
																			<Box>
																				<Typography>
																					I / we will require fees for providing service @ Rs
																				</Typography>
																				<TextInputField
																					label='Price / KM'
																					name='pricePerKm'
																					placeholder=''
																					variant='outlined'
																					margin='dense'
																					value={form.pricePerKm}
																					InputLabelProps={{ shrink: !!form.pricePerKm }}
																					onChange={handleChange}
																					errors={errors.pricePerKm}
																				/>
																			</Box>
																		)}
                                </Box>
                            </CardContent>

                            <CardActions style={{justifyContent: "space-between"}}>
                                <Button
                                    color="default"
                                    type="button"
                                    onClick={e => handleClear(e)}
                                >
                                    Clear
                                </Button>
                                <Button
                                    color="primary"
                                    variant="contained"
                                    type="submit"
                                    onClick={e => handleSubmit(e)}
                                    endIcon={<NavigateNextIcon>next</NavigateNextIcon>}
                                >
                                    Save & Continue
                                </Button>
                            </CardActions>
                        </form>
                    </Card>
                </Grid>
            </Grid>
        </div>
    );
};