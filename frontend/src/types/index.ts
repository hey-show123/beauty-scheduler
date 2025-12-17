// スタッフ関連の型定義
export enum ServiceType {
  CUT = 'cut',
  COLOR = 'color',
  PERM = 'perm',
  TREATMENT = 'treatment',
  STYLING = 'styling',
  FACIAL = 'facial',
}

export enum SkillLevel {
  BEGINNER = 1,
  INTERMEDIATE = 2,
  ADVANCED = 3,
  EXPERT = 4,
}

export interface Skill {
  service_type: ServiceType;
  level: SkillLevel;
  years_experience: number;
}

export interface Availability {
  day_of_week: number; // 0=月曜, 6=日曜
  start_time: string; // "09:00"
  end_time: string; // "18:00"
  is_preferred: boolean;
}

export interface Staff {
  id: string;
  name: string;
  skills: Skill[];
  availability: Availability[];
  hourly_rate: number;
  max_hours_per_day: number;
}

// 予約関連の型定義
export enum Priority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  VIP = 'VIP',
}

export enum BookingStatus {
  SCHEDULED = 'scheduled',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface Service {
  service_type: ServiceType;
  duration_minutes: number;
  required_skill_level: SkillLevel;
  price: number;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  priority: Priority;
  preferred_staff_ids: string[];
}

export interface Booking {
  id: string;
  customer: Customer;
  services: Service[];
  scheduled_start: string; // ISO datetime string
  status: BookingStatus;
  assigned_staff_id?: string;
  notes: string;
}

// スケジュール関連の型定義
export interface ScheduleItem {
  booking_id: string;
  staff_id: string;
  staff_name: string;
  customer_name: string;
  services: string[];
  start_slot: number;
  duration_slots: number;
}

export interface OptimizationResult {
  status: string;
  schedule: ScheduleItem[];
  solver_stats: {
    solve_time: number;
    objective_value: number;
  };
}

// フォーム関連の型定義
export interface StaffFormData {
  name: string;
  skills: Skill[];
  availability: Availability[];
  hourly_rate: number;
  max_hours_per_day: number;
}

export interface BookingFormData {
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  services: Service[];
  scheduled_start: string;
  priority: Priority;
  preferred_staff_ids: string[];
  notes: string;
}

export interface OptimizationRequest {
  schedule_date: string;
  staff_ids: string[];
  booking_ids: string[];
}

// API レスポンス型
export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface StatsResponse {
  total_staff: number;
  total_bookings: number;
  service_types: string[];
  skill_levels: number[];
}