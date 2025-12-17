import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Chip,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Stepper,
  Step,
  StepLabel,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  AutoFixHigh as Optimize,
  CalendarToday,
  People,
  PlayArrow,
  CheckCircle,
  Speed,
  TrendingUp,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { format, addDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import {
  scheduleApi,
  staffApi,
  bookingApi,
  handleApiError,
} from '../services/api';
import {
  OptimizationRequest,
  OptimizationResult,
  Staff,
  Booking,
} from '../types';

const ScheduleOptimization: React.FC = () => {
  const navigate = useNavigate();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState<string>('');
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [activeStep, setActiveStep] = useState(0);

  const { control, handleSubmit, watch, setValue } = useForm<OptimizationRequest>({
    defaultValues: {
      schedule_date: new Date().toISOString().slice(0, 10),
      staff_ids: [],
      booking_ids: [],
    },
  });

  const steps = [
    '対象日選択',
    'スタッフ選択',
    '予約選択',
    '最適化実行',
    '結果確認'
  ];

  useEffect(() => {
    Promise.all([fetchStaff(), fetchBookings()]);
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      const data = await staffApi.getAllStaff();
      setStaff(data);
      // 初期状態で全スタッフを選択
      setValue('staff_ids', data.map(s => s.id));
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
      // 今日以降の予約を初期選択
      const futureBookings = data.filter(booking => 
        new Date(booking.scheduled_start) >= new Date()
      );
      setValue('booking_ids', futureBookings.map(b => b.id));
    } catch (err) {
      console.error('予約データの取得に失敗しました:', err);
    }
  };

  const onSubmit = async (data: OptimizationRequest) => {
    try {
      setOptimizing(true);
      setError('');
      setActiveStep(3); // 最適化実行ステップ

      const optimizationResult = await scheduleApi.optimizeSchedule({
        ...data,
        schedule_date: new Date(data.schedule_date).toISOString(),
      });

      setResult(optimizationResult);
      setActiveStep(4); // 結果確認ステップ
    } catch (err) {
      setError(handleApiError(err));
      setActiveStep(3);
    } finally {
      setOptimizing(false);
    }
  };

  const handleNext = () => {
    setActiveStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setActiveStep(prev => Math.max(prev - 1, 0));
  };

  const getSelectedStaff = () => {
    const selectedIds = watch('staff_ids') || [];
    return staff.filter(s => selectedIds.includes(s.id));
  };

  const getSelectedBookings = () => {
    const selectedIds = watch('booking_ids') || [];
    return bookings.filter(b => selectedIds.includes(b.id));
  };

  const getTargetDateBookings = () => {
    const targetDate = watch('schedule_date');
    if (!targetDate) return [];
    
    const targetDay = format(new Date(targetDate), 'yyyy-MM-dd');
    return bookings.filter(booking => {
      const bookingDay = format(new Date(booking.scheduled_start), 'yyyy-MM-dd');
      return bookingDay === targetDay;
    });
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
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 'bold' }}>
        🎯 スケジュール最適化
      </Typography>

      {/* ステッパー */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label, index) => (
            <Step key={label} completed={index < activeStep}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          {/* 左側: 設定パネル */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Optimize /> 最適化設定
              </Typography>

              {/* ステップ0: 対象日選択 */}
              {activeStep >= 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    📅 対象日選択
                  </Typography>
                  <Controller
                    name="schedule_date"
                    control={control}
                    rules={{ required: '対象日は必須です' }}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        label="最適化対象日"
                        type="date"
                        fullWidth
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                        InputLabelProps={{ shrink: true }}
                        sx={{ mb: 2 }}
                      />
                    )}
                  />
                  {watch('schedule_date') && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      選択日: {format(new Date(watch('schedule_date')), 'yyyy年MM月dd日(E)', { locale: ja })}
                      <br />
                      この日の予約数: {getTargetDateBookings().length}件
                    </Alert>
                  )}
                </Box>
              )}

              {/* ステップ1: スタッフ選択 */}
              {activeStep >= 1 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    👥 スタッフ選択
                  </Typography>
                  <Controller
                    name="staff_ids"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>対象スタッフ (複数選択可)</InputLabel>
                        <Select
                          {...field}
                          label="対象スタッフ (複数選択可)"
                          multiple
                          value={field.value || []}
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((value) => (
                                <Chip 
                                  key={value} 
                                  label={staff.find(s => s.id === value)?.name || value}
                                  size="small"
                                />
                              ))}
                            </Box>
                          )}
                        >
                          {staff.map((staffMember) => (
                            <MenuItem key={staffMember.id} value={staffMember.id}>
                              {staffMember.name} (¥{staffMember.hourly_rate}/h)
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                  <Alert severity="info">
                    選択スタッフ数: {getSelectedStaff().length}名
                  </Alert>
                </Box>
              )}

              {/* ステップ2: 予約選択 */}
              {activeStep >= 2 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    📝 予約選択
                  </Typography>
                  <Controller
                    name="booking_ids"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth sx={{ mb: 2 }}>
                        <InputLabel>対象予約 (複数選択可)</InputLabel>
                        <Select
                          {...field}
                          label="対象予約 (複数選択可)"
                          multiple
                          value={field.value || []}
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((value) => {
                                const booking = bookings.find(b => b.id === value);
                                return (
                                  <Chip 
                                    key={value} 
                                    label={booking?.customer.name || value}
                                    size="small"
                                  />
                                );
                              })}
                            </Box>
                          )}
                        >
                          {bookings.map((booking) => (
                            <MenuItem key={booking.id} value={booking.id}>
                              {booking.customer.name} - {format(new Date(booking.scheduled_start), 'MM/dd HH:mm')}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                  <Alert severity="info">
                    選択予約数: {getSelectedBookings().length}件
                  </Alert>
                </Box>
              )}

              {/* ナビゲーションボタン */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Button 
                  onClick={handleBack} 
                  disabled={activeStep === 0}
                >
                  戻る
                </Button>
                {activeStep < 2 ? (
                  <Button 
                    variant="contained" 
                    onClick={handleNext}
                    disabled={
                      (activeStep === 0 && !watch('schedule_date')) ||
                      (activeStep === 1 && (!watch('staff_ids') || watch('staff_ids').length === 0))
                    }
                  >
                    次へ
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={optimizing || !watch('booking_ids') || watch('booking_ids').length === 0}
                    startIcon={optimizing ? <CircularProgress size={20} /> : <PlayArrow />}
                    color="success"
                  >
                    {optimizing ? '最適化中...' : '最適化実行'}
                  </Button>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* 右側: プレビュー・結果パネル */}
          <Grid item xs={12} md={6}>
            {/* 最適化中の表示 */}
            {optimizing && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Speed /> 最適化実行中
                </Typography>
                <LinearProgress sx={{ mb: 2 }} />
                <Typography variant="body2" color="text.secondary">
                  OR-Toolsが最適なスケジュールを計算しています...
                </Typography>
              </Paper>
            )}

            {/* 最適化結果 */}
            {result && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircle color="success" /> 最適化結果
                </Typography>

                {result.status === 'OPTIMAL' || result.status === 'FEASIBLE' ? (
                  <>
                    <Alert severity="success" sx={{ mb: 3 }}>
                      {result.status === 'OPTIMAL' ? '最適解が見つかりました！' : '実行可能解が見つかりました'}
                    </Alert>

                    {/* 統計情報 */}
                    <Grid container spacing={2} sx={{ mb: 3 }}>
                      <Grid item xs={6}>
                        <Card>
                          <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="primary">
                              {result.schedule.length}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              割当済み予約
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid item xs={6}>
                        <Card>
                          <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h4" color="secondary">
                              {result.solver_stats.solve_time.toFixed(3)}s
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              求解時間
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>

                    {/* スケジュール概要 */}
                    <Typography variant="subtitle1" gutterBottom>
                      📋 スケジュール概要
                    </Typography>
                    <Box sx={{ maxHeight: 300, overflow: 'auto', mb: 3 }}>
                      {result.schedule.map((item, index) => (
                        <Paper key={index} sx={{ p: 2, mb: 1, backgroundColor: 'grey.50' }}>
                          <Typography variant="subtitle2">
                            👤 {item.staff_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            💁 {item.customer_name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            ✂️ {item.services.join(', ')}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ⏱️ スロット {item.start_slot} ({item.duration_slots * 15}分)
                          </Typography>
                        </Paper>
                      ))}
                    </Box>

                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => navigate('/schedule')}
                      startIcon={<CalendarToday />}
                      size="large"
                    >
                      詳細スケジュールを確認
                    </Button>
                  </>
                ) : (
                  <Alert severity="error">
                    最適解が見つかりませんでした。制約条件を見直してください。
                  </Alert>
                )}
              </Paper>
            )}

            {/* 設定プレビュー */}
            {!optimizing && !result && activeStep >= 1 && (
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp /> 設定プレビュー
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">対象日</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {watch('schedule_date') && format(new Date(watch('schedule_date')), 'yyyy年MM月dd日(E)', { locale: ja })}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2">選択スタッフ ({getSelectedStaff().length}名)</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    {getSelectedStaff().map(staff => (
                      <Chip key={staff.id} label={staff.name} size="small" />
                    ))}
                  </Box>
                </Box>

                <Box>
                  <Typography variant="subtitle2">選択予約 ({getSelectedBookings().length}件)</Typography>
                  <Box sx={{ maxHeight: 200, overflow: 'auto', mt: 1 }}>
                    {getSelectedBookings().slice(0, 5).map(booking => (
                      <Typography key={booking.id} variant="body2" color="text.secondary">
                        • {booking.customer.name} - {format(new Date(booking.scheduled_start), 'MM/dd HH:mm')}
                      </Typography>
                    ))}
                    {getSelectedBookings().length > 5 && (
                      <Typography variant="body2" color="text.secondary">
                        ...他 {getSelectedBookings().length - 5}件
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Paper>
            )}
          </Grid>
        </Grid>
      </form>
    </Box>
  );
};

export default ScheduleOptimization;