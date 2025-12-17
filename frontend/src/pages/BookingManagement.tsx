import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Fab,
  Card,
  CardContent,
  Badge,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  EventNote,
  Person,
  Phone,
  Schedule,
  AttachMoney,
} from '@mui/icons-material';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  bookingApi,
  staffApi,
  handleApiError,
  formatServiceType,
  formatSkillLevel,
  formatPriority,
} from '../services/api';
import {
  Booking,
  BookingFormData,
  ServiceType,
  SkillLevel,
  Priority,
  Service,
  Staff,
  BookingStatus,
} from '../types';

const BookingManagement: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { control, handleSubmit, reset, watch } = useForm<BookingFormData>({
    defaultValues: {
      customer_name: '',
      customer_phone: '',
      customer_email: '',
      services: [{ service_type: ServiceType.CUT, duration_minutes: 60, required_skill_level: SkillLevel.INTERMEDIATE, price: 4000 }],
      scheduled_start: new Date().toISOString().slice(0, 16),
      priority: Priority.NORMAL,
      preferred_staff_ids: [],
      notes: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'services',
  });

  useEffect(() => {
    Promise.all([fetchBookings(), fetchStaff()]);
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await bookingApi.getAllBookings();
      setBookings(data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const data = await staffApi.getAllStaff();
      setStaff(data);
    } catch (err) {
      console.error('スタッフデータの取得に失敗しました:', err);
    }
  };

  const handleOpenDialog = (booking?: Booking) => {
    if (booking) {
      setEditingBooking(booking);
      reset({
        customer_name: booking.customer.name,
        customer_phone: booking.customer.phone,
        customer_email: booking.customer.email,
        services: booking.services,
        scheduled_start: new Date(booking.scheduled_start).toISOString().slice(0, 16),
        priority: booking.customer.priority,
        preferred_staff_ids: booking.customer.preferred_staff_ids,
        notes: booking.notes,
      });
    } else {
      setEditingBooking(null);
      reset({
        customer_name: '',
        customer_phone: '',
        customer_email: '',
        services: [{ service_type: ServiceType.CUT, duration_minutes: 60, required_skill_level: SkillLevel.INTERMEDIATE, price: 4000 }],
        scheduled_start: new Date().toISOString().slice(0, 16),
        priority: Priority.NORMAL,
        preferred_staff_ids: [],
        notes: '',
      });
    }
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingBooking(null);
    reset();
  };

  const onSubmit = async (data: BookingFormData) => {
    try {
      setSubmitting(true);
      if (editingBooking) {
        await bookingApi.updateBooking(editingBooking.id, data);
      } else {
        await bookingApi.createBooking(data);
      }
      await fetchBookings();
      handleCloseDialog();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (bookingId: string) => {
    if (window.confirm('この予約を削除してもよろしいですか？')) {
      try {
        await bookingApi.deleteBooking(bookingId);
        await fetchBookings();
      } catch (err) {
        setError(handleApiError(err));
      }
    }
  };

  const addService = () => {
    append({ 
      service_type: ServiceType.CUT, 
      duration_minutes: 60, 
      required_skill_level: SkillLevel.INTERMEDIATE, 
      price: 4000 
    });
  };

  const getTotalPrice = (services: Service[]) => {
    return services.reduce((total, service) => total + service.price, 0);
  };

  const getTotalDuration = (services: Service[]) => {
    return services.reduce((total, service) => total + service.duration_minutes, 0);
  };

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.SCHEDULED: return 'default';
      case BookingStatus.CONFIRMED: return 'info';
      case BookingStatus.IN_PROGRESS: return 'warning';
      case BookingStatus.COMPLETED: return 'success';
      case BookingStatus.CANCELLED: return 'error';
      default: return 'default';
    }
  };

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case Priority.LOW: return 'default';
      case Priority.NORMAL: return 'primary';
      case Priority.HIGH: return 'warning';
      case Priority.VIP: return 'error';
      default: return 'default';
    }
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
          📅 予約管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<EventNote />}
          onClick={() => handleOpenDialog()}
          size="large"
        >
          予約追加
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* 予約統計カード */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: '総予約数', value: bookings.length, color: 'primary' },
          { label: '今日の予約', value: bookings.filter(b => new Date(b.scheduled_start).toDateString() === new Date().toDateString()).length, color: 'secondary' },
          { label: 'VIP予約', value: bookings.filter(b => b.customer.priority === Priority.VIP).length, color: 'error' },
          { label: '完了予約', value: bookings.filter(b => b.status === BookingStatus.COMPLETED).length, color: 'success' },
        ].map((stat, index) => (
          <Grid item xs={6} sm={3} key={index}>
            <Card>
              <CardContent sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color={stat.color}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>顧客情報</TableCell>
              <TableCell>予約日時</TableCell>
              <TableCell>サービス</TableCell>
              <TableCell>料金・時間</TableCell>
              <TableCell>ステータス</TableCell>
              <TableCell>担当スタッフ</TableCell>
              <TableCell>アクション</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {bookings.map((booking) => (
              <TableRow key={booking.id}>
                <TableCell>
                  <Box>
                    <Badge
                      color={getPriorityColor(booking.customer.priority)}
                      badgeContent={formatPriority(booking.customer.priority)}
                    >
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        <Person sx={{ verticalAlign: 'middle', mr: 1, fontSize: 16 }} />
                        {booking.customer.name}
                      </Typography>
                    </Badge>
                    <Typography variant="caption" display="block" color="text.secondary">
                      <Phone sx={{ verticalAlign: 'middle', mr: 0.5, fontSize: 14 }} />
                      {booking.customer.phone}
                    </Typography>
                    {booking.customer.email && (
                      <Typography variant="caption" display="block" color="text.secondary">
                        📧 {booking.customer.email}
                      </Typography>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <Schedule sx={{ verticalAlign: 'middle', mr: 1, fontSize: 16 }} />
                    {format(parseISO(booking.scheduled_start), 'MM月dd日(E) HH:mm', { locale: ja })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    ID: {booking.id}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    {booking.services.map((service, index) => (
                      <Chip
                        key={index}
                        label={`${formatServiceType(service.service_type)} (${service.duration_minutes}分)`}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ mb: 0.5 }}>
                    <AttachMoney sx={{ verticalAlign: 'middle', mr: 0.5, fontSize: 16 }} />
                    ¥{getTotalPrice(booking.services).toLocaleString()}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    合計 {getTotalDuration(booking.services)}分
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    label={booking.status}
                    color={getStatusColor(booking.status)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {booking.assigned_staff_id ? (
                    <Typography variant="body2">
                      {staff.find(s => s.id === booking.assigned_staff_id)?.name || '不明'}
                    </Typography>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      未割当
                    </Typography>
                  )}
                  {booking.customer.preferred_staff_ids.length > 0 && (
                    <Typography variant="caption" display="block" color="info.main">
                      希望: {booking.customer.preferred_staff_ids.map(id => 
                        staff.find(s => s.id === id)?.name || id
                      ).join(', ')}
                    </Typography>
                  )}
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleOpenDialog(booking)}
                    color="primary"
                    size="small"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(booking.id)}
                    color="error"
                    size="small"
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {bookings.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    予約が登録されていません
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 予約追加・編集ダイアログ */}
      <Dialog open={open} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>
            {editingBooking ? '予約編集' : '予約追加'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* 顧客情報 */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>👤 顧客情報</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="customer_name"
                  control={control}
                  rules={{ required: '顧客名は必須です' }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="顧客名"
                      fullWidth
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="customer_phone"
                  control={control}
                  rules={{ required: '電話番号は必須です' }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="電話番号"
                      fullWidth
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="customer_email"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="メールアドレス (任意)"
                      type="email"
                      fullWidth
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="priority"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>優先度</InputLabel>
                      <Select {...field} label="優先度">
                        {Object.values(Priority).map(priority => (
                          <MenuItem key={priority} value={priority}>
                            {formatPriority(priority)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              {/* 予約情報 */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>📅 予約情報</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="scheduled_start"
                  control={control}
                  rules={{ required: '予約日時は必須です' }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="予約日時"
                      type="datetime-local"
                      fullWidth
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                      InputLabelProps={{ shrink: true }}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="preferred_staff_ids"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>希望スタッフ (複数選択可)</InputLabel>
                      <Select
                        {...field}
                        label="希望スタッフ (複数選択可)"
                        multiple
                        value={field.value || []}
                      >
                        {staff.map(staffMember => (
                          <MenuItem key={staffMember.id} value={staffMember.id}>
                            {staffMember.name}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>

              {/* サービス情報 */}
              <Grid item xs={12}>
                <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mt: 2, mb: 2 }}>
                  <Typography variant="h6">✂️ サービス</Typography>
                  <Button onClick={addService} startIcon={<Add />}>
                    サービス追加
                  </Button>
                </Box>
              </Grid>
              {fields.map((service, index) => (
                <Grid item xs={12} key={service.id}>
                  <Paper sx={{ p: 2, mb: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12} sm={3}>
                        <Controller
                          name={`services.${index}.service_type`}
                          control={control}
                          render={({ field }) => (
                            <FormControl fullWidth>
                              <InputLabel>サービス</InputLabel>
                              <Select {...field} label="サービス">
                                {Object.values(ServiceType).map(type => (
                                  <MenuItem key={type} value={type}>
                                    {formatServiceType(type)}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Controller
                          name={`services.${index}.duration_minutes`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="時間 (分)"
                              type="number"
                              fullWidth
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Controller
                          name={`services.${index}.required_skill_level`}
                          control={control}
                          render={({ field }) => (
                            <FormControl fullWidth>
                              <InputLabel>必要レベル</InputLabel>
                              <Select {...field} label="必要レベル">
                                {Object.values(SkillLevel).filter(v => typeof v === 'number').map(level => (
                                  <MenuItem key={level} value={level}>
                                    {formatSkillLevel(level as number)}
                                  </MenuItem>
                                ))}
                              </Select>
                            </FormControl>
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={2}>
                        <Controller
                          name={`services.${index}.price`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="料金 (円)"
                              type="number"
                              fullWidth
                            />
                          )}
                        />
                      </Grid>
                      <Grid item xs={12} sm={1}>
                        <Button
                          onClick={() => remove(index)}
                          color="error"
                          disabled={fields.length === 1}
                        >
                          削除
                        </Button>
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>
              ))}

              {/* 合計表示 */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2, backgroundColor: 'grey.50' }}>
                  <Typography variant="h6">
                    合計: ¥{getTotalPrice(watch('services')).toLocaleString()} / {getTotalDuration(watch('services'))}分
                  </Typography>
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="備考"
                      multiline
                      rows={3}
                      fullWidth
                    />
                  )}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>キャンセル</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={20} /> : null}
            >
              {submitting ? '保存中...' : (editingBooking ? '更新' : '登録')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* フローティングアクションボタン */}
      <Fab
        color="secondary"
        aria-label="add booking"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => handleOpenDialog()}
      >
        <EventNote />
      </Fab>
    </Box>
  );
};

export default BookingManagement;