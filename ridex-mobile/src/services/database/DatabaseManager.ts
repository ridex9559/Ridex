import { Platform } from 'react-native';
import { logger } from '@/utils/logger';
import { DatabaseMigrationRunner } from './DatabaseMigration';

export interface IDatabaseConnection {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, params?: any[]): Promise<{ lastInsertRowId: number; changes: number }>;
  getAllAsync<T = any>(source: string, params?: any[]): Promise<T[]>;
  getFirstAsync<T = any>(source: string, params?: any[]): Promise<T | null>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
  closeAsync(): Promise<void>;
}

/**
 * In-Memory fallback implementation for web browsers or testing environments
 * where native SQLite binary is unavailable.
 */
class WebDatabaseFallback implements IDatabaseConnection {
  private tables: Map<string, any[]> = new Map();
  private isInitialized = false;

  async init() {
    this.isInitialized = true;
  }

  async execAsync(source: string): Promise<void> {
    // Parse CREATE TABLE statements to initialize table maps
    const tableMatches = source.matchAll(/CREATE TABLE IF NOT EXISTS ([a-zA-Z0-9_]+)/gi);
    for (const match of tableMatches) {
      const tableName = match[1];
      if (!this.tables.has(tableName)) {
        this.tables.set(tableName, []);
      }
    }
  }

  async runAsync(source: string, params: any[] = []): Promise<{ lastInsertRowId: number; changes: number }> {
    const trimmed = source.trim();
    if (/^INSERT INTO ([a-zA-Z0-9_]+)/i.test(trimmed)) {
      const match = trimmed.match(/^INSERT INTO ([a-zA-Z0-9_]+)/i);
      const tableName = match ? match[1] : '';
      let table = this.tables.get(tableName);
      if (!table) {
        table = [];
        this.tables.set(tableName, table);
      }

      // Handle insert or replace
      if (/ON CONFLICT/i.test(trimmed) && tableName === 'app_metadata') {
        const key = params[0];
        const val = params[1];
        const existingIdx = table.findIndex((r) => r.key === key);
        if (existingIdx >= 0) {
          table[existingIdx] = { key, value: val, updated_at: new Date().toISOString() };
          return { lastInsertRowId: existingIdx, changes: 1 };
        }
      }

      // Generic row construct based on insert pattern
      const colsMatch = trimmed.match(/\(([^)]+)\)\s*VALUES/i);
      if (colsMatch) {
        const cols = colsMatch[1].split(',').map((c) => c.trim());
        const row: Record<string, any> = {};
        cols.forEach((col, idx) => {
          row[col] = params[idx] !== undefined ? params[idx] : null;
        });

        const idCol = cols.includes('id') ? 'id' : cols.includes('key') ? 'key' : cols.includes('entity_type') ? 'entity_type' : null;
        if (idCol && row[idCol]) {
          const existingIdx = table.findIndex((r) => r[idCol] === row[idCol]);
          if (existingIdx >= 0) {
            table[existingIdx] = { ...table[existingIdx], ...row };
            return { lastInsertRowId: existingIdx, changes: 1 };
          }
        }

        table.push(row);
        return { lastInsertRowId: table.length, changes: 1 };
      }

      table.push(params);
      return { lastInsertRowId: table.length, changes: 1 };
    }

    if (/^UPDATE ([a-zA-Z0-9_]+)/i.test(trimmed)) {
      const match = trimmed.match(/^UPDATE ([a-zA-Z0-9_]+)/i);
      const tableName = match ? match[1] : '';
      const table = this.tables.get(tableName) || [];
      const lastParam = params[params.length - 1];
      const target = table.find((r) => r.id === lastParam || r.key === lastParam || r.entity_type === lastParam);
      if (target) {
        return { lastInsertRowId: 0, changes: 1 };
      }
      return { lastInsertRowId: 0, changes: 0 };
    }

    if (/^DELETE FROM ([a-zA-Z0-9_]+)/i.test(trimmed)) {
      const match = trimmed.match(/^DELETE FROM ([a-zA-Z0-9_]+)/i);
      const tableName = match ? match[1] : '';
      let table = this.tables.get(tableName) || [];
      if (params.length > 0) {
        const id = params[0];
        const initialLen = table.length;
        table = table.filter((r) => r.id !== id && r.key !== id);
        this.tables.set(tableName, table);
        return { lastInsertRowId: 0, changes: initialLen - table.length };
      }
      this.tables.set(tableName, []);
      return { lastInsertRowId: 0, changes: table.length };
    }

    return { lastInsertRowId: 0, changes: 0 };
  }

  async getAllAsync<T = any>(source: string, params: any[] = []): Promise<T[]> {
    const trimmed = source.trim();
    const match = trimmed.match(/FROM ([a-zA-Z0-9_]+)/i);
    if (!match) return [];
    const tableName = match[1];
    const table = this.tables.get(tableName) || [];

    if (/WHERE user_id = \?/i.test(trimmed) && params.length > 0) {
      const userId = params[0];
      return table.filter((r) => r.user_id === userId) as T[];
    }
    if (/WHERE ride_id = \?/i.test(trimmed) && params.length > 0) {
      const rideId = params[0];
      return table.filter((r) => r.ride_id === rideId) as T[];
    }
    if (/WHERE status = \?/i.test(trimmed) && params.length > 0) {
      const status = params[0];
      return table.filter((r) => r.status === status) as T[];
    }

    return [...table] as T[];
  }

  async getFirstAsync<T = any>(source: string, params: any[] = []): Promise<T | null> {
    const rows = await this.getAllAsync<T>(source, params);
    if (/WHERE key = \?/i.test(source) && params.length > 0) {
      const table = this.tables.get('app_metadata') || [];
      const item = table.find((r) => r.key === params[0]);
      return (item as T) || null;
    }
    if (/WHERE id = \?/i.test(source) && params.length > 0) {
      const match = source.match(/FROM ([a-zA-Z0-9_]+)/i);
      const tableName = match ? match[1] : '';
      const table = this.tables.get(tableName) || [];
      const item = table.find((r) => r.id === params[0]);
      return (item as T) || null;
    }
    return rows.length > 0 ? rows[0] : null;
  }

  async withTransactionAsync(task: () => Promise<void>): Promise<void> {
    await task();
  }

  async closeAsync(): Promise<void> {
    this.tables.clear();
  }
}

/**
 * Centralized Database Manager for RIDEX
 * Manages the single SQLite connection instance and migration lifecycle.
 */
export class DatabaseManager {
  private static instance: DatabaseManager | null = null;
  private db: IDatabaseConnection | null = null;
  private isInitializing = false;
  private initPromise: Promise<IDatabaseConnection> | null = null;

  private constructor() {}

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public async getDatabase(): Promise<IDatabaseConnection> {
    if (this.db) {
      return this.db;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this.initializeDatabase();
    return this.initPromise;
  }

  private async initializeDatabase(): Promise<IDatabaseConnection> {
    this.isInitializing = true;
    try {
      logger.info('[DATABASE] Initializing RIDEX local SQLite database (ridex.db)...');

      if (Platform.OS === 'web') {
        logger.info('[DATABASE] Running in Web environment. Using Web Database Engine.');
        const webDb = new WebDatabaseFallback();
        await webDb.init();
        await DatabaseMigrationRunner.runMigrations(webDb);
        this.db = webDb;
        logger.info('[DATABASE] Web Database initialized and migrated successfully.');
        return webDb;
      }

      // Native iOS / Android expo-sqlite
      const SQLite = require('expo-sqlite');
      const nativeDb = await SQLite.openDatabaseAsync('ridex.db');

      await nativeDb.execAsync(`
        PRAGMA journal_mode = WAL;
        PRAGMA foreign_keys = ON;
      `);

      const connection: IDatabaseConnection = {
        execAsync: (sql: string) => nativeDb.execAsync(sql),
        runAsync: (sql: string, params: any[] = []) => nativeDb.runAsync(sql, ...params),
        getAllAsync: (sql: string, params: any[] = []) => nativeDb.getAllAsync(sql, ...params),
        getFirstAsync: (sql: string, params: any[] = []) => nativeDb.getFirstAsync(sql, ...params),
        withTransactionAsync: (task: () => Promise<void>) => nativeDb.withTransactionAsync(task),
        closeAsync: () => nativeDb.closeAsync(),
      };

      await DatabaseMigrationRunner.runMigrations(connection);
      this.db = connection;
      logger.info('[DATABASE] Native SQLite database (ridex.db) initialized and ready.');
      return connection;
    } catch (error) {
      logger.error('[DATABASE] Fatal error during database initialization:', error);
      throw error;
    } finally {
      this.isInitializing = false;
      this.initPromise = null;
    }
  }

  public async resetDatabaseForTest(): Promise<void> {
    if (this.db) {
      await this.db.execAsync(`
        DROP TABLE IF EXISTS ride_locations;
        DROP TABLE IF EXISTS rides;
        DROP TABLE IF EXISTS motorcycles;
        DROP TABLE IF EXISTS profiles;
        DROP TABLE IF EXISTS sync_queue;
        DROP TABLE IF EXISTS sync_metadata;
        DROP TABLE IF EXISTS app_metadata;
      `);
      await DatabaseMigrationRunner.runMigrations(this.db);
    }
  }
}

export const databaseManager = DatabaseManager.getInstance();
