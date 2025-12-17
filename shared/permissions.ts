import { Role } from "./types";

export type Module =
  | "requisitions"
  | "postings"
  | "ats"
  | "interviews"
  | "offers"
  | "background"
  | "analytics"
  | "onboarding"
  | "payroll"
  | "users"
  | "companies";

export type PermissionConfig = {
  view: Role[];
  edit?: Role[];
  create?: Role[];
};

const config: Record<Module, PermissionConfig> = {
  requisitions: { view: [Role.ADMIN, Role.CEO, Role.HR, Role.RECRUITER, Role.HIRING_MANAGER], edit: [Role.ADMIN, Role.CEO, Role.HR, Role.RECRUITER, Role.HIRING_MANAGER], create: [Role.ADMIN, Role.CEO, Role.HR, Role.RECRUITER, Role.HIRING_MANAGER] },
  postings: { view: [Role.ADMIN, Role.CEO, Role.HR, Role.RECRUITER], edit: [Role.ADMIN, Role.CEO, Role.HR, Role.RECRUITER], create: [Role.ADMIN, Role.CEO, Role.HR, Role.RECRUITER] },
  ats: { view: [Role.ADMIN, Role.CEO, Role.HR, Role.RECRUITER], edit: [Role.ADMIN, Role.CEO, Role.HR, Role.RECRUITER] },
  interviews: { view: [Role.ADMIN, Role.CEO, Role.HR, Role.RECRUITER, Role.INTERVIEWER, Role.HIRING_MANAGER], edit: [Role.ADMIN, Role.CEO, Role.HR, Role.RECRUITER, Role.INTERVIEWER, Role.HIRING_MANAGER], create: [Role.ADMIN, Role.CEO, Role.HR, Role.RECRUITER] },
  offers: { view: [Role.ADMIN, Role.CEO, Role.HR, Role.RECRUITER], edit: [Role.ADMIN, Role.CEO, Role.HR, Role.RECRUITER], create: [Role.ADMIN, Role.CEO, Role.HR, Role.RECRUITER] },
  background: { view: [Role.ADMIN, Role.CEO, Role.HR], edit: [Role.ADMIN, Role.CEO, Role.HR], create: [Role.ADMIN, Role.CEO, Role.HR] },
  analytics: { view: [Role.ADMIN, Role.CEO, Role.HR, Role.RECRUITER, Role.HIRING_MANAGER] },
  onboarding: { view: [Role.ADMIN, Role.CEO, Role.HR, Role.RECRUITER], edit: [Role.ADMIN, Role.CEO, Role.HR, Role.RECRUITER], create: [Role.ADMIN, Role.CEO, Role.HR, Role.RECRUITER] },
  payroll: { view: [Role.ADMIN, Role.CEO], edit: [Role.ADMIN, Role.CEO], create: [Role.ADMIN, Role.CEO] },
  users: { view: [Role.ADMIN, Role.CEO], edit: [Role.ADMIN, Role.CEO], create: [Role.ADMIN, Role.CEO] },
  companies: { view: [Role.ADMIN, Role.CEO], edit: [Role.ADMIN, Role.CEO], create: [Role.ADMIN, Role.CEO] }
};

export const hasAccess = (role: Role | undefined, module: Module, action: keyof PermissionConfig = "view"): boolean => {
  if (!role) return false;
  const entry = config[module];
  const allowed = entry?.[action] || entry?.view || [];
  return allowed.includes(role);
};
