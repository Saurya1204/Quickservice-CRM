import { IModulePermission } from '@/models/Role';

export interface SystemModuleConfig {
  key: string;
  name: string;
  description: string;
  supportedActions: Array<
    'create' | 'read' | 'update' | 'delete' | 'export' | 'approve' | 'reopenCall' | 'uploadDocs' | 'downloadDocs'
  >;
  subSections?: Array<{ key: string; label: string }>;
}

export const SYSTEM_MODULES: SystemModuleConfig[] = [
  {
    key: 'dashboard',
    name: 'Dashboard & Analytics',
    description: 'System-wide analytics, key performance indicators & operations overview',
    supportedActions: ['read', 'export'],
  },
  {
    key: 'branchMaster',
    name: 'Branch Master',
    description: 'Branch hubs, premises, connectivity, power & personnel records',
    supportedActions: ['create', 'read', 'update', 'delete', 'export', 'uploadDocs', 'downloadDocs'],
    subSections: [
      { key: 'viewBranchMaster', label: 'View Branch Master' },
      { key: 'addBranch', label: 'Add Branch' },
      { key: 'editBranch', label: 'Edit Branch' },
      { key: 'deleteBranch', label: 'Delete Branch' },
      { key: 'uploadBranchDocuments', label: 'Upload Branch Documents' },
      { key: 'viewBranchDocuments', label: 'View Branch Documents' },
      { key: 'downloadBranchDocuments', label: 'Download Branch Documents' },
    ],
  },
  {
    key: 'franchiseMaster',
    name: 'Franchise Master',
    description: 'Authorized Service Centres (ASC) & franchise network records',
    supportedActions: ['create', 'read', 'update', 'delete', 'export'],
  },
  {
    key: 'technicianMaster',
    name: 'Technician Master',
    description: 'Field engineers, service skills & qualification records',
    supportedActions: ['create', 'read', 'update', 'delete', 'export'],
  },
  {
    key: 'clientMaster',
    name: 'Client Master',
    description: 'OEM clients, enterprise agreements & reconciliation metrics',
    supportedActions: ['create', 'read', 'update', 'delete', 'export'],
  },
  {
    key: 'brandMaster',
    name: 'Brand Master',
    description: 'OEM Brand registrations and service contracts',
    supportedActions: ['create', 'read', 'update', 'delete', 'export'],
  },
  {
    key: 'categoryMaster',
    name: 'Category Master',
    description: 'Product appliance categories and service lines',
    supportedActions: ['create', 'read', 'update', 'delete', 'export'],
  },
  {
    key: 'otherMasters',
    name: 'Dynamic Masters',
    description: 'Product, Model, Symptom, Cause, Analysis, Spares, City, Locality, Vendor',
    supportedActions: ['create', 'read', 'update', 'delete', 'export'],
  },
  {
    key: 'mapping',
    name: 'Mapping Operations',
    description: 'Brand mapping, Category mapping, Pincode mapping, Warehouse mapping',
    supportedActions: ['create', 'read', 'update', 'delete', 'export'],
  },
  {
    key: 'callManagement',
    name: 'Call Management',
    description: 'Call Registration, Intake, Allotment, Reopen, Appointment, Lifecycle tracking',
    supportedActions: [
      'create',
      'read',
      'update',
      'delete',
      'export',
      'approve',
      'reopenCall',
    ],
    subSections: [
      { key: 'callRegistration', label: 'Call Registration' },
      { key: 'callView', label: 'Call View' },
      { key: 'callEdit', label: 'Call Edit' },
      { key: 'callReminder', label: 'Call Reminder' },
      { key: 'callAppointment', label: 'Call Appointment' },
      { key: 'callReschedule', label: 'Call Reschedule' },
      { key: 'callTransfer', label: 'Call Transfer' },
      { key: 'callReopen', label: 'Call Reopen' },
      { key: 'callCancel', label: 'Call Cancel' },
      { key: 'callFeedback', label: 'Call Feedback' },
      { key: 'callUpdate', label: 'Call Update' },
      { key: 'callAllotment', label: 'Call Allotment' },
      { key: 'jobsheetPrint', label: 'Jobsheet Print' },
      { key: 'directCancel', label: 'Direct Cancel' },
      { key: 'directCancelPo', label: 'Direct Cancel PO' },
      { key: 'updateSerialNo', label: 'Update Serial No.' },
      { key: 'callAudit', label: 'Call Audit' },
    ],
  },
  {
    key: 'masterData',
    name: 'Master Data Download',
    description: 'Export and download master data sets in CSV / Excel format',
    supportedActions: ['read', 'export'],
  },
  {
    key: 'uploader',
    name: 'Live Call & Excel Uploader',
    description: 'Bulk file and Excel imports of customer service tickets',
    supportedActions: ['create', 'read'],
  },
  {
    key: 'reports',
    name: 'Reports & Business Intelligence',
    description: 'Operational, branch, employee, financial and SLA compliance reports',
    supportedActions: ['read', 'export'],
    subSections: [
      { key: 'dashboardReports', label: 'Dashboard Reports' },
      { key: 'operationalReports', label: 'Operational Reports' },
      { key: 'employeeReports', label: 'Employee Reports' },
      { key: 'branchReports', label: 'Branch Reports' },
      { key: 'financialReports', label: 'Financial Reports' },
    ],
  },
  {
    key: 'users',
    name: 'User Management',
    description: 'Create, update, activate/deactivate CRM users and assign roles',
    supportedActions: ['create', 'read', 'update', 'delete', 'export'],
  },
  {
    key: 'roleMaster',
    name: 'Role Master & Access Control',
    description: 'Role hierarchy, permission matrices, reporting relationships',
    supportedActions: ['create', 'read', 'update', 'delete', 'export'],
  },
  {
    key: 'utilities',
    name: 'Utilities & Settings',
    description: 'System configurations, passwords and administrative utilities',
    supportedActions: ['read', 'update'],
  },
];

export const PREDEFINED_ROLES = [
  {
    name: 'Super Admin',
    code: 'SUPER_ADMIN',
    hierarchyLevel: 1,
    reportingTo: '',
    description: 'Unrestricted master administrative access over all systems, roles, permissions and entities',
    isSystem: true,
  },
  {
    name: 'Admin',
    code: 'ADMIN',
    hierarchyLevel: 2,
    reportingTo: 'SUPER_ADMIN',
    description: 'Operational administrator with broad access across service delivery, masters and users',
    isSystem: false,
  },
  {
    name: 'HOD',
    code: 'HOD',
    hierarchyLevel: 3,
    reportingTo: 'ADMIN',
    description: 'Head of Department: Strategic oversight, department reports, SLA compliance and call audit',
    isSystem: false,
  },
  {
    name: 'ZSM',
    code: 'ZSM',
    hierarchyLevel: 4,
    reportingTo: 'HOD',
    description: 'Zonal Service Manager: Zonal branch network oversight, regional performance & call escalations',
    isSystem: false,
  },
  {
    name: 'BSM',
    code: 'BSM',
    hierarchyLevel: 5,
    reportingTo: 'ZSM',
    description: 'Branch Service Manager: Branch operations, local technician allotment, reopen and inventory',
    isSystem: false,
  },
  {
    name: 'ASM',
    code: 'ASM',
    hierarchyLevel: 6,
    reportingTo: 'BSM',
    description: 'Area Service Manager: Field service management, customer appointments and technician tracking',
    isSystem: false,
  },
  {
    name: 'CCO',
    code: 'CCO',
    hierarchyLevel: 7,
    reportingTo: 'ASM',
    description: 'Call Coordinator: Customer call intake, appointment scheduling, call update & customer feedback',
    isSystem: false,
  },
  {
    name: 'Client Admin',
    code: 'CLIENT_ADMIN',
    hierarchyLevel: 3,
    reportingTo: 'ADMIN',
    description: 'Enterprise Client Administrator: Full operational visibility over assigned client brands, complaints & SLA reports',
    isSystem: false,
  },
  {
    name: 'Client User',
    code: 'CLIENT_USER',
    hierarchyLevel: 4,
    reportingTo: 'CLIENT_ADMIN',
    description: 'Client Executive: Real-time service tracking and complaint monitoring for assigned client',
    isSystem: false,
  },
  {
    name: 'Branch Manager',
    code: 'BRANCH_MANAGER',
    hierarchyLevel: 5,
    reportingTo: 'ZSM',
    description: 'Branch Service Manager: Oversees local branch service operations, technicians, allotment and complaints',
    isSystem: false,
  },
  {
    name: 'Zone Manager',
    code: 'ZONE_MANAGER',
    hierarchyLevel: 4,
    reportingTo: 'HOD',
    description: 'Zonal Service Manager: Regional service network oversight and regional performance monitoring',
    isSystem: false,
  },
  {
    name: 'Franchise Manager',
    code: 'FRANCHISE_MANAGER',
    hierarchyLevel: 6,
    reportingTo: 'BRANCH_MANAGER',
    description: 'Authorized Service Centre (ASC) Franchise Manager: Franchise technician tracking & complaint execution',
    isSystem: false,
  },
  {
    name: 'Technician / Engineer',
    code: 'TECHNICIAN',
    hierarchyLevel: 7,
    reportingTo: 'BRANCH_MANAGER',
    description: 'Field Service Engineer: Service visit execution, Job Sheet updates, appliance diagnostics and appointments',
    isSystem: false,
  },
  {
    name: 'Call Centre Executive',
    code: 'CALL_CENTRE_EXECUTIVE',
    hierarchyLevel: 7,
    reportingTo: 'ADMIN',
    description: 'Call Centre Agent: Customer complaint intake, telephone follow-ups and service feedback collection',
    isSystem: false,
  },
];

export function generateDefaultPermissions(roleCode: string): IModulePermission[] {
  const isSuperAdmin = roleCode === 'SUPER_ADMIN';

  return SYSTEM_MODULES.map((mod) => {
    let accessLevel: 'FULL' | 'READ_ONLY' | 'RESTRICTED' | 'NO_ACCESS' = 'NO_ACCESS';
    const actions: any = {
      create: false,
      read: false,
      update: false,
      delete: false,
      export: false,
      approve: false,
      reopenCall: false,
      uploadDocs: false,
      downloadDocs: false,
    };
    const subSections: Record<string, boolean> = {};

    if (mod.subSections) {
      mod.subSections.forEach((sub) => {
        subSections[sub.key] = isSuperAdmin;
      });
    }

    if (isSuperAdmin) {
      accessLevel = 'FULL';
      mod.supportedActions.forEach((act) => {
        actions[act] = true;
      });
      return {
        module: mod.key,
        moduleName: mod.name,
        accessLevel,
        actions,
        subSections,
      };
    }

    // Role-specific defaults
    switch (roleCode) {
      case 'ADMIN':
        if (mod.key === 'roleMaster') {
          accessLevel = 'READ_ONLY';
          actions.read = true;
        } else {
          accessLevel = 'FULL';
          mod.supportedActions.forEach((act) => {
            actions[act] = true;
          });
          if (mod.subSections) {
            mod.subSections.forEach((sub) => (subSections[sub.key] = true));
          }
        }
        break;

      case 'HOD':
        if (['dashboard', 'reports', 'masterData'].includes(mod.key)) {
          accessLevel = 'FULL';
          actions.read = true;
          actions.export = true;
          if (mod.subSections) {
            mod.subSections.forEach((sub) => (subSections[sub.key] = true));
          }
        } else if (mod.key === 'callManagement') {
          accessLevel = 'FULL';
          actions.read = true;
          actions.update = true;
          actions.approve = true;
          actions.reopenCall = true;
          actions.export = true;
          if (mod.subSections) {
            mod.subSections.forEach((sub) => (subSections[sub.key] = true));
          }
        } else if (['branchMaster', 'franchiseMaster', 'technicianMaster', 'clientMaster', 'brandMaster', 'categoryMaster', 'otherMasters'].includes(mod.key)) {
          accessLevel = 'READ_ONLY';
          actions.read = true;
          actions.export = true;
          actions.downloadDocs = true;
        }
        break;

      case 'ZSM':
        if (['dashboard', 'branchMaster', 'franchiseMaster', 'technicianMaster', 'callManagement', 'reports'].includes(mod.key)) {
          accessLevel = 'RESTRICTED';
          actions.read = true;
          actions.update = true;
          actions.export = true;
          if (mod.key === 'callManagement') {
            actions.reopenCall = true;
            actions.update = true;
          }
          if (mod.key === 'branchMaster') {
            actions.uploadDocs = true;
            actions.downloadDocs = true;
          }
          if (mod.subSections) {
            mod.subSections.forEach((sub) => {
              if (!['financialReports', 'employeeReports'].includes(sub.key)) {
                subSections[sub.key] = true;
              }
            });
          }
        }
        break;

      case 'BSM':
        if (mod.key === 'dashboard') {
          accessLevel = 'READ_ONLY';
          actions.read = true;
        } else if (mod.key === 'branchMaster') {
          accessLevel = 'RESTRICTED';
          actions.read = true;
          actions.update = true;
          actions.uploadDocs = true;
          actions.downloadDocs = true;
          subSections.viewBranchMaster = true;
          subSections.editBranch = true;
          subSections.uploadBranchDocuments = true;
          subSections.viewBranchDocuments = true;
          subSections.downloadBranchDocuments = true;
        } else if (mod.key === 'callManagement') {
          accessLevel = 'FULL';
          actions.read = true;
          actions.update = true;
          actions.create = true;
          actions.reopenCall = true;
          actions.export = true;
          if (mod.subSections) {
            mod.subSections.forEach((sub) => (subSections[sub.key] = true));
          }
        } else if (['technicianMaster', 'franchiseMaster'].includes(mod.key)) {
          accessLevel = 'READ_ONLY';
          actions.read = true;
        } else if (mod.key === 'reports') {
          accessLevel = 'RESTRICTED';
          actions.read = true;
          subSections.branchReports = true;
          subSections.operationalReports = true;
        }
        break;

      case 'ASM':
        if (mod.key === 'dashboard') {
          accessLevel = 'READ_ONLY';
          actions.read = true;
        } else if (mod.key === 'callManagement') {
          accessLevel = 'RESTRICTED';
          actions.read = true;
          actions.update = true;
          actions.create = true;
          subSections.callRegistration = true;
          subSections.callView = true;
          subSections.callEdit = true;
          subSections.callAllotment = true;
          subSections.callAppointment = true;
          subSections.callUpdate = true;
          subSections.callFeedback = true;
        } else if (['technicianMaster', 'branchMaster'].includes(mod.key)) {
          accessLevel = 'READ_ONLY';
          actions.read = true;
        }
        break;

      case 'CCO':
        if (mod.key === 'dashboard') {
          accessLevel = 'READ_ONLY';
          actions.read = true;
        } else if (mod.key === 'callManagement') {
          accessLevel = 'RESTRICTED';
          actions.create = true;
          actions.read = true;
          actions.update = true;
          subSections.callRegistration = true;
          subSections.callView = true;
          subSections.callEdit = true;
          subSections.callAppointment = true;
          subSections.callReschedule = true;
          subSections.callFeedback = true;
          subSections.callUpdate = true;
          subSections.callAllotment = true;
        } else if (mod.key === 'branchMaster') {
          accessLevel = 'READ_ONLY';
          actions.read = true;
          subSections.viewBranchMaster = true;
        }
        break;

      case 'CLIENT_ADMIN':
        if (mod.key === 'dashboard') {
          accessLevel = 'FULL';
          actions.read = true;
          actions.export = true;
        } else if (mod.key === 'callManagement') {
          accessLevel = 'FULL';
          actions.read = true;
          actions.create = true;
          actions.update = true;
          actions.export = true;
          subSections.callRegistration = true;
          subSections.callView = true;
          subSections.callFeedback = true;
          subSections.callAudit = true;
        } else if (mod.key === 'reports') {
          accessLevel = 'RESTRICTED';
          actions.read = true;
          actions.export = true;
          subSections.dashboardReports = true;
          subSections.operationalReports = true;
        }
        break;

      case 'CLIENT_USER':
        if (mod.key === 'dashboard') {
          accessLevel = 'READ_ONLY';
          actions.read = true;
        } else if (mod.key === 'callManagement') {
          accessLevel = 'RESTRICTED';
          actions.read = true;
          actions.create = true;
          subSections.callRegistration = true;
          subSections.callView = true;
          subSections.callFeedback = true;
        } else if (mod.key === 'reports') {
          accessLevel = 'READ_ONLY';
          actions.read = true;
          subSections.operationalReports = true;
        }
        break;

      case 'BRANCH_MANAGER':
        if (mod.key === 'dashboard') {
          accessLevel = 'FULL';
          actions.read = true;
        } else if (mod.key === 'callManagement') {
          accessLevel = 'FULL';
          actions.read = true;
          actions.update = true;
          actions.create = true;
          actions.reopenCall = true;
          actions.export = true;
          if (mod.subSections) {
            mod.subSections.forEach((sub) => (subSections[sub.key] = true));
          }
        } else if (mod.key === 'technicianMaster' || mod.key === 'branchMaster') {
          accessLevel = 'READ_ONLY';
          actions.read = true;
        } else if (mod.key === 'reports') {
          accessLevel = 'RESTRICTED';
          actions.read = true;
          subSections.branchReports = true;
          subSections.operationalReports = true;
        }
        break;

      case 'ZONE_MANAGER':
        if (['dashboard', 'branchMaster', 'franchiseMaster', 'technicianMaster', 'callManagement', 'reports'].includes(mod.key)) {
          accessLevel = 'RESTRICTED';
          actions.read = true;
          actions.update = true;
          actions.export = true;
          if (mod.subSections) {
            mod.subSections.forEach((sub) => {
              if (!['financialReports', 'employeeReports'].includes(sub.key)) {
                subSections[sub.key] = true;
              }
            });
          }
        }
        break;

      case 'FRANCHISE_MANAGER':
        if (mod.key === 'dashboard') {
          accessLevel = 'FULL';
          actions.read = true;
        } else if (mod.key === 'callManagement') {
          accessLevel = 'RESTRICTED';
          actions.read = true;
          actions.update = true;
          subSections.callView = true;
          subSections.callUpdate = true;
          subSections.callAllotment = true;
          subSections.callAppointment = true;
          subSections.jobsheetPrint = true;
          subSections.callFeedback = true;
        } else if (mod.key === 'technicianMaster') {
          accessLevel = 'READ_ONLY';
          actions.read = true;
        }
        break;

      case 'TECHNICIAN':
        if (mod.key === 'dashboard') {
          accessLevel = 'READ_ONLY';
          actions.read = true;
        } else if (mod.key === 'callManagement') {
          accessLevel = 'RESTRICTED';
          actions.read = true;
          actions.update = true;
          subSections.callView = true;
          subSections.callUpdate = true;
          subSections.callAppointment = true;
          subSections.callReschedule = true;
          subSections.jobsheetPrint = true;
        }
        break;

      case 'CALL_CENTRE_EXECUTIVE':
        if (mod.key === 'dashboard') {
          accessLevel = 'READ_ONLY';
          actions.read = true;
        } else if (mod.key === 'callManagement') {
          accessLevel = 'RESTRICTED';
          actions.create = true;
          actions.read = true;
          actions.update = true;
          subSections.callRegistration = true;
          subSections.callView = true;
          subSections.callEdit = true;
          subSections.callAppointment = true;
          subSections.callReschedule = true;
          subSections.callFeedback = true;
          subSections.callUpdate = true;
          subSections.callAllotment = true;
        }
        break;
    }

    return {
      module: mod.key,
      moduleName: mod.name,
      accessLevel,
      actions,
      subSections,
    };
  });
}
