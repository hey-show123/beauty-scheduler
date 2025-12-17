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
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Fab,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  PersonAdd,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { staffApi, handleApiError, formatServiceType, formatSkillLevel, formatDayOfWeek } from '../services/api';
import { Staff, StaffFormData, ServiceType, SkillLevel } from '../types';

const StaffManagement: React.FC = () => {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [open, setOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { control, handleSubmit, reset, watch, setValue } = useForm<StaffFormData>({
    defaultValues: {
      name: '',
      skills: [],
      availability: [],
      hourly_rate: 2000,
      max_hours_per_day: 8,
    },
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  const fetchStaff = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await staffApi.getAllStaff();
      setStaff(data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (staffMember?: Staff) => {
    if (staffMember) {
      setEditingStaff(staffMember);
      reset({
        name: staffMember.name,
        skills: staffMember.skills,
        availability: staffMember.availability,
        hourly_rate: staffMember.hourly_rate,
        max_hours_per_day: staffMember.max_hours_per_day,
      });
    } else {
      setEditingStaff(null);
      reset({
        name: '',
        skills: [],
        availability: [],
        hourly_rate: 2000,
        max_hours_per_day: 8,
      });
    }
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingStaff(null);
    reset();
  };

  const onSubmit = async (data: StaffFormData) => {
    try {
      setSubmitting(true);
      if (editingStaff) {
        await staffApi.updateStaff(editingStaff.id, data);
      } else {
        await staffApi.createStaff(data);
      }
      await fetchStaff();
      handleCloseDialog();
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (staffId: string) => {
    if (window.confirm('このスタッフを削除してもよろしいですか？')) {
      try {
        await staffApi.deleteStaff(staffId);
        await fetchStaff();
      } catch (err) {
        setError(handleApiError(err));
      }
    }
  };

  const addSkill = () => {
    const currentSkills = watch('skills') || [];
    setValue('skills', [...currentSkills, { service_type: ServiceType.CUT, level: SkillLevel.BEGINNER, years_experience: 0 }]);
  };

  const removeSkill = (index: number) => {
    const currentSkills = watch('skills') || [];
    setValue('skills', currentSkills.filter((_, i) => i !== index));
  };

  const addAvailability = () => {
    const currentAvailability = watch('availability') || [];
    setValue('availability', [
      ...currentAvailability,
      { day_of_week: 0, start_time: '09:00', end_time: '18:00', is_preferred: false }
    ]);
  };

  const removeAvailability = (index: number) => {
    const currentAvailability = watch('availability') || [];
    setValue('availability', currentAvailability.filter((_, i) => i !== index));
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
          👥 スタッフ管理
        </Typography>
        <Button
          variant="contained"
          startIcon={<PersonAdd />}
          onClick={() => handleOpenDialog()}
          size="large"
        >
          スタッフ追加
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>名前</TableCell>
              <TableCell>スキル</TableCell>
              <TableCell>時給</TableCell>
              <TableCell>勤務可能時間</TableCell>
              <TableCell>アクション</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {staff.map((staffMember) => (
              <TableRow key={staffMember.id}>
                <TableCell>
                  <Typography variant="subtitle2">{staffMember.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    ID: {staffMember.id}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {staffMember.skills.map((skill, index) => (
                      <Chip
                        key={index}
                        label={`${formatServiceType(skill.service_type)} (${formatSkillLevel(skill.level)})`}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>¥{staffMember.hourly_rate.toLocaleString()}/h</TableCell>
                <TableCell>
                  <Typography variant="body2">
                    最大 {staffMember.max_hours_per_day}h/日
                  </Typography>
                  <Box sx={{ mt: 1 }}>
                    {staffMember.availability.map((avail, index) => (
                      <Typography key={index} variant="caption" display="block">
                        {formatDayOfWeek(avail.day_of_week)}: {avail.start_time}-{avail.end_time}
                      </Typography>
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <IconButton
                    onClick={() => handleOpenDialog(staffMember)}
                    color="primary"
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    onClick={() => handleDelete(staffMember.id)}
                    color="error"
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {staff.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    スタッフが登録されていません
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* スタッフ追加・編集ダイアログ */}
      <Dialog open={open} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>
            {editingStaff ? 'スタッフ編集' : 'スタッフ追加'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="name"
                  control={control}
                  rules={{ required: '名前は必須です' }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="名前"
                      fullWidth
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="hourly_rate"
                  control={control}
                  rules={{ required: '時給は必須です', min: { value: 0, message: '時給は0以上で入力してください' } }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="時給 (円)"
                      type="number"
                      fullWidth
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller
                  name="max_hours_per_day"
                  control={control}
                  rules={{ required: '最大勤務時間は必須です', min: { value: 1, message: '1時間以上で入力してください' } }}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="最大勤務時間 (時間/日)"
                      type="number"
                      fullWidth
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />
              </Grid>
            </Grid>

            {/* スキル管理 */}
            <Box sx={{ mt: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">スキル</Typography>
                <Button onClick={addSkill} startIcon={<Add />}>
                  スキル追加
                </Button>
              </Box>
              {watch('skills')?.map((skill, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 2, alignItems: 'center' }}>
                  <Grid item xs={3}>
                    <FormControl fullWidth>
                      <InputLabel>サービス</InputLabel>
                      <Controller
                        name={`skills.${index}.service_type`}
                        control={control}
                        render={({ field }) => (
                          <Select {...field} label="サービス">
                            {Object.values(ServiceType).map(type => (
                              <MenuItem key={type} value={type}>
                                {formatServiceType(type)}
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      />
                    </FormControl>
                  </Grid>
                  <Grid item xs={3}>
                    <FormControl fullWidth>
                      <InputLabel>レベル</InputLabel>
                      <Controller
                        name={`skills.${index}.level`}
                        control={control}
                        render={({ field }) => (
                          <Select {...field} label="レベル">
                            {Object.values(SkillLevel).filter(v => typeof v === 'number').map(level => (
                              <MenuItem key={level} value={level}>
                                {formatSkillLevel(level as number)}
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      />
                    </FormControl>
                  </Grid>
                  <Grid item xs={3}>
                    <Controller
                      name={`skills.${index}.years_experience`}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="経験年数"
                          type="number"
                          fullWidth
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <Button onClick={() => removeSkill(index)} color="error">
                      削除
                    </Button>
                  </Grid>
                </Grid>
              ))}
            </Box>

            {/* 勤務可能時間管理 */}
            <Box sx={{ mt: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">勤務可能時間</Typography>
                <Button onClick={addAvailability} startIcon={<Add />}>
                  時間追加
                </Button>
              </Box>
              {watch('availability')?.map((avail, index) => (
                <Grid container spacing={2} key={index} sx={{ mb: 2, alignItems: 'center' }}>
                  <Grid item xs={2}>
                    <FormControl fullWidth>
                      <InputLabel>曜日</InputLabel>
                      <Controller
                        name={`availability.${index}.day_of_week`}
                        control={control}
                        render={({ field }) => (
                          <Select {...field} label="曜日">
                            {[0, 1, 2, 3, 4, 5, 6].map(day => (
                              <MenuItem key={day} value={day}>
                                {formatDayOfWeek(day)}曜日
                              </MenuItem>
                            ))}
                          </Select>
                        )}
                      />
                    </FormControl>
                  </Grid>
                  <Grid item xs={2.5}>
                    <Controller
                      name={`availability.${index}.start_time`}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="開始時間"
                          type="time"
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={2.5}>
                    <Controller
                      name={`availability.${index}.end_time`}
                      control={control}
                      render={({ field }) => (
                        <TextField
                          {...field}
                          label="終了時間"
                          type="time"
                          fullWidth
                          InputLabelProps={{ shrink: true }}
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={2}>
                    <Controller
                      name={`availability.${index}.is_preferred`}
                      control={control}
                      render={({ field }) => (
                        <FormControlLabel
                          control={<Checkbox {...field} checked={field.value} />}
                          label="希望時間"
                        />
                      )}
                    />
                  </Grid>
                  <Grid item xs={3}>
                    <Button onClick={() => removeAvailability(index)} color="error">
                      削除
                    </Button>
                  </Grid>
                </Grid>
              ))}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>キャンセル</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting}
              startIcon={submitting ? <CircularProgress size={20} /> : null}
            >
              {submitting ? '保存中...' : (editingStaff ? '更新' : '登録')}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* フローティングアクションボタン */}
      <Fab
        color="primary"
        aria-label="add"
        sx={{ position: 'fixed', bottom: 16, right: 16 }}
        onClick={() => handleOpenDialog()}
      >
        <PersonAdd />
      </Fab>
    </Box>
  );
};

export default StaffManagement;