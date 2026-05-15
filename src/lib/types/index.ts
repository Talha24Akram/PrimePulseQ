export type SubscriptionTier = "starter" | "growth" | "enterprise";

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  tier: SubscriptionTier;
  employee_count: number;
  created_at: string;
  owner_id: string;
}

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  company_id?: string;
  role: "admin" | "manager" | "viewer";
  created_at: string;
}

export interface Employee {
  id: string;
  company_id: string;
  email: string;
  name: string;
  department?: string;
  is_active: boolean;
  created_at: string;
}

export type QuestionType = "scale" | "multiple_choice" | "text" | "yes_no";

export interface Question {
  id: string;
  survey_id: string;
  text: string;
  type: QuestionType;
  options?: string[];
  required: boolean;
  order: number;
}

export type SurveyStatus = "draft" | "active" | "closed";
export type SurveyFrequency = "one_time" | "weekly" | "biweekly" | "monthly";

export interface Survey {
  id: string;
  company_id: string;
  title: string;
  description?: string;
  status: SurveyStatus;
  frequency: SurveyFrequency;
  token: string;
  response_count: number;
  sent_count: number;
  created_at: string;
  closes_at?: string;
  questions?: Question[];
}

export interface SurveyResponse {
  id: string;
  survey_id: string;
  submitted_at: string;
  answers: ResponseAnswer[];
}

export interface ResponseAnswer {
  id: string;
  response_id: string;
  question_id: string;
  value: string;
}

export interface EngagementMetric {
  date: string;
  score: number;
  response_rate: number;
}

export interface DashboardStats {
  engagement_score: number;
  response_rate: number;
  active_surveys: number;
  employee_count: number;
  burnout_risk: number;
  trend: "up" | "down" | "stable";
}
