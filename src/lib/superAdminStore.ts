import fs from 'fs';
import path from 'path';

export interface SystemBroadcast {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'danger' | 'success';
  target_agency_id?: string | null; // null = all agencies
  is_active: boolean;
  created_at: string;
}

export interface SystemSettings {
  platform_name: string;
  support_whatsapp: string;
  support_email: string;
  maintenance_mode: boolean;
  maintenance_message: string;
  allow_new_registrations: boolean;
  maintenance_target: 'ALL' | 'AGENCY' | 'CLIENT';
}

const DATA_DIR = path.resolve(process.cwd(), 'src', 'data');
const STATE_FILE = path.join(DATA_DIR, 'super_admin_state.json');

const DEFAULT_SETTINGS: SystemSettings = {
  platform_name: 'Vylogix SaaS CRM',
  support_whatsapp: '6281234567890',
  support_email: 'support@vylogix.com',
  maintenance_mode: false,
  maintenance_message: 'Sistem sedang dalam peningkatan performa rutin. Silakan coba kembali beberapa saat lagi.',
  allow_new_registrations: true,
  maintenance_target: 'ALL',
};

const DEFAULT_BROADCASTS: SystemBroadcast[] = [
  {
    id: 'broadcast-1',
    title: 'Update Vylogix v2.5 Live',
    message: 'Fitur Integrasi Google Sheets Realtime & Manajemen Ekspedisi telah aktif untuk seluruh tenant!',
    type: 'success',
    target_agency_id: null,
    is_active: true,
    created_at: new Date().toISOString()
  }
];

interface StateStructure {
  settings: SystemSettings;
  broadcasts: SystemBroadcast[];
}

function ensureDataFile(): StateStructure {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(STATE_FILE)) {
      const initial: StateStructure = {
        settings: DEFAULT_SETTINGS,
        broadcasts: DEFAULT_BROADCASTS
      };
      fs.writeFileSync(STATE_FILE, JSON.stringify(initial, null, 2), 'utf8');
      return initial;
    }
    const content = fs.readFileSync(STATE_FILE, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    console.error('Error reading super_admin_state.json:', err);
    return {
      settings: DEFAULT_SETTINGS,
      broadcasts: DEFAULT_BROADCASTS
    };
  }
}

function saveState(data: StateStructure) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STATE_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving super_admin_state.json:', err);
  }
}

export function getSystemSettings(): SystemSettings {
  const state = ensureDataFile();
  return state.settings || DEFAULT_SETTINGS;
}

export function saveSystemSettings(updates: Partial<SystemSettings>): SystemSettings {
  const state = ensureDataFile();
  state.settings = { ...state.settings, ...updates };
  saveState(state);
  return state.settings;
}

export function getBroadcasts(agencyId?: string): SystemBroadcast[] {
  const state = ensureDataFile();
  const all = state.broadcasts || [];
  if (!agencyId) return all;
  return all.filter(b => b.is_active && (!b.target_agency_id || b.target_agency_id === agencyId));
}

export function createBroadcast(data: Omit<SystemBroadcast, 'id' | 'created_at'>): SystemBroadcast {
  const state = ensureDataFile();
  const newBroadcast: SystemBroadcast = {
    id: `bc-${Date.now()}`,
    title: data.title,
    message: data.message,
    type: data.type,
    target_agency_id: data.target_agency_id || null,
    is_active: data.is_active ?? true,
    created_at: new Date().toISOString()
  };
  state.broadcasts = [newBroadcast, ...(state.broadcasts || [])];
  saveState(state);
  return newBroadcast;
}

export function toggleBroadcastStatus(id: string, is_active: boolean) {
  const state = ensureDataFile();
  state.broadcasts = (state.broadcasts || []).map(b => b.id === id ? { ...b, is_active } : b);
  saveState(state);
}

export function deleteBroadcast(id: string) {
  const state = ensureDataFile();
  state.broadcasts = (state.broadcasts || []).filter(b => b.id !== id);
  saveState(state);
}
