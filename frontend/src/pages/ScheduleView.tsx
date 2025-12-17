import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import {
  Schedule,
  Person,
  AccessTime,
  ExpandMore,
  Refresh,
  FilterList,
  Print,
  Download,
  CalendarToday,
  Work,
} from '@mui/icons-material';
import { format, addHours, startOfDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  staffApi,
  bookingApi,
  handleApiError,
  formatServiceType,
} from '../services/api';
import {
  Staff,
  Booking,
  ScheduleItem,
  OptimizationResult,
} from '../types';

// スケジュールビューで使用するダミーデータ（実際には最適化結果から取得）
const mockScheduleData: ScheduleItem[] = [
  {
    booking_id: 'booking_001',
    staff_id: 'staff_001',
    staff_name: '田中美咲',
    customer_name: '鈴木太郎',
    services: ['cut', 'color'],
    start_slot: 4, // 10:00 (9:00 + 4*15分)
    duration_slots: 12, // 180分
  },
  {
    booking_id: 'booking_002',
    staff_id: 'staff_002',
    staff_name: '佐藤健二',
    services: ['color', 'treatment'],
    customer_name: '田中花子',
    start_slot: 8, // 11:00
    duration_slots: 10, // 150分
  },
  {
    booking_id: 'booking_003',
    staff_id: 'staff_003',
    staff_name: '山田花子',
    customer_name: '山田次郎',
    services: ['cut'],
    start_slot: 12, // 12:00
    duration_slots: 4, // 60分
  },
];

const ScheduleView: React.FC = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [scheduleData, setScheduleData] = useState<ScheduleItem[]>(mockScheduleData);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [viewMode, setViewMode] = useState<'timeline' | 'grid'>('timeline');

  useEffect(() => {
    Promise.all([fetchStaff(), fetchBookings()]);
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const data = await staffApi.getAllStaff();
      setStaff(data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchBookings = async () => {
    try {
      const data = await bookingApi.getAllBookings();
      setBookings(data);
    } catch (err) {
      console.error('予約データの取得に失敗しました:', err);
    }
  };

  const getTimeFromSlot = (slot: number): string => {
    const startTime = 9; // 9時開始
    const hours = Math.floor(slot / 4) + startTime;
    const minutes = (slot % 4) * 15;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  const getFilteredSchedule = (): ScheduleItem[] => {
    let filtered = scheduleData;
    
    if (selectedStaff !== 'all') {
      filtered = filtered.filter(item => item.staff_id === selectedStaff);
    }

    return filtered.sort((a, b) => a.start_slot - b.start_slot);
  };

  const getStaffWorkload = (): { [staffId: string]: { name: string; hours: number; bookings: number } } => {
    const workload: { [staffId: string]: { name: string; hours: number; bookings: number } } = {};
    
    scheduleData.forEach(item => {
      if (!workload[item.staff_id]) {
        workload[item.staff_id] = {
          name: item.staff_name,
          hours: 0,
          bookings: 0,
        };
      }
      workload[item.staff_id].hours += (item.duration_slots * 15) / 60;
      workload[item.staff_id].bookings += 1;
    });

    return workload;
  };

  const getTimeSlots = (): string[] => {
    const slots = [];
    for (let hour = 9; hour <= 20; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        slots.push(`${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`);
      }
    }
    return slots;
  };

  const exportSchedule = () => {
    // 簡易的なCSVエクスポート
    const csv = [
      ['スタッフ名', '顧客名', 'サービス', '開始時刻', '終了時刻', '所要時間'],
      ...getFilteredSchedule().map(item => [
        item.staff_name,
        item.customer_name,
        item.services.join(', '),
        getTimeFromSlot(item.start_slot),
        getTimeFromSlot(item.start_slot + item.duration_slots),
        `${item.duration_slots * 15}分`,
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `schedule_${selectedDate}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          📅 スケジュール表示
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={() => window.print()}
          >
            印刷
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={exportSchedule}
          >
            CSV出力
          </Button>
          <Button
            variant="contained"
            startIcon={<Refresh />}
            onClick={() => Promise.all([fetchStaff(), fetchBookings()])}
          >
            更新
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* フィルター */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterList /> フィルター
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              label="対象日"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>スタッフ</InputLabel>
              <Select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                label="スタッフ"
              >
                <MenuItem value="all">全スタッフ</MenuItem>
                {staff.map((staffMember) => (
                  <MenuItem key={staffMember.id} value={staffMember.id}>
                    {staffMember.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>表示モード</InputLabel>
              <Select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as 'timeline' | 'grid')}
                label="表示モード"
              >
                <MenuItem value="timeline">タイムライン</MenuItem>
                <MenuItem value="grid">グリッド</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* スタッフ稼働統計 */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          📊 スタッフ稼働統計 ({format(new Date(selectedDate), 'yyyy年MM月dd日(E)', { locale: ja })})
        </Typography>
        <Grid container spacing={2}>
          {Object.entries(getStaffWorkload()).map(([staffId, data]) => (
            <Grid item xs={12} sm={6} md={4} key={staffId}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    👤 {data.name}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">稼働時間:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {data.hours.toFixed(1)}時間
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2">担当予約:</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {data.bookings}件
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      {/* スケジュール表示 */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          🗓️ 詳細スケジュール
        </Typography>

        {viewMode === 'timeline' ? (
          // タイムラインビュー（簡略化版）
          <Box>
            {getFilteredSchedule().map((item, index) => (
              <Paper key={index} sx={{ p: 3, mb: 2, borderLeft: '4px solid', borderLeftColor: 'primary.main' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <AccessTime color="primary" />
                  <Typography variant="h6">
                    {getTimeFromSlot(item.start_slot)} - {getTimeFromSlot(item.start_slot + item.duration_slots)}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Chip
                    icon={<Person />}
                    label={item.staff_name}
                    color="primary"
                    size="small"
                  />
                  <Chip
                    label={item.customer_name}
                    variant="outlined"
                    size="small"
                  />
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                  {item.services.map((service, serviceIndex) => (
                    <Chip
                      key={serviceIndex}
                      label={formatServiceType(service)}
                      size="small"
                      color="secondary"
                    />
                  ))}
                </Box>
                <Typography variant="caption" color="text.secondary">
                  所要時間: {item.duration_slots * 15}分
                </Typography>
              </Paper>
            ))}
            {getFilteredSchedule().length === 0 && (
              <Paper sx={{ p: 3, textAlign: 'center' }}>
                <Schedule color="disabled" sx={{ fontSize: 48, mb: 2 }} />
                <Typography color="text.secondary">
                  選択された条件でのスケジュールはありません
                </Typography>
              </Paper>
            )}
          </Box>
        ) : (
          // グリッドビュー
          <Box>
            {staff
              .filter(s => selectedStaff === 'all' || s.id === selectedStaff)
              .map((staffMember) => (
                <Accordion key={staffMember.id} defaultExpanded={selectedStaff !== 'all'}>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Typography variant="h6">{staffMember.name}</Typography>
                      <Chip
                        label={`${scheduleData.filter(item => item.staff_id === staffMember.id).length}件の予約`}
                        size="small"
                        color="primary"
                      />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 2 }}>
                      {scheduleData
                        .filter(item => item.staff_id === staffMember.id)
                        .map((item, index) => (
                          <Card key={index} sx={{ border: '2px solid', borderColor: 'primary.main' }}>
                            <CardContent>
                              <Typography variant="subtitle1" gutterBottom>
                                {getTimeFromSlot(item.start_slot)} - {getTimeFromSlot(item.start_slot + item.duration_slots)}
                              </Typography>
                              <Typography variant="h6" gutterBottom>
                                {item.customer_name}
                              </Typography>
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                                {item.services.map((service, serviceIndex) => (
                                  <Chip
                                    key={serviceIndex}
                                    label={formatServiceType(service)}
                                    size="small"
                                    color="secondary"
                                  />
                                ))}
                              </Box>
                              <Typography variant="body2" color="text.secondary">
                                ⏱️ {item.duration_slots * 15}分
                              </Typography>
                            </CardContent>
                          </Card>
                        ))}
                      {scheduleData.filter(item => item.staff_id === staffMember.id).length === 0 && (
                        <Typography color="text.secondary" sx={{ p: 2 }}>
                          このスタッフには予約がありません
                        </Typography>
                      )}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
          </Box>
        )}
      </Paper>

      {/* 時間軸参考 */}
      <Paper sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom>
          🕒 営業時間参考
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 1 }}>
          {getTimeSlots().filter((_, index) => index % 4 === 0).map((time, index) => (
            <Chip
              key={time}
              label={time}
              variant="outlined"
              size="small"
              sx={{ fontSize: '0.75rem' }}
            />
          ))}
        </Box>
      </Paper>
    </Box>
  );
};

export default ScheduleView;