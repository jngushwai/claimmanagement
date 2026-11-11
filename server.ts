import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { createServer as createViteServer } from 'vite';

import * as AuthController from './src/server/controllers/auth.controller';
import * as LecturerController from './src/server/controllers/lecturer.controller';
import * as TimetableController from './src/server/controllers/timetable.controller';
import * as SessionController from './src/server/controllers/session.controller';
import * as ClaimController from './src/server/controllers/claim.controller';
import * as AdminController from './src/server/controllers/admin.controller';

import { authenticateToken, requireSuperAdmin } from './src/server/middleware/auth.middleware';

const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  },
});
const upload = multer({ storage });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  app.use('/uploads', express.static(uploadsDir));

  // --- Auth Routes ---
  app.post('/api/auth/register', AuthController.register);
  app.post('/api/auth/login', AuthController.login);
  app.post('/api/auth/google', AuthController.googleLogin);
  app.get('/api/auth/me', authenticateToken, AuthController.getCurrentUser);
  app.put('/api/auth/password', authenticateToken, AuthController.updatePassword);

  // --- Lecturer Workspace Routes ---
  app.get('/api/lecturer/dashboard', authenticateToken, LecturerController.getDashboardStats);
  app.get('/api/lecturer/profile', authenticateToken, LecturerController.getProfile);
  app.put('/api/lecturer/profile', authenticateToken, LecturerController.updateProfile);

  app.get('/api/lecturer/modules', authenticateToken, LecturerController.getModules);
  app.post('/api/lecturer/modules', authenticateToken, LecturerController.createModule);
  app.put('/api/lecturer/modules/:id', authenticateToken, LecturerController.updateModule);
  app.delete('/api/lecturer/modules/:id', authenticateToken, LecturerController.deleteModule);

  app.get('/api/lecturer/classes', authenticateToken, LecturerController.getClasses);
  app.post('/api/lecturer/classes', authenticateToken, LecturerController.createClass);
  app.put('/api/lecturer/classes/:id', authenticateToken, LecturerController.updateClass);
  app.delete('/api/lecturer/classes/:id', authenticateToken, LecturerController.deleteClass);

  // --- Timetable & Session Routes ---
  app.get('/api/timetable', authenticateToken, TimetableController.getTimetable);
  app.post('/api/timetable', authenticateToken, TimetableController.createTimetableEntry);
  app.delete('/api/timetable/:id', authenticateToken, TimetableController.deleteTimetableEntry);
  app.get('/api/timetable/template', authenticateToken, TimetableController.downloadTimetableTemplate);
  app.post('/api/timetable/import', authenticateToken, upload.single('file'), TimetableController.importTimetable);
  app.post('/api/timetable/populate', authenticateToken, TimetableController.populateMonthlySessions);

  app.get('/api/sessions', authenticateToken, SessionController.getSessions);
  app.post('/api/sessions', authenticateToken, SessionController.createSession);
  app.put('/api/sessions/:id', authenticateToken, SessionController.updateSession);
  app.delete('/api/sessions/:id', authenticateToken, SessionController.deleteSession);

  // --- Claims & Documents Routes ---
  app.get('/api/claims', authenticateToken, ClaimController.getClaims);
  app.post('/api/claims/generate', authenticateToken, ClaimController.generateMonthlyClaim);
  app.get('/api/claims/excel', authenticateToken, ClaimController.downloadClaimExcel);
  app.post('/api/documents', authenticateToken, upload.single('file'), ClaimController.uploadDocument);

  // --- Super Admin Panel Routes ---
  app.get('/api/admin/dashboard', authenticateToken, requireSuperAdmin, AdminController.getAdminDashboard);
  app.get('/api/admin/users', authenticateToken, requireSuperAdmin, AdminController.getUsers);
  app.post('/api/admin/users', authenticateToken, requireSuperAdmin, AdminController.createUser);
  app.put('/api/admin/users/:id', authenticateToken, requireSuperAdmin, AdminController.updateUser);
  app.delete('/api/admin/users/:id', authenticateToken, requireSuperAdmin, AdminController.deleteUser);
  app.get('/api/admin/claims', authenticateToken, requireSuperAdmin, AdminController.getAdminClaims);
  app.put('/api/admin/claims/:id/status', authenticateToken, requireSuperAdmin, AdminController.updateClaimStatus);
  app.get('/api/admin/claims/excel', authenticateToken, requireSuperAdmin, AdminController.downloadAdminSummaryExcel);

  // Vite development middleware
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`DIT Campus Hub server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
