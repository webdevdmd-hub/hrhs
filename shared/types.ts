import React from 'react';

export enum Role {
  CEO = 'CEO',
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
  USER = 'USER',
  MANAGER = 'MANAGER',
  HR = 'HR',
  RECRUITER = 'RECRUITER',
  HIRING_MANAGER = 'HIRING_MANAGER',
  INTERVIEWER = 'INTERVIEWER'
}

export interface CompanyAddress {
  type?: string;
  line1: string;
  line2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

export interface CompanyRole {
  id: string;
  name: string;
  description?: string;
  systemRole?: Role;
  permissions?: string[];
  createdAt?: Date;
  createdBy?: string;
}

export interface Company {
  id: string;
  name: string;
  legalName?: string;
  registrationNumber?: string;
  taxId?: string;
  industry?: string;
  status: 'active' | 'inactive';
  primaryContact?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  addresses?: CompanyAddress[];
  roles?: CompanyRole[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: Role;
  designation: string;
  department: string;
  companyId?: string;
  companyName?: string;
  companyRoleId?: string;
  companyRoleName?: string;
  companyRoleSystemRole?: Role;
  employeeRecordId?: string;
  avatarUrl?: string;
  status: 'active' | 'inactive';
  checkInStatus: 'in' | 'out';
  lastCheckIn?: Date;
  archived?: boolean;
}

export interface EmploymentDetails {
  userId: string; // UID linking to Auth + users collection
  employeeId?: string;
  nickName?: string;
  jobTitle?: string;
  department?: string;
  designation?: string;
  employmentType?: string;
  employmentStatus?: string;
  hireDate?: string; // ISO date string
  dateOfExit?: string; // ISO date string
  sourceOfHire?: string;
  location?: string;
  managerName?: string;
  zohoRole?: string;
  currentExperience?: string;
  totalExperience?: string;
  dateOfBirth?: string;
  age?: string;
  gender?: string;
  maritalStatus?: string;
  about?: string;
  expertise?: string;
  extension?: string;
  seatingLocation?: string;
  tags?: string;
  presentAddress?: string;
  permanentAddress?: string;
  workPhone?: string;
  personalPhone?: string;
  personalEmail?: string;
  addedBy?: string;
  modifiedBy?: string;
  addedTime?: string;
  modifiedTime?: string;
  onboardingStatus?: string;
  workExperienceCompany?: string;
  workExperienceJobTitle?: string;
  workExperienceFrom?: string;
  workExperienceTo?: string;
  workExperienceJobDescription?: string;
  workExperienceRelevant?: string;
  educationInstituteName?: string;
  educationDegree?: string;
  educationSpecialization?: string;
  educationCompletionDate?: string;
  notes?: string;
  updatedAt?: Date;
  createdAt?: Date;
}

export type EmployeeStatus = 'active' | 'inactive' | 'pending';

export interface EmployeeBasicDetails {
  firstName: string;
  middleName?: string;
  lastName: string;
  firstNameArabic?: string;
  employeeId: string;
  employmentType?: string;
  dateOfJoining?: string;
  confirmationDate?: string;
  workEmail?: string;
  mobileNumber?: string;
  gender?: string;
  workLocation?: string;
  designation?: string;
  department?: string;
  portalAccessEnabled?: boolean;
  language?: string;
  socialSecurityGcc?: boolean;
  originCountry?: string;
}

export interface EmployeeSalaryDetails {
  base?: number;
  housingAllowance?: number;
  costOfLivingAllowance?: number;
  childrenAllowance?: number;
  otherAllowance?: number;
  fixedAllowance?: number;
  frequency?: 'Monthly' | 'Bi-Weekly' | 'Weekly';
}

export interface EmployeePersonalDetails {
  dateOfBirth?: string;
  age?: string;
  maritalStatus?: string;
  about?: string;
  expertise?: string;
  fatherName?: string;
  molId?: string;
  personalEmail?: string;
  presentAddressLine1?: string;
  presentAddressLine2?: string;
  presentCity?: string;
  presentState?: string;
  presentCountry?: string;
  presentAddressArabicLine1?: string;
  presentAddressArabicLine2?: string;
  permanentAddressLine1?: string;
  permanentAddressLine2?: string;
  permanentCity?: string;
  permanentState?: string;
  permanentCountry?: string;
}

export interface EmployeePaymentInformation {
  bankName?: string;
  accountNumber?: string;
  iban?: string;
  method?: 'Bank Transfer' | 'Check' | 'Cash';
  accountHolderName?: string;
}

export interface EmployeeDocumentItem {
  name: string;
  url?: string;
  type?: string;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'changes_requested';

export interface RequisitionApprovalStep {
  role: string;
  userId?: string;
  name?: string;
  status: ApprovalStatus;
  comment?: string;
  updatedAt?: Date;
}

export interface RequisitionAuditEntry {
  action: string;
  by: string;
  byName?: string;
  at: Date;
  details?: string;
}

export interface SalaryBand {
  min: number;
  max: number;
  currency: string;
}

export interface JobRequisition {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  grade?: string;
  openings: number;
  salaryRange?: SalaryBand;
  targetStartDate?: string;
  costCenter?: string;
  hiringManager?: string;
  recruiters?: string[];
  justification?: string;
  status: 'draft' | 'pending' | 'approved' | 'changes_requested' | 'rejected' | 'closed';
  approvals: RequisitionApprovalStep[];
  timeline: RequisitionAuditEntry[];
  createdBy: string;
  createdByName?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Employee {
  id: string;
  userId?: string;
  companyId?: string;
  companyName?: string;
  companyRoleId?: string;
  companyRoleName?: string;
  employeeId?: string;
  firstName?: string;
  lastName?: string;
  preferredName?: string;
  email: string;
  personalEmail?: string;
  workPhone?: string;
  personalPhone?: string;
  department?: string;
  designation?: string;
  employmentType?: string;
  employmentStatus: EmployeeStatus;
  dateOfJoining?: string;
  dateOfExit?: string;
  managerName?: string;
  location?: string;
  seatingLocation?: string;
  tags?: string;
  presentAddress?: string;
  permanentAddress?: string;
  dateOfBirth?: string;
  age?: string;
  gender?: string;
  maritalStatus?: string;
  about?: string;
  expertise?: string;
  onboardingStatus?: string;
  currentExperience?: string;
  totalExperience?: string;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  basicDetails?: EmployeeBasicDetails;
  salaryDetails?: EmployeeSalaryDetails;
  personalDetails?: EmployeePersonalDetails;
  paymentInformation?: EmployeePaymentInformation;
  documents?: EmployeeDocumentItem[];
}

export interface AttendanceRecord {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  checkIn?: string; // ISO string
  checkOut?: string;
  status: 'present' | 'absent' | 'half-day' | 'late' | 'early';
  totalHours?: number;
  overtimeHours?: number;
  isLate?: boolean;
  isEarlyDeparture?: boolean;
  notes?: string;
  approvedBy?: string;
  approvalStatus?: 'pending' | 'approved' | 'rejected';
  updatedBy?: string;
  updatedAt?: Date;
  createdAt?: Date;
}

export interface CrosschexLog {
  userId: string;
  deviceId?: string;
  direction?: 'in' | 'out';
  timestamp: string; // ISO timestamp
  raw?: any;
}

export interface JobApplication {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cover?: string;
  consentAccepted: boolean;
  consentVersion: string;
  source?: string;
  files?: string[]; // file names or storage paths
  postingId?: string;
  postingTitle?: string;
  stage?: 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired' | 'Rejected' | 'On hold';
  rating?: number;
  tags?: string[];
  notes?: ApplicationNote[];
  submittedAt?: Date;
}

export interface ApplicationNote {
  id: string;
  text: string;
  author: string;
  authorName?: string;
  createdAt: Date;
}

export interface JobPosting {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: string;
  description: string;
  internalOnly: boolean;
  consentVersion: string;
  status: 'draft' | 'published';
  requisitionId?: string;
  requisitionTitle?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type InterviewFormat = 'In-person' | 'Video' | 'Phone';
export type InterviewStatus = 'Scheduled' | 'Completed' | 'Cancelled' | 'No-show';

export interface InterviewFeedback {
  id: string;
  author: string;
  authorName?: string;
  rating?: number;
  notes: string;
  submittedAt: Date;
}

export interface Interview {
  id: string;
  candidate: string;
  candidateEmail?: string;
  candidatePhone?: string;
  jobTitle: string;
  postingId?: string;
  applicationId?: string;
  stage: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  durationMinutes: number;
  format: InterviewFormat;
  interviewers: string[];
  location?: string;
  videoLink?: string;
  notes?: string;
  status: InterviewStatus;
  feedback?: InterviewFeedback[];
  createdAt?: Date;
  updatedAt?: Date;
}

export type OfferStatus = 'Drafted' | 'Approved' | 'Sent' | 'Viewed' | 'Accepted' | 'Rejected' | 'Expired' | 'Withdrawn';

export interface Offer {
  id: string;
  candidate: string;
  candidateEmail?: string;
  jobTitle: string;
  postingId?: string;
  applicationId?: string;
  requisitionId?: string;
  salary: number;
  currency: string;
  startDate?: string;
  status: OfferStatus;
  version: number;
  approvals?: RequisitionApprovalStep[];
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type BackgroundStatus = 'Initiated' | 'In progress' | 'Completed' | 'Flagged' | 'Cleared' | 'Rejected';

export interface BackgroundCheck {
  id: string;
  candidate: string;
  candidateEmail?: string;
  jobTitle?: string;
  postingId?: string;
  applicationId?: string;
  offerId?: string;
  packageType?: string;
  vendor?: string;
  consentVersion?: string;
  consentAt?: Date;
  requestedBy?: string;
  startedAt?: Date;
  completedAt?: Date;
  status: BackgroundStatus;
  resultSummary?: string;
  attachments?: string[];
  audit?: RequisitionAuditEntry[];
  createdAt?: Date;
  updatedAt?: Date;
}

export type OnboardingStatus = 'pending' | 'in-progress' | 'completed';

export interface OnboardingTask {
  id: string;
  title: string;
  status: 'todo' | 'done';
  assignee?: string;
}

export interface OnboardingRecord {
  id: string;
  candidate: string;
  candidateEmail?: string;
  jobTitle?: string;
  postingId?: string;
  requisitionId?: string;
  applicationId?: string;
  offerId?: string;
  backgroundCheckId?: string;
  status: OnboardingStatus;
  tasks: OnboardingTask[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  subItems?: NavItem[];
}

export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}
