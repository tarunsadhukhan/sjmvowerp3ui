"use client";

import React, { useMemo, useEffect, useState } from "react";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { 
  TextField, 
  Button, 
  Card, 
  CardContent,
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  FormHelperText,
  Box,
  Typography,
  CircularProgress,
  OutlinedInput,
  Checkbox,
  ListItemText
} from "@mui/material";

interface CoFormData {
  co_name: string;
  co_prefix: string;
  co_address1: string;
  co_address2: string;
  co_zipcode: string;
  country_id: string;
  state_id: string;
  city_id: string;
  co_cin_no: string;
  co_email_id: string;
  co_pan_no: string;
  alert_email_id: string;
}

interface CoFormProps {
  initialValues?: Partial<CoFormData> | null;
  allModules: any[];
  countries: any[];
  states: any[];
  cities: any[];
  alert_email_id: string[];  
  onSubmit: (data: CoFormData) => void;
  loading: boolean;
  isEdit: boolean;
}

const CoForm: React.FC<CoFormProps> = ({
  initialValues,
  allModules,
  countries,
  states,
  cities,
  onSubmit,
  loading,
  isEdit,
}) => {
  const methods = useForm<CoFormData>({
    defaultValues: {
      co_name: "",
      co_prefix: "",
      co_address1: "",
      co_address2: "",
      co_zipcode: "",
      country_id: "",
      state_id: "",
      city_id: "",
      co_cin_no: "",
      co_email_id: "",
      co_pan_no: "",
      alert_email_id: "",
    },
  });

  const { handleSubmit, watch, control, reset, setValue, getValues } = methods;
  const watchedCountry = watch("country_id");
  const watchedState = watch("state_id");
  
  // States for filtered options
  const [filteredStates, setFilteredStates] = useState<any[]>([]);
  const [filteredCities, setFilteredCities] = useState<any[]>([]);
  
  // Effect to update states when country changes
  useEffect(() => {
    if (watchedCountry) {
      console.log(`Country selected: ${watchedCountry}`);
      
      // Filter states for the selected country
      const filtered = states.filter(state => 
        state.country_id.toString() === watchedCountry
      );
      
      setFilteredStates(filtered);
      
      // Reset state and city when country changes
      setValue("state_id", "");
      setValue("city_id", "");
      setFilteredCities([]);
    }
  }, [watchedCountry, states, setValue]);
  
  // Effect to filter cities when state changes
  useEffect(() => {
    if (watchedState) {
      console.log(`State selected: ${watchedState}`);
      
      // Filter cities for the selected state
      const filtered = cities.filter(city => 
        city.state_id.toString() === watchedState
      );
      
      setFilteredCities(filtered);
      
      // Reset city when state changes if current city isn't valid for this state
      const currentCityId = getValues("city_id");
      if (currentCityId) {
        const cityExists = filtered.some(city => city.city_id.toString() === currentCityId);
        if (!cityExists) {
          setValue("city_id", "");
        }
      }
    } else {
      setFilteredCities([]);
    }
  }, [watchedState, cities, setValue, getValues]);
  
  // Handle initial values loading
  useEffect(() => {
    if (initialValues && !loading) {
      console.log("Setting form values from initialValues:", initialValues);
      reset(initialValues);
      
      // If we have a country and state from initial values, make sure to load the associated states and cities
      if (initialValues.country_id) {
        const filtered = states.filter(state => 
          state.country_id.toString() === initialValues.country_id
        );
        setFilteredStates(filtered);
        
        if (initialValues.state_id) {
          const filteredCities = cities.filter(city => 
            city.state_id.toString() === initialValues.state_id
          );
          setFilteredCities(filteredCities);
        }
      }
    }
  }, [initialValues, reset, loading, states, cities]);

  if (loading) return <CircularProgress />;

  return (
    <Card sx={{ p: 3, maxWidth: "600px", mx: "auto", mt: 2 }}>
      <CardContent>
        <FormProvider {...methods}>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Controller
              name="co_name"
              control={control}
              rules={{ required: "Company Name is required" }}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label="Company Name"
                  fullWidth
                  margin="normal"
                  placeholder="Enter Company Name"
                  error={!!error}
                  helperText={error?.message}
                  required
                />
              )}
            />
            
            <Controller
              name="co_prefix"
              control={control}
              rules={{ required: "Prefix is required" }}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label="Prefix"
                  fullWidth
                  margin="normal"
                  placeholder="Enter prefix"
                  error={!!error}
                  helperText={error?.message}
                  required
                />
              )}
            />
                        
            <Controller
              name="co_email_id"
              control={control}
              rules={{ 
                required: "Email is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address"
                }
              }}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label="Email"
                  type="email"
                  fullWidth
                  margin="normal"
                  placeholder="Enter email"
                  error={!!error}
                  helperText={error?.message}
                  required
                />
              )}
            />
            
            <Controller
              name="co_address1"
              control={control}
              rules={{ required: "Address is required" }}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label="Address"
                  fullWidth
                  margin="normal"
                  placeholder="Enter address"
                  error={!!error}
                  helperText={error?.message}
                  required
                />
              )}
            />

            <Controller
              name="co_address2"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label="Address Line 2"
                  fullWidth
                  margin="normal"
                  placeholder="Address line 2"
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
            
            <Controller
              name="co_zipcode"
              control={control}
              rules={{ required: "Zipcode is required" }}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label="Zipcode"
                  type="number"
                  fullWidth
                  margin="normal"
                  placeholder="Enter zipcode"
                  error={!!error}
                  helperText={error?.message}
                  required
                />
              )}
            />

            <Controller
              name="country_id"
              control={control}
              rules={{ required: "Country is required" }}
              render={({ field, fieldState: { error } }) => (
                <FormControl fullWidth margin="normal" error={!!error} required>
                  <InputLabel>Country</InputLabel>
                  <Select
                    {...field}
                    label="Country"
                    value={field.value || ""}
                  >
                    {countries.map((c) => (
                      <MenuItem key={c.country_id} value={c.country_id.toString()}>
                        {c.country}
                      </MenuItem>
                    ))}
                  </Select>
                  {error && <FormHelperText>{error.message}</FormHelperText>}
                </FormControl>
              )}
            />
            
            <Controller
              name="state_id"
              control={control}
              rules={{ required: "State is required" }}
              render={({ field, fieldState: { error } }) => (
                <FormControl fullWidth margin="normal" error={!!error} required>
                  <InputLabel>State</InputLabel>
                  <Select
                    {...field}
                    label="State"
                    value={field.value || ""}
                    disabled={!watchedCountry}
                    onChange={(e) => {
                      field.onChange(e);
                      // Clear city when state changes
                      setValue("city_id", "");
                    }}
                  >
                    {filteredStates.map((s) => (
                      <MenuItem key={s.state_id} value={s.state_id.toString()}>
                        {s.state}
                      </MenuItem>
                    ))}
                  </Select>
                  {error && <FormHelperText>{error.message}</FormHelperText>}
                </FormControl>
              )}
            />
            
            <Controller
              name="city_id"
              control={control}
              rules={{ required: "City is required" }}
              render={({ field, fieldState: { error } }) => (
                <FormControl fullWidth margin="normal" error={!!error} required>
                  <InputLabel>City</InputLabel>
                  <Select
                    {...field}
                    label="City"
                    value={field.value || ""}
                    disabled={!watchedState}
                  >
                    {filteredCities.map((c) => (
                      <MenuItem key={c.city_id} value={c.city_id.toString()}>
                        {c.city_name}
                      </MenuItem>
                    ))}
                  </Select>
                  {error && <FormHelperText>{error.message}</FormHelperText>}
                </FormControl>
              )}
            />

            <Controller
              name="co_cin_no"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label="CIN Number"
                  fullWidth
                  margin="normal"
                  placeholder="Enter CIN Number"
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />

            <Controller
              name="co_pan_no"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label="PAN Number"
                  fullWidth
                  margin="normal"
                  placeholder="Enter PAN Number"
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />

            <Controller
              name="alert_email_id"
              control={control}
              render={({ field, fieldState: { error } }) => (
                <TextField
                  {...field}
                  label="Alert Email"
                  type="email"
                  fullWidth
                  margin="normal"
                  placeholder="Enter alert email"
                  error={!!error}
                  helperText={error?.message}
                />
              )}
            />
            
            <Box sx={{ mt: 3 }}>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                sx={{
                  backgroundColor: '#9BC837',
                  '&:hover': {
                    backgroundColor: '#8BB72E',
                  }
                }}
              >
                {isEdit ? "Update" : "Create"} Company
              </Button>
            </Box>
          </form>
        </FormProvider>
      </CardContent>
    </Card>
  );
};

export default CoForm;