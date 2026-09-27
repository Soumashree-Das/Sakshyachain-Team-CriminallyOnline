import fs from 'fs';
import path from 'path';
import { CONFIG } from '../config.js';
import { generateRSAKeyPair } from './cryptoService.js';
import { supabase } from '../supabaseClient.js';
import { evaluateDocumentAccess } from './documentAccessService.js';

// Pre-generated RSA Key Pairs for Demo Users
const inspectorKeyPair = generateRSAKeyPair();
const prosecutorKeyPair = generateRSAKeyPair();
const judgeKeyPair = generateRSAKeyPair();
const forensicKeyPair = generateRSAKeyPair();
const auditorKeyPair = generateRSAKeyPair();

const INITIAL_DB = {
  users: [
    {
      id: 'USR-POL-101',
      name: 'Inspector Vikram Sharma',
      employeeId: 'POL-101',
      username: 'POL-101',
      role: 'POLICE_INVESTIGATOR',
      supervisorId: 'USR-JUD-404',
      roleTitle: 'Chief Investigating Officer',
      department: 'LEO', // Law Enforcement Organization
      departmentName: 'Special Crime Branch - Central Police',
      clearanceLevel: 3, // 1: Unclassified, 2: Confidential, 3: Secret, 4: Top Secret
      publicKey: inspectorKeyPair.publicKey,
      privateKey: inspectorKeyPair.privateKey, // Encrypted/managed in server key store
      policeStation: 'Central Police Station', workLocation: 'Central District Headquarters', contact: 'vikram.sharma@demo.icjs.gov.in', assignedIp: '10.20.20.101',
      assignedCases: ['CASE-2026-8891']
    },
    {
      id: 'USR-FOR-202',
      name: 'Dr. Sunita Rao',
      employeeId: 'FOR-202',
      username: 'FOR-202',
      role: 'FORENSIC_SPECIALIST',
      supervisorId: 'USR-JUD-404',
      roleTitle: 'Senior Forensic Analyst & Ballistics Expert',
      department: 'FOR',
      departmentName: 'State Central Forensic Science Laboratory',
      clearanceLevel: 3,
      publicKey: forensicKeyPair.publicKey,
      privateKey: forensicKeyPair.privateKey,
      workLocation: 'State Central Forensic Science Laboratory, Kolkata', contact: 'sunita.rao@demo.icjs.gov.in', assignedIp: '10.20.20.102',
      assignedCases: ['CASE-2026-8891', 'CASE-2026-4412']
    },
    {
      id: 'USR-PRO-303',
      name: 'Advocate Rajesh Verma',
      employeeId: 'PROS-303',
      username: 'PROS-303',
      role: 'PUBLIC_PROSECUTOR',
      supervisorId: 'USR-JUD-404',
      roleTitle: 'Senior Public Prosecutor',
      department: 'PROS',
      departmentName: 'Directorate of Prosecution - High Court Division',
      clearanceLevel: 3,
      publicKey: prosecutorKeyPair.publicKey,
      privateKey: prosecutorKeyPair.privateKey,
      workLocation: 'High Court Division, Kolkata', contact: 'rajesh.verma@demo.icjs.gov.in', assignedIp: '10.20.20.103',
      assignedCases: ['CASE-2026-8891', 'CASE-2026-1102']
    },
    {
      id: 'USR-JUD-404',
      name: 'Justice P. K. Mukherjee',
      employeeId: 'JUD-404',
      username: 'JUD-404',
      role: 'JUDICIAL_MAGISTRATE',
      roleTitle: 'Special Sessions Court Magistrate',
      department: 'JUD',
      departmentName: 'High Court of Judicature / Sessions Court',
      clearanceLevel: 4,
      publicKey: judgeKeyPair.publicKey,
      privateKey: judgeKeyPair.privateKey,
      workLocation: 'Sessions Court, Kolkata', contact: 'court.registry@demo.icjs.gov.in', assignedIp: '10.20.20.104',
      assignedCases: ['CASE-2026-8891', 'CASE-2026-4412', 'CASE-2026-1102']
    },
    {
      id: 'USR-AUD-505',
      name: 'Anil Gupta',
      employeeId: 'AUD-505',
      username: 'AUD-505',
      role: 'COMPLIANCE_AUDITOR',
      roleTitle: 'Principal Information Security Auditor',
      department: 'AUD',
      departmentName: 'National Digital Evidence & Judicial Oversight Board',
      clearanceLevel: 4,
      publicKey: auditorKeyPair.publicKey,
      privateKey: auditorKeyPair.privateKey,
      workLocation: 'National Digital Evidence Oversight Board, New Delhi', contact: 'anil.gupta@demo.icjs.gov.in', assignedIp: '10.20.20.105',
      assignedCases: ['CASE-2026-8891', 'CASE-2026-4412', 'CASE-2026-1102']
    }
  ],
  cases: [
    {
      id: 'CASE-2026-8891',
      title: 'State vs. Cyber Syndicate (Financial Fraud & Homicide)',
      firNumber: 'FIR-2026-00492',
      status: 'UNDER_TRIAL',
      leadInvestigator: 'Inspector Vikram Sharma',
      prosecutor: 'Advocate Rajesh Verma',
      presidingJudge: 'Justice P. K. Mukherjee',
      dateFiled: '2026-08-14',
      description: 'Multi-million financial crypto siphoning with linked homicide of key whistleblower witness.',
      clearanceRequired: 3,
      departmentsAccess: ['LEO', 'FOR', 'PROS', 'JUD', 'AUD']
    },
    {
      id: 'CASE-2026-4412',
      title: 'State Narcotics Operation - Seizure & Ballistics Case',
      firNumber: 'FIR-2026-00311',
      status: 'INVESTIGATION_IN_PROGRESS',
      leadInvestigator: 'Inspector Vikram Sharma',
      prosecutor: 'Advocate Rajesh Verma',
      presidingJudge: 'Justice P. K. Mukherjee',
      dateFiled: '2026-07-22',
      description: 'Illegal firearms trafficking ring and seizure of prohibited contraband.',
      clearanceRequired: 3,
      departmentsAccess: ['LEO', 'FOR', 'PROS', 'JUD', 'AUD']
    },
    {
      id: 'CASE-2026-1102',
      title: 'Commercial Complex Armed Robbery & Heist',
      firNumber: 'FIR-2026-00108',
      status: 'CHARGE_SHEET_FILED',
      leadInvestigator: 'Inspector Vikram Sharma',
      prosecutor: 'Advocate Rajesh Verma',
      presidingJudge: 'Justice P. K. Mukherjee',
      dateFiled: '2026-05-10',
      description: 'Armed burglary at Central Tech Vault, recovery of forensic fingerprints and stolen bonds.',
      clearanceRequired: 2,
      departmentsAccess: ['LEO', 'PROS', 'JUD', 'AUD']
    }
  ],
  documents: [], // Managed by storageService + dbService
  accessRequests: [],
  approvals: [],
  abnormalities: [],
  documentPermissions: [],
  transferRequests: [
    {
      id: 'TRF-9001',
      caseId: 'CASE-2026-8891',
      documentId: 'DOC-8891-002',
      documentTitle: 'Forensic Ballistics & DNA Fingerprint Analysis',
      requestedBy: 'USR-PRO-303',
      requestedByName: 'Advocate Rajesh Verma',
      fromDepartment: 'FOR',
      toDepartment: 'PROS',
      status: 'APPROVED',
      dateRequested: '2026-09-01T10:15:00Z',
      dateApproved: '2026-09-01T11:30:00Z',
      approvedBy: 'USR-FOR-202'
    }
  ]
};

class DBService {
  constructor() {
    this.dbPath = CONFIG.DB_FILE;
    this.init();
  }

  init() {
    if (!fs.existsSync(CONFIG.DATA_DIR)) {
      fs.mkdirSync(CONFIG.DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(CONFIG.VAULT_DIR)) {
      fs.mkdirSync(CONFIG.VAULT_DIR, { recursive: true });
    }
    if (!fs.existsSync(this.dbPath)) {
      this.writeDB(INITIAL_DB);
    }
  }

  readDB() {
    try {
      const data = fs.readFileSync(this.dbPath, 'utf8');
      const db = JSON.parse(data);
      db.accessRequests ||= [];
      db.approvals ||= [];
      db.abnormalities ||= [];
      db.documentPermissions ||= [];
      let migrated = false;
      if (!db.users.some(u => u.id === 'USR-IT-001')) { db.users.push({ id: 'USR-IT-001', name: 'SākshyaChain IT Administrator', username: 'it_admin1', role: 'IT_ADMIN', roleTitle: 'IT Admin — Access Custodian', systemRole: 'IT_ADMIN', department: 'IT', departmentName: 'Information Technology', clearanceLevel: 0, assignedCases: [] }); migrated = true; }
      const firstITAdmin = db.users.find(u => u.id === 'USR-IT-001');
      if (firstITAdmin && (firstITAdmin.username !== 'it_admin1' || firstITAdmin.roleTitle !== 'IT Admin — Access Custodian')) { firstITAdmin.username = 'it_admin1'; firstITAdmin.roleTitle = 'IT Admin — Access Custodian'; firstITAdmin.systemRole = 'IT_ADMIN'; migrated = true; }
      if (!db.users.some(u => u.id === 'USR-IT-002')) { db.users.push({ id: 'USR-IT-002', name: 'Meera Nair', username: 'it_admin2', role: 'IT_ADMIN', roleTitle: 'IT Admin — Access Custodian', systemRole: 'IT_ADMIN', department: 'IT', departmentName: 'Information Technology', clearanceLevel: 0, assignedCases: [] }); migrated = true; }
      if (!db.users.some(u => u.id === 'USR-SUP-606')) {
        db.users.push({
          id: 'USR-SUP-606', employeeId: 'SUP-606', username: 'SUP-606', name: 'Inspector Arjun Sen',
          role: 'SUPERVISOR', systemRole: 'EMPLOYEE', roleTitle: 'Investigations Supervisor', department: 'LEO',
          departmentName: 'Special Crime Branch - Central Police', policeStation: 'Central Police Station',
          workLocation: 'Central District Headquarters', contact: 'arjun.sen@demo.icjs.gov.in', assignedIp: '10.20.20.108',
          supervisorId: 'USR-JUD-404', clearanceLevel: 3,
          assignedCases: ['CASE-2026-8891', 'CASE-2026-4412', 'CASE-2026-1102']
        });
        migrated = true;
      }
      for (const employee of db.users) {
        if (['POLICE_INVESTIGATOR', 'FORENSIC_SPECIALIST', 'PUBLIC_PROSECUTOR'].includes(employee.role) && employee.supervisorId !== 'USR-SUP-606') {
          employee.supervisorId = 'USR-SUP-606';
          migrated = true;
        }
      }
      if (!db.users.some(u => u.id === 'USR-POL-102')) {
        const bhirKeyPair = generateRSAKeyPair();
        db.users.push({
          id: 'USR-POL-102',
          name: 'Inspector Bhir Rao',
          employeeId: 'POL-102',
          username: 'POL-102',
          role: 'POLICE_INVESTIGATOR',
          supervisorId: 'USR-JUD-404',
          roleTitle: 'Investigation Officer',
          department: 'LEO',
          departmentName: 'Special Crime Branch - Central Police',
          clearanceLevel: 3,
          publicKey: bhirKeyPair.publicKey,
          privateKey: bhirKeyPair.privateKey,
          policeStation: 'North District Police Station', workLocation: 'North District Investigation Unit', contact: 'bhir.rao@demo.icjs.gov.in', assignedIp: '10.20.20.106',
          assignedCases: ['CASE-2026-4412']
        });
        migrated = true;
      }
      if (!db.users.some(u => u.id === 'USR-POL-103')) {
        const officerKeyPair = generateRSAKeyPair();
        db.users.push({
          id: 'USR-POL-103', employeeId: 'POL-103', name: 'Sub-Inspector Asha Nair', username: 'POL-103',
          role: 'POLICE_INVESTIGATOR', supervisorId: 'USR-JUD-404', roleTitle: 'Sub-Inspector', department: 'LEO',
          departmentName: 'Special Crime Branch - Central Police', policeStation: 'East Gate Police Station',
          workLocation: 'East District Investigation Unit', contact: 'asha.nair@demo.icjs.gov.in', assignedIp: '10.20.20.107', clearanceLevel: 3,
          publicKey: officerKeyPair.publicKey, privateKey: officerKeyPair.privateKey, assignedCases: ['CASE-2026-1102']
        });
        migrated = true;
      }
      const hardcodedProfile = {
        'USR-POL-101': ['POL-101', 'Central Police Station', 'Central District Headquarters', 'vikram.sharma@demo.icjs.gov.in', '10.20.20.101'],
        'USR-POL-102': ['POL-102', 'North District Police Station', 'North District Investigation Unit', 'bhir.rao@demo.icjs.gov.in', '10.20.20.106'],
        'USR-POL-103': ['POL-103', 'East Gate Police Station', 'East District Investigation Unit', 'asha.nair@demo.icjs.gov.in', '10.20.20.107'],
        'USR-FOR-202': ['FOR-202', '', 'State Central Forensic Science Laboratory, Kolkata', 'sunita.rao@demo.icjs.gov.in', '10.20.20.102'],
        'USR-PRO-303': ['PROS-303', '', 'High Court Division, Kolkata', 'rajesh.verma@demo.icjs.gov.in', '10.20.20.103'],
        'USR-JUD-404': ['JUD-404', '', 'Sessions Court, Kolkata', 'court.registry@demo.icjs.gov.in', '10.20.20.104'],
        'USR-AUD-505': ['AUD-505', '', 'National Digital Evidence Oversight Board, New Delhi', 'anil.gupta@demo.icjs.gov.in', '10.20.20.105']
      };
      for (const user of db.users) {
        const profile = hardcodedProfile[user.id];
        if (!profile) continue;
        const [employeeId, policeStation, workLocation, contact, assignedIp] = profile;
        for (const [key, value] of Object.entries({ employeeId, username: employeeId, policeStation, workLocation, contact, assignedIp })) {
          if (user[key] !== value) { user[key] = value; migrated = true; }
        }
        if (user.id === 'USR-POL-101' && JSON.stringify(user.assignedCases) !== JSON.stringify(['CASE-2026-8891'])) { user.assignedCases = ['CASE-2026-8891']; migrated = true; }
        if (user.id === 'USR-POL-102' && JSON.stringify(user.assignedCases) !== JSON.stringify(['CASE-2026-4412'])) { user.assignedCases = ['CASE-2026-4412']; migrated = true; }
        if (user.id === 'USR-POL-103' && JSON.stringify(user.assignedCases) !== JSON.stringify(['CASE-2026-1102'])) { user.assignedCases = ['CASE-2026-1102']; migrated = true; }
      }
      for (const user of db.users) if (!user.supervisorId && !['USR-JUD-404', 'USR-AUD-505', 'USR-IT-001', 'USR-IT-002'].includes(user.id)) { user.supervisorId = 'USR-JUD-404'; migrated = true; }
      for (const doc of db.documents || []) {
        if (!doc.ownerId) { doc.ownerId = doc.authorId; migrated = true; }
        if (!doc.accessPolicy) { doc.accessPolicy = doc.clearanceLevel >= 3 ? 'OWNER_APPROVAL' : 'CASE_POLICY'; migrated = true; }
      }
      if (migrated) this.writeDB(db);
      if (!db.manifests) db.manifests = [];
      if (!db.revocations) db.revocations = [];
      if (!db.transferRequests) db.transferRequests = [];
      if (!db.alerts) {
        db.alerts = [
          {
            id: 'ALT-1092',
            title: 'Unencrypted Export Attempt Blocked',
            severity: 'HIGH',
            category: 'DATA_LEAK_PREVENTION',
            actor: 'officer_42 (Inspector Vikram)',
            docId: 'DOC-8891-002',
            timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
            details: 'Server blocked an unencrypted raw binary payload download request for classified forensic report without break-glass privilege.',
            status: 'OPEN',
            resolvedBy: null,
            resolutionNotes: null,
            resolutionBlockAddress: null
          },
          {
            id: 'ALT-1091',
            title: 'Break-Glass Emergency Protocol Triggered',
            severity: 'HIGH',
            category: 'EMERGENCY_ACCESS',
            actor: 'prosecutor_1 (Senior Advocate Sharma)',
            docId: 'DOC-8891-001',
            timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
            details: '30-minute Emergency Access granted under Justification Code: COURT_ORDER_CRIM_882. Supervisor notified.',
            status: 'OPEN',
            resolvedBy: null,
            resolutionNotes: null,
            resolutionBlockAddress: null
          },
          {
            id: 'ALT-1090',
            title: 'MFA OTP Lockout Triggered',
            severity: 'MEDIUM',
            category: 'AUTHENTICATION',
            actor: 'forensic_8 (Dr. Anita Roy)',
            docId: 'N/A',
            timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
            details: '3 consecutive invalid OTP submissions within 120 seconds. Account temporarily locked for 15 minutes.',
            status: 'RESOLVED',
            resolvedBy: 'Justice P. K. Mukherjee (JUDICIAL_MAGISTRATE)',
            resolutionNotes: 'Verified identity out-of-band via biometric phone verification. Account unlocked.',
            resolvedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
            resolutionBlockAddress: '0x8f2a...99e1'
          }
        ];
        fs.writeFileSync(this.dbPath, JSON.stringify(db, null, 2), 'utf8');
      }
      return db;
    } catch (err) {
      return INITIAL_DB;
    }
  }

  writeDB(data) {
    fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2), 'utf8');
  }

  getUserById(userId) {
    const db = this.readDB();
    return db.users.find(u => u.id === userId);
  }

  getUserByUsername(username) {
    const db = this.readDB();
    return db.users.find(u => String(u.username || '').toLowerCase() === String(username || '').toLowerCase());
  }

  getAllUsers() {
    const db = this.readDB();
    // Exclude private keys from listing endpoints
    return db.users.map(({ privateKey, passwordHash, passwordSalt, ...rest }) => rest);
  }

  getUserWithPrivateKey(userId) {
    const db = this.readDB();
    return db.users.find(u => u.id === userId);
  }

  getCasesForUser(user) {
    const db = this.readDB();
    if (user.systemRole === 'IT_ADMIN') return db.cases;
    return db.cases.filter(c => {
      const clearanceOK = user.clearanceLevel >= c.clearanceRequired;
      const assignedOK = (user.assignedCases || []).includes(c.id);
      return clearanceOK && assignedOK;
    });
  }

  getDocumentsForUser(user, filters = {}) {
    const db = this.readDB();
    let docs = db.documents.filter(d => evaluateDocumentAccess({ user, doc: d, db, permission: 'VIEW' }).allowed);

    if (filters.caseId) {
      docs = docs.filter(d => d.caseId === filters.caseId);
    }
    if (filters.category) {
      docs = docs.filter(d => d.category === filters.category);
    }

    return docs;
  }

  getDocumentById(docId) {
    const db = this.readDB();
    return db.documents.find(d => d.id === docId);
  }

  saveDocumentMetadata(docObj) {
    const db = this.readDB();
    const existingIndex = db.documents.findIndex(d => d.id === docObj.id);
    if (existingIndex >= 0) {
      db.documents[existingIndex] = docObj;
    } else {
      db.documents.push(docObj);
    }
    this.writeDB(db);

    // Asynchronous Supabase Persistence
    if (supabase) {
      supabase.from('documents').upsert({
        id: docObj.id,
        title: docObj.title,
        case_id: docObj.caseId,
        case_title: docObj.caseTitle,
        category: docObj.category,
        clearance_level: docObj.clearanceLevel,
        owner_id: docObj.ownerId || docObj.authorId,
        access_policy: docObj.accessPolicy || 'CASE_POLICY',
        author_id: docObj.authorId,
        author_name: docObj.authorName,
        author_role: docObj.authorRole,
        department: docObj.department,
        date_created: docObj.dateCreated,
        version: docObj.version,
        status: docObj.status,
        extracted_text: docObj.extractedText,
        mime_type: docObj.mimeType,
        original_file_name: docObj.originalFileName,
        payload_hash: docObj.payloadHash,
        file_size: docObj.fileSize,
        encryption_metadata: docObj.encryptionMetadata,
        signature: docObj.signature,
        ai_entities: docObj.aiEntities,
        version_history: docObj.versionHistory,
        chain_of_custody: docObj.chainOfCustody
      }).then(({ error }) => {
        if (error) console.warn('[Supabase Sync Notice]', error.message);
      }).catch(err => console.warn('[Supabase Sync Exception]', err.message));
    }
  }

  getTransferRequests() {
    const db = this.readDB();
    return db.transferRequests;
  }

  createTransferRequest(requestObj) {
    const db = this.readDB();
    db.transferRequests.push(requestObj);
    this.writeDB(db);
    return requestObj;
  }

  // ---- Digital Signature Manifest & Revocation Storage ----

  getManifest(manifestId) {
    const db = this.readDB();
    return (db.manifests || []).find(m => m.manifestId === manifestId) || null;
  }

  getManifestsForDocument(documentId) {
    const db = this.readDB();
    return (db.manifests || []).filter(m => m.documentId === documentId);
  }

  saveManifest(manifestRecord) {
    const db = this.readDB();
    if (!db.manifests) db.manifests = [];
    const idx = db.manifests.findIndex(m => m.manifestId === manifestRecord.manifestId);
    if (idx >= 0) {
      db.manifests[idx] = manifestRecord;
    } else {
      db.manifests.push(manifestRecord);
    }
    this.writeDB(db);
    return manifestRecord;
  }

  getRevocation(signatureId) {
    const db = this.readDB();
    return (db.revocations || []).find(r => r.signatureId === signatureId) || null;
  }

  saveRevocation(revocationObj) {
    const db = this.readDB();
    if (!db.revocations) db.revocations = [];
    const idx = db.revocations.findIndex(r => r.signatureId === revocationObj.signatureId);
    if (idx >= 0) {
      db.revocations[idx] = revocationObj;
    } else {
      db.revocations.push(revocationObj);
    }
    this.writeDB(db);
    return revocationObj;
  }

  // ---- Real-Time Security Incident Alerts Persistence & Resolution ----

  getSecurityAlerts() {
    const db = this.readDB();
    if (!db.alerts || db.alerts.length === 0) {
      db.alerts = [
        {
          id: 'ALT-1092',
          title: 'Unencrypted Export Attempt Blocked',
          severity: 'HIGH',
          category: 'DATA_LEAK_PREVENTION',
          actor: 'officer_42 (Inspector Vikram)',
          docId: 'DOC-8891-002',
          timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
          details: 'Server blocked an unencrypted raw binary payload download request for classified forensic report without break-glass privilege.',
          status: 'OPEN',
          resolvedBy: null,
          resolutionNotes: null,
          resolutionBlockAddress: null
        },
        {
          id: 'ALT-1091',
          title: 'Break-Glass Emergency Protocol Triggered',
          severity: 'HIGH',
          category: 'EMERGENCY_ACCESS',
          actor: 'prosecutor_1 (Senior Advocate Sharma)',
          docId: 'DOC-8891-001',
          timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
          details: '30-minute Emergency Access granted under Justification Code: COURT_ORDER_CRIM_882. Supervisor notified.',
          status: 'OPEN',
          resolvedBy: null,
          resolutionNotes: null,
          resolutionBlockAddress: null
        },
        {
          id: 'ALT-1090',
          title: 'MFA OTP Lockout Triggered',
          severity: 'MEDIUM',
          category: 'AUTHENTICATION',
          actor: 'forensic_8 (Dr. Anita Roy)',
          docId: 'N/A',
          timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          details: '3 consecutive invalid OTP submissions within 120 seconds. Account temporarily locked for 15 minutes.',
          status: 'RESOLVED',
          resolvedBy: 'Justice P. K. Mukherjee (JUDICIAL_MAGISTRATE)',
          resolutionNotes: 'Verified identity out-of-band via biometric phone verification. Account unlocked.',
          resolvedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
          resolutionBlockAddress: '0x8f2a991b7852b855'
        }
      ];
      this.writeDB(db);
    }
    return db.alerts;
  }

  addSecurityAlert(alertData) {
    const db = this.readDB();
    if (!db.alerts) db.alerts = [];
    const newAlert = {
      id: `ALT-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
      status: 'OPEN',
      resolvedBy: null,
      resolutionNotes: null,
      resolutionBlockAddress: null,
      ...alertData
    };
    db.alerts.unshift(newAlert);
    this.writeDB(db);
    return newAlert;
  }

  resolveSecurityAlert(alertId, resolverUser, resolutionNotes = '', blockAddress = '') {
    const db = this.readDB();
    if (!db.alerts) db.alerts = [];
    let alert = db.alerts.find(a => a.id === alertId);
    if (!alert) {
      alert = {
        id: alertId,
        title: 'Security Incident Acknowledged',
        severity: 'HIGH',
        category: 'SECURITY_GOVERNANCE',
        actor: 'System Event',
        docId: 'N/A',
        timestamp: new Date().toISOString(),
        details: 'Security incident acknowledged and resolved by magistrate authority.',
        status: 'OPEN'
      };
      db.alerts.unshift(alert);
    }

    alert.status = 'RESOLVED';
    alert.resolvedBy = `${resolverUser.name} (${resolverUser.roleTitle || resolverUser.role})`;
    alert.resolutionNotes = resolutionNotes || 'Magistrate/Auditor reviewed & resolved incident out-of-band.';
    alert.resolvedAt = new Date().toISOString();
    alert.resolutionBlockAddress = blockAddress;

    this.writeDB(db);
    return alert;
  }
}

export const dbService = new DBService();
