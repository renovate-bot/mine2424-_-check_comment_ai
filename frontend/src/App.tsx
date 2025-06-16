import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import ReviewQueue from './pages/ReviewQueue';
import EditorialFeedback from './pages/EditorialFeedback';
import QuickAnalysis from './pages/QuickAnalysis';
import CreatePost from './pages/CreatePost';
import Analytics from './pages/Analytics';

const App: React.FC = () => {
  return (
    <Router>
      <Box sx={{ display: 'flex' }}>
        <Sidebar />
        <Box component="main" sx={{ flexGrow: 1, p: 3, marginLeft: '240px' }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/review" element={<ReviewQueue />} />
            <Route path="/editorial-feedback" element={<EditorialFeedback />} />
            <Route path="/quick-analysis" element={<QuickAnalysis />} />
            <Route path="/create-post" element={<CreatePost />} />
            <Route path="/analytics" element={<Analytics />} />
          </Routes>
        </Box>
      </Box>
    </Router>
  );
};

export default App;