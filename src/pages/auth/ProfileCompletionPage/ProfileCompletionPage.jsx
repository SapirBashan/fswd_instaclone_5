import React from "react";
import ProfileCompletion from "../../../components/forms/auth/ProfileCompletion/ProfileCompletion";
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Grid,
  CircularProgress,
  Alert,
} from "@mui/material";

const ProfileCompletionPage = () => {
  const {
    user,
    formData,
    error,
    isLoading,
    activeSection,
    setActiveSection,
    handlePersonalChange,
    handleAddressChange,
    handleGeoChange,
    handleCompanyChange,
    handleSubmit,
    handleSkip,
  } = ProfileCompletion();

  // Custom styling for text fields to remove outer border
  const textFieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "6px",
      paddingY: "0",
      "& input": {
        paddingY: "0.6rem",
        paddingX: "1rem",
        fontSize: "1rem",
        lineHeight: 1.5,
      },
    },
    "& .MuiOutlinedInput-notchedOutline": {
      border: "none",
    },
    bgcolor: "#f5f5f5", // Light background to make fields visible
  };

  // Helper for tab switching
  const handleTabChange = (event, newValue) => {
    setActiveSection(newValue);
  };

  if (isLoading && !user) {
    return (
      <Box
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          bgcolor: "#fafafa",
        }}
      >
        <CircularProgress size={60} />
        <Typography variant="body1" sx={{ mt: 3 }}>
          Loading user data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: "auto",
        bgcolor: "#fafafa",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        p: 2,
      }}
    >
      <Paper
        elevation={3}
        sx={{
          width: "100%",
          maxWidth: 600,
          p: 4,
          borderRadius: 2,
          mx: "auto",
        }}
      >
        <Typography
          variant="h4"
          component="h1"
          align="center"
          sx={{
            fontWeight: 600,
            mb: 4,
            color: "#262626",
          }}
        >
          Complete Your Profile
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Box sx={{ width: "100%" }}>
          <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 4 }}>
            <Tabs
              value={activeSection}
              onChange={handleTabChange}
              variant="fullWidth"
              aria-label="Profile completion tabs"
              sx={{
                "& .MuiTab-root": {
                  fontWeight: 500,
                  fontSize: "0.95rem",
                },
              }}
            >
              <Tab label="Personal Info" value="personal" />
              <Tab label="Address" value="address" />
              <Tab label="Company" value="company" />
            </Tabs>
          </Box>

          <Box sx={{ mb: 4 }}>
            {/* Personal Tab */}
            <Box
              sx={{
                display: activeSection === "personal" ? "block" : "none",
                width: "100%",
              }}
              role="tabpanel"
            >
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    name="phone"
                    value={formData.phone}
                    onChange={handlePersonalChange}
                    placeholder="e.g. 123-456-7890"
                    variant="outlined"
                    margin="dense"
                    sx={textFieldSx}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Website"
                    name="website"
                    value={formData.website}
                    onChange={handlePersonalChange}
                    placeholder="e.g. mywebsite.com"
                    variant="outlined"
                    margin="dense"
                    sx={textFieldSx}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* Address Tab */}
            <Box
              sx={{
                display: activeSection === "address" ? "block" : "none",
                width: "100%",
              }}
              role="tabpanel"
            >
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Street"
                    name="street"
                    value={formData.address.street}
                    onChange={handleAddressChange}
                    placeholder="e.g. 123 Main St"
                    variant="outlined"
                    margin="dense"
                    sx={textFieldSx}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Suite/Apt"
                    name="suite"
                    value={formData.address.suite}
                    onChange={handleAddressChange}
                    placeholder="e.g. Apt 4B"
                    variant="outlined"
                    margin="dense"
                    sx={textFieldSx}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="City"
                    name="city"
                    value={formData.address.city}
                    onChange={handleAddressChange}
                    placeholder="e.g. New York"
                    variant="outlined"
                    margin="dense"
                    sx={textFieldSx}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Zip Code"
                    name="zipcode"
                    value={formData.address.zipcode}
                    onChange={handleAddressChange}
                    placeholder="e.g. 10001"
                    variant="outlined"
                    margin="dense"
                    sx={textFieldSx}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography
                    variant="subtitle1"
                    sx={{ mt: 1, mb: 1, fontWeight: 500 }}
                  >
                    Geo Location (Optional)
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Latitude"
                        name="lat"
                        value={formData.address.geo.lat}
                        onChange={handleGeoChange}
                        placeholder="e.g. 40.7128"
                        variant="outlined"
                        margin="dense"
                        sx={textFieldSx}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Longitude"
                        name="lng"
                        value={formData.address.geo.lng}
                        onChange={handleGeoChange}
                        placeholder="e.g. -74.0060"
                        variant="outlined"
                        margin="dense"
                        sx={textFieldSx}
                      />
                    </Grid>
                  </Grid>
                </Grid>
              </Grid>
            </Box>

            {/* Company Tab */}
            <Box
              sx={{
                display: activeSection === "company" ? "block" : "none",
                width: "100%",
              }}
              role="tabpanel"
            >
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Company Name"
                    name="name"
                    value={formData.company.name}
                    onChange={handleCompanyChange}
                    placeholder="e.g. Acme Corp"
                    variant="outlined"
                    margin="dense"
                    sx={textFieldSx}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Catch Phrase"
                    name="catchPhrase"
                    value={formData.company.catchPhrase}
                    onChange={handleCompanyChange}
                    placeholder="e.g. We make awesome things"
                    variant="outlined"
                    margin="dense"
                    sx={textFieldSx}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Business Type"
                    name="bs"
                    value={formData.company.bs}
                    onChange={handleCompanyChange}
                    placeholder="e.g. e-commerce, consultation"
                    variant="outlined"
                    margin="dense"
                    sx={textFieldSx}
                  />
                </Grid>
              </Grid>
            </Box>
          </Box>

          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              borderTop: "1px solid #eaeaea",
              pt: 2,
              mt: 0,
            }}
          >
            <Button
              variant="outlined"
              onClick={handleSkip}
              sx={{
                px: 3,
                borderColor: "#8e8e8e",
                color: "#262626",
              }}
            >
              Skip for Now
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading}
              sx={{
                px: 3,
                bgcolor: "#0095f6",
                "&:hover": {
                  bgcolor: "#0086e0",
                },
              }}
            >
              {isLoading ? "Saving..." : "Save Profile"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default ProfileCompletionPage;
