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
  | "users";

type PermissionConfig = {
  view: Role[];
  edit?: Role[];
  create?: Role[];
};

const config: Record<Module, PermissionConfig> = {
  requisitions: { view: [Role.ADMIN, Role.HR, Role.RECRUITER, Role.HIRING_MANAGER], edit: [Role.ADMIN, Role.HR, Role.RECRUITER, Role.HIRING_MANAGER], create: [Role.ADMIN, Role.HR, Role.RECRUITER, Role.HIRING_MANAGER] },
  postings: { view: [Role.ADMIN, Role.HR, Role.RECRUITER], edit: [Role.ADMIN, Role.HR, Role.RECRUITER], create: [Role.ADMIN, Role.HR, Role.RECRUITER] },
  ats: { view: [Role.ADMIN, Role.HR, Role.RECRUITER], edit: [Role.ADMIN, Role.HR, Role.RECRUITER] },
  interviews: { view: [Role.ADMIN, Role.HR, Role.RECRUITER, Role.INTERVIEWER, Role.HIRING_MANAGER], edit: [Role.ADMIN, Role.HR, Role.RECRUITER, Role.INTERVIEWER, Role.HIRING_MANAGER], create: [Role.ADMIN, Role.HR, Role.RECRUITER] },
  offers: { view: [Role.ADMIN, Role.HR, Role.RECRUITER], edit: [Role.ADMIN, Role.HR, Role.RECRUITER], create: [Role.ADMIN, Role.HR, Role.RECRUITER] },
  background: { view: [Role.ADMIN, Role.HR], edit: [Role.ADMIN, Role.HR], create: [Role.ADMIN, Role.HR] },
  analytics: { view: [Role.ADMIN, Role.HR, Role.RECRUITER, Role.HIRING_MANAGER] },
  onboarding: { view: [Role.ADMIN, Role.HR, Role.RECRUITER], edit: [Role.ADMIN, Role.HR, Role.RECRUITER], create: [Role.ADMIN, Role.HR, Role.RECRUITER] },
  payroll: { view: [Role.ADMIN], edit: [Role.ADMIN], create: [Role.ADMIN] },
  users: { view: [Role.ADMIN], edit: [Role.ADMIN], create: [Role.ADMIN] }
};

export const hasAccess = (role: Role | undefined, module: Module, action: keyof PermissionConfig = "view"): boolean => {
  if (!role) return false;
  const entry = config[module];
  const allowed = entry?.[action] || entry?.view || [];
  return allowed.includes(role);
};
