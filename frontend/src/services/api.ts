import axios from 'axios';
import {
  Staff,
  Booking,
  StaffFormData,
  BookingFormData,
  OptimizationRequest,
  OptimizationResult,
  StatsResponse,
} from '../types';

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api/v1' 
  : '/api/v1';

// Axiosインスタンスの作成
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// レスポンスインターセプター（エラーハンドリング）
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message);
    }
    throw new Error('APIエラーが発生しました');
  }
);

// スタッフ関連のAPI
export const staffApi = {
  // 全スタッフを取得
  getAllStaff: async (): Promise<Staff[]> => {
    const response = await api.get('/staff/');
    return response.data;
  },

  // 特定のスタッフを取得
  getStaff: async (staffId: string): Promise<Staff> => {
    const response = await api.get(`/staff/${staffId}`);
    return response.data;
  },

  // スタッフを作成
  createStaff: async (staffData: StaffFormData): Promise<{ staff_id: string; message: string }> => {
    const response = await api.post('/staff/', staffData);
    return response.data;
  },

  // スタッフを更新
  updateStaff: async (staffId: string, staffData: Partial<StaffFormData>): Promise<{ message: string }> => {
    const response = await api.put(`/staff/${staffId}`, staffData);
    return response.data;
  },

  // スタッフを削除
  deleteStaff: async (staffId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/staff/${staffId}`);
    return response.data;
  },
};

// 予約関連のAPI
export const bookingApi = {
  // 全予約を取得
  getAllBookings: async (): Promise<Booking[]> => {
    const response = await api.get('/bookings/');
    return response.data;
  },

  // 特定の予約を取得
  getBooking: async (bookingId: string): Promise<Booking> => {
    const response = await api.get(`/bookings/${bookingId}`);
    return response.data;
  },

  // 予約を作成
  createBooking: async (bookingData: BookingFormData): Promise<{ booking_id: string; message: string }> => {
    const response = await api.post('/bookings/', bookingData);
    return response.data;
  },

  // 予約を更新
  updateBooking: async (bookingId: string, bookingData: Partial<BookingFormData>): Promise<{ message: string }> => {
    const response = await api.put(`/bookings/${bookingId}`, bookingData);
    return response.data;
  },

  // 予約を削除
  deleteBooking: async (bookingId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/bookings/${bookingId}`);
    return response.data;
  },
};

// スケジュール最適化API
export const scheduleApi = {
  // スケジュールを最適化
  optimizeSchedule: async (request: OptimizationRequest): Promise<OptimizationResult> => {
    const response = await api.post('/optimize-schedule/', request);
    return response.data;
  },
};

// 統計情報API
export const statsApi = {
  // システム統計を取得
  getStats: async (): Promise<StatsResponse> => {
    const response = await api.get('/stats');
    return response.data;
  },

  // ヘルスチェック
  healthCheck: async (): Promise<{ status: string; message: string }> => {
    const response = await api.get('/health');
    return response.data;
  },
};

// ユーティリティ関数
export const formatServiceType = (serviceType: string): string => {
  const serviceMap: { [key: string]: string } = {
    cut: 'カット',
    color: 'カラー',
    perm: 'パーマ',
    treatment: 'トリートメント',
    styling: 'スタイリング',
    facial: 'フェイシャル',
  };
  return serviceMap[serviceType] || serviceType;
};

export const formatSkillLevel = (level: number): string => {
  const levelMap: { [key: number]: string } = {
    1: '初級',
    2: '中級',
    3: '上級',
    4: 'エキスパート',
  };
  return levelMap[level] || `レベル${level}`;
};

export const formatPriority = (priority: string): string => {
  const priorityMap: { [key: string]: string } = {
    LOW: '低',
    NORMAL: '通常',
    HIGH: '高',
    VIP: 'VIP',
  };
  return priorityMap[priority] || priority;
};

export const formatDayOfWeek = (dayOfWeek: number): string => {
  const dayMap: { [key: number]: string } = {
    0: '月',
    1: '火',
    2: '水',
    3: '木',
    4: '金',
    5: '土',
    6: '日',
  };
  return dayMap[dayOfWeek] || `${dayOfWeek}`;
};

// エラーハンドリングユーティリティ
export const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return '予期しないエラーが発生しました';
};

export default api;