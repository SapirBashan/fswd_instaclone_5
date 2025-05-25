import { useState, useEffect } from 'react';
import { UserStorage } from '../utils/LocalStorage';
import { UserAPI } from '../utils/ServerDB';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Divider,
  Grid,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';

import {
  Person,
  Email,
  Phone,
  Language,
  Business,
  LocationOn,
  Work,
} from '@mui/icons-material';

const InfoPage = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        // Get current user from localStorage
        const currentUser = UserStorage.getUser();
        
        if (!currentUser) {
          throw new Error('No user found in storage');
        }

        // Fetch detailed user info from the server
        const userDetails = await UserAPI.getById(currentUser.id);
        setUserInfo(userDetails);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, []);

  if (loading) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>Loading user information...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  if (!userInfo) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography>No user information available</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 800, margin: '0 auto' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        User Profile
      </Typography>

      {/* Basic Info Card */}
      <Paper elevation={3} sx={{ mb: 3 }}>
        <List>
          <ListItem>
            <ListItemIcon>
              <Person />
            </ListItemIcon>
            <ListItemText 
              primary="Name"
              secondary={userInfo.name}
            />
          </ListItem>
          <Divider />
          
          <ListItem>
            <ListItemIcon>
              <Person />
            </ListItemIcon>
            <ListItemText 
              primary="Username"
              secondary={userInfo.username}
            />
          </ListItem>
          <Divider />

          <ListItem>
            <ListItemIcon>
              <Email />
            </ListItemIcon>
            <ListItemText 
              primary="Email"
              secondary={userInfo.email}
            />
          </ListItem>
        </List>
      </Paper>

      {/* Contact Info Card */}
      <Paper elevation={3} sx={{ mb: 3 }}>
        <List>
          <ListItem>
            <ListItemIcon>
              <Phone />
            </ListItemIcon>
            <ListItemText 
              primary="Phone"
              secondary={userInfo.phone}
            />
          </ListItem>
          <Divider />

          <ListItem>
            <ListItemIcon>
              <Language />
            </ListItemIcon>
            <ListItemText 
              primary="Website"
              secondary={userInfo.website}
            />
          </ListItem>
        </List>
      </Paper>

      {/* Address Card */}
      <Paper elevation={3} sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
            Address
          </Typography>
          <Grid container spacing={2} sx={{ pl: 4 }}>
            <Grid item xs={12}>
              <Typography>
                {userInfo.address.street}, {userInfo.address.suite}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography>
                {userInfo.address.city}, {userInfo.address.zipcode}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="caption">
                Coordinates: {userInfo.address.geo.lat}, {userInfo.address.geo.lng}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Paper>

      {/* Company Card */}
      <Paper elevation={3}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            <Business sx={{ mr: 1, verticalAlign: 'middle' }} />
            Company Information
          </Typography>
          <Grid container spacing={2} sx={{ pl: 4 }}>
            <Grid item xs={12}>
              <Typography>
                <Work sx={{ mr: 1, verticalAlign: 'middle', fontSize: 'small' }} />
                {userInfo.company.name}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2">
                {userInfo.company.catchPhrase}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="textSecondary">
                {userInfo.company.bs}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Paper>
    </Box>
  );
};

export default InfoPage;