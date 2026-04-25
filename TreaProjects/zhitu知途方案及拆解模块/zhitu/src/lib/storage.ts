import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type {
  AssessmentResult,
  JDAnalysisResult,
  MatchResult,
  ResumeAnalysisResult,
  JourneyProgress,
} from '@/types';

interface ZhiTuDB extends DBSchema {
  assessmentResults: {
    key: string;
    value: {
      id: string;
      userId: string;
      data: AssessmentResult;
      createdAt: string;
    };
    indexes: { 'by-user': string };
  };
  jdAnalyses: {
    key: string;
    value: {
      id: string;
      userId: string;
      jdHash: string;
      data: JDAnalysisResult;
      createdAt: string;
    };
    indexes: { 'by-user': string; 'by-hash': string };
  };
  matchReports: {
    key: string;
    value: {
      id: string;
      userId: string;
      data: MatchResult;
      createdAt: string;
    };
    indexes: { 'by-user': string };
  };
  resumeAnalyses: {
    key: string;
    value: {
      id: string;
      userId: string;
      data: ResumeAnalysisResult;
      createdAt: string;
    };
    indexes: { 'by-user': string };
  };
}

const DB_NAME = 'zhitu-db';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<ZhiTuDB>> | null = null;

function getDB(): Promise<IDBPDatabase<ZhiTuDB>> {
  if (!dbPromise) {
    dbPromise = openDB<ZhiTuDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Assessment results
        const assessmentStore = db.createObjectStore('assessmentResults', { keyPath: 'id' });
        assessmentStore.createIndex('by-user', 'userId');

        // JD analyses
        const jdStore = db.createObjectStore('jdAnalyses', { keyPath: 'id' });
        jdStore.createIndex('by-user', 'userId');
        jdStore.createIndex('by-hash', 'jdHash');

        // Match reports
        const matchStore = db.createObjectStore('matchReports', { keyPath: 'id' });
        matchStore.createIndex('by-user', 'userId');

        // Resume analyses
        const resumeStore = db.createObjectStore('resumeAnalyses', { keyPath: 'id' });
        resumeStore.createIndex('by-user', 'userId');
      },
    });
  }
  return dbPromise;
}

function genId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── Assessment ──

export async function saveAssessmentResult(userId: string, data: AssessmentResult): Promise<string> {
  const db = await getDB();
  const id = genId();
  await db.put('assessmentResults', { id, userId, data, createdAt: new Date().toISOString() });
  return id;
}

export async function getAssessmentResults(userId: string): Promise<AssessmentResult[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('assessmentResults', 'by-user', userId);
  return all.map((item) => item.data);
}

export async function getAssessmentResultRecords(
  userId: string
): Promise<Array<{ id: string; data: AssessmentResult; createdAt: string }>> {
  const db = await getDB();
  const all = await db.getAllFromIndex('assessmentResults', 'by-user', userId);
  return all.map((item) => ({ id: item.id, data: item.data, createdAt: item.createdAt }));
}

// ── JD Analysis ──

export async function saveJDAnalysis(
  userId: string,
  jdHash: string,
  data: JDAnalysisResult
): Promise<string> {
  const db = await getDB();
  // Dedup by hash
  const existing = await db.getAllFromIndex('jdAnalyses', 'by-hash', jdHash);
  if (existing.length > 0) return existing[0].id;

  const id = genId();
  await db.put('jdAnalyses', {
    id,
    userId,
    jdHash,
    data,
    createdAt: new Date().toISOString(),
  });
  return id;
}

export async function getJDAnalyses(userId: string): Promise<JDAnalysisResult[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('jdAnalyses', 'by-user', userId);
  return all.map((item) => item.data);
}

export async function getJDAnalysisRecords(
  userId: string
): Promise<Array<{ id: string; data: JDAnalysisResult; createdAt: string }>> {
  const db = await getDB();
  const all = await db.getAllFromIndex('jdAnalyses', 'by-user', userId);
  return all.map((item) => ({ id: item.id, data: item.data, createdAt: item.createdAt }));
}

export async function getJDAnalysisByHash(jdHash: string): Promise<JDAnalysisResult | null> {
  const db = await getDB();
  const results = await db.getAllFromIndex('jdAnalyses', 'by-hash', jdHash);
  return results.length > 0 ? results[0].data : null;
}

// ── Match Report ──

export async function saveMatchReport(userId: string, data: MatchResult): Promise<string> {
  const db = await getDB();
  const id = genId();
  await db.put('matchReports', { id, userId, data, createdAt: new Date().toISOString() });
  return id;
}

export async function getMatchReports(userId: string): Promise<MatchResult[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('matchReports', 'by-user', userId);
  return all.map((item) => item.data);
}

export async function getMatchReportRecords(
  userId: string
): Promise<Array<{ id: string; data: MatchResult; createdAt: string }>> {
  const db = await getDB();
  const all = await db.getAllFromIndex('matchReports', 'by-user', userId);
  return all.map((item) => ({ id: item.id, data: item.data, createdAt: item.createdAt }));
}

// ── Resume Analysis ──

export async function saveResumeAnalysis(
  userId: string,
  data: ResumeAnalysisResult
): Promise<string> {
  const db = await getDB();
  const id = genId();
  await db.put('resumeAnalyses', { id, userId, data, createdAt: new Date().toISOString() });
  return id;
}

export async function getResumeAnalyses(userId: string): Promise<ResumeAnalysisResult[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('resumeAnalyses', 'by-user', userId);
  return all.map((item) => item.data);
}

export async function getResumeAnalysisRecords(
  userId: string
): Promise<Array<{ id: string; data: ResumeAnalysisResult; createdAt: string }>> {
  const db = await getDB();
  const all = await db.getAllFromIndex('resumeAnalyses', 'by-user', userId);
  return all.map((item) => ({ id: item.id, data: item.data, createdAt: item.createdAt }));
}

// ── User Profile (localStorage) ──

const PROFILE_KEY = 'zhitu-user-profile';
const JOURNEY_KEY = 'zhitu-journey-progress';

export function getUserProfile(): Record<string, unknown> | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(PROFILE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveUserProfile(profile: Record<string, unknown>): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

// ── Journey Progress (localStorage) ──

export function getJourneyProgress(): JourneyProgress | null {
  if (typeof window === 'undefined') return null;
  const raw = localStorage.getItem(JOURNEY_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function saveJourneyProgress(progress: JourneyProgress): void {
  localStorage.setItem(JOURNEY_KEY, JSON.stringify(progress));
}
