import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Container } from '@mui/material';
import Navbar from './components/layout/Navbar';
import Dashboard from './pages/Dashboard';
import StaffManagement from './pages/StaffManagement';
import BookingManagement from './pages/BookingManagement';
import ScheduleOptimization from './pages/ScheduleOptimization';
import ScheduleView from './pages/ScheduleView';

function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <Container component="main" sx={{ flexGrow: 1, py: 3 }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/staff" element={<StaffManagement />} />
          <Route path="/bookings" element={<BookingManagement />} />
          <Route path="/optimize" element={<ScheduleOptimization />} />
          <Route path="/schedule" element={<ScheduleView />} />
        </Routes>
      </Container>
    </Box>
  );
}

export default App;