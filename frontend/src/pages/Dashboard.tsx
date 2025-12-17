import React, { useState, useEffect } from 'react';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  People,
  CalendarToday,
  TrendingUp,
  Schedule,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { statsApi, handleApiError } from '../services/api';
import { StatsResponse } from '../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await statsApi.getStats();
      setStats(data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
        <Button onClick={fetchStats} sx={{ ml: 2 }}>
          再試行
        </Button>
      </Alert>
    );
  }

  const statsCards = [
    {
      title: 'スタッフ数',
      value: stats?.total_staff || 0,
      icon: <People fontSize="large" color="primary" />,
      color: '#2E7D32',
      action: () => navigate('/staff'),
    },
    {
      title: '予約数',
      value: stats?.total_bookings || 0,
      icon: <CalendarToday fontSize="large" color="secondary" />,
      color: '#FF6B6B',
      action: () => navigate('/bookings'),
    },
    {
      title: 'サービス種類',
      value: stats?.service_types?.length || 0,
      icon: <TrendingUp fontSize="large" color="info" />,
      color: '#2196F3',
      action: () => navigate('/optimize'),
    },
    {
      title: 'スキルレベル',
      value: stats?.skill_levels?.length || 0,
      icon: <Schedule fontSize="large" color="warning" />,
      color: '#FF9800',
      action: () => navigate('/schedule'),
    },
  ];

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        🌟 Beauty Scheduler ダッシュボード
      </Typography>

      {/* 統計情報カード */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statsCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              sx={{ 
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
              onClick={card.action}
            >
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h3" component="div" sx={{ fontWeight: 'bold', color: card.color }}>
                      {card.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {card.title}
                    </Typography>
                  </Box>
                  {card.icon}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* クイックアクション */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
          📋 クイックアクション
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              startIcon={<People />}
              onClick={() => navigate('/staff')}
              sx={{ py: 2 }}
            >
              スタッフ管理
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              color="secondary"
              size="large"
              startIcon={<CalendarToday />}
              onClick={() => navigate('/bookings')}
              sx={{ py: 2 }}
            >
              予約管理
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              color="success"
              size="large"
              startIcon={<TrendingUp />}
              onClick={() => navigate('/optimize')}
              sx={{ py: 2 }}
            >
              スケジュール最適化
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              color="info"
              size="large"
              startIcon={<Schedule />}
              onClick={() => navigate('/schedule')}
              sx={{ py: 2 }}
            >
              スケジュール表示
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* システム情報 */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          📊 システム情報
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                利用可能サービス
              </Typography>
              <Box sx={{ mt: 1 }}>
                {stats?.service_types?.map((service, index) => (
                  <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                    • {service === 'cut' ? 'カット' : 
                       service === 'color' ? 'カラー' :
                       service === 'perm' ? 'パーマ' :
                       service === 'treatment' ? 'トリートメント' :
                       service === 'styling' ? 'スタイリング' : service}
                  </Typography>
                ))}
              </Box>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                スキルレベル範囲
              </Typography>
              <Box sx={{ mt: 1 }}>
                {stats?.skill_levels?.map((level, index) => (
                  <Typography key={index} variant="body2" sx={{ mb: 0.5 }}>
                    • レベル {level} ({level === 1 ? '初級' : 
                                    level === 2 ? '中級' :
                                    level === 3 ? '上級' : 'エキスパート'})
                  </Typography>
                ))}
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Dashboard;