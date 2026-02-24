// ========================================
// 统计数据库模块 - 基于 better-sqlite3
// ========================================

import Database from 'better-sqlite3'
import { app } from 'electron'
import { join } from 'path'
import { BreakType, BreakRecordStatus } from '../types'
import log from 'electron-log'
import dayjs from 'dayjs'

export interface BreakRecord {
  id?: number
  breakType: BreakType
  startedAt: string
  endedAt?: string
  plannedDuration: number
  actualDuration?: number
  status: BreakRecordStatus
  createdDate: string
}

export interface DailyStats {
  date: string
  miniBreaksCompleted: number
  miniBreaksSkipped: number
  longBreaksCompleted: number
  longBreaksSkipped: number
  totalRestSeconds: number
}

export interface WaterRecord {
  id?: number
  amountMl: number
  recordedAt: string
  createdDate: string
  source: 'manual' | 'quick' | 'tray' | 'notification'
}

export interface WaterDailyStats {
  date: string
  totalMl: number
  recordCount: number
}

export interface ExerciseRecord {
  id?: number
  timestamp: string
  exerciseType: 'stand' | 'stretch' | 'mindful'
  exerciseName?: string
  duration: number
  source: 'manual' | 'reminder' | 'break' | 'notification'
  createdDate: string
}

export interface ExerciseDailyStats {
  date: string
  standCount: number
  stretchCount: number
  mindfulCount: number
  totalDuration: number
}

class StatsDatabase {
  private db: Database.Database | null = null

  /** 初始化数据库 */
  init(): void {
    const dbPath = join(app.getPath('userData'), 'stats.db')
    this.db = new Database(dbPath)

    // 启用 WAL 模式提升性能
    this.db.pragma('journal_mode = WAL')

    this.createTables()
    log.info('[StatsDatabase] 初始化完成，数据库路径:', dbPath)
  }

  /** 创建表 */
  private createTables(): void {
    this.db!.exec(`
      CREATE TABLE IF NOT EXISTS break_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        break_type TEXT NOT NULL,
        started_at TEXT NOT NULL,
        ended_at TEXT,
        planned_duration INTEGER NOT NULL,
        actual_duration INTEGER,
        status TEXT NOT NULL,
        created_date TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_break_records_date ON break_records(created_date);

      CREATE TABLE IF NOT EXISTS daily_stats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT UNIQUE NOT NULL,
        mini_breaks_completed INTEGER DEFAULT 0,
        mini_breaks_skipped INTEGER DEFAULT 0,
        long_breaks_completed INTEGER DEFAULT 0,
        long_breaks_skipped INTEGER DEFAULT 0,
        total_rest_seconds INTEGER DEFAULT 0
      );

      CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);

      CREATE TABLE IF NOT EXISTS water_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        amount_ml INTEGER NOT NULL,
        recorded_at TEXT NOT NULL,
        created_date TEXT NOT NULL,
        source TEXT DEFAULT 'manual'
      );

      CREATE INDEX IF NOT EXISTS idx_water_records_date ON water_records(created_date);

      CREATE TABLE IF NOT EXISTS exercise_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        timestamp TEXT NOT NULL,
        exercise_type TEXT NOT NULL,
        exercise_name TEXT,
        duration INTEGER DEFAULT 0,
        source TEXT DEFAULT 'manual',
        created_date TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_exercise_timestamp ON exercise_records(timestamp);
      CREATE INDEX IF NOT EXISTS idx_exercise_date ON exercise_records(created_date);
    `)
  }

  /** 记录一次休息 */
  addBreakRecord(record: BreakRecord): number {
    const stmt = this.db!.prepare(`
      INSERT INTO break_records (break_type, started_at, ended_at, planned_duration, actual_duration, status, created_date)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      record.breakType,
      record.startedAt,
      record.endedAt || null,
      record.plannedDuration,
      record.actualDuration || null,
      record.status,
      record.createdDate
    )

    // 同步更新每日统计
    this.updateDailyStats(record)

    return result.lastInsertRowid as number
  }

  /** 更新每日统计 */
  private updateDailyStats(record: BreakRecord): void {
    const date = record.createdDate
    const isMini = record.breakType === 'mini'
    const isCompleted = record.status === 'completed'
    const isSkipped = record.status === 'skipped'

    // 使用 UPSERT
    this.db!.prepare(`
      INSERT INTO daily_stats (date, mini_breaks_completed, mini_breaks_skipped, long_breaks_completed, long_breaks_skipped, total_rest_seconds)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(date) DO UPDATE SET
        mini_breaks_completed = mini_breaks_completed + ?,
        mini_breaks_skipped = mini_breaks_skipped + ?,
        long_breaks_completed = long_breaks_completed + ?,
        long_breaks_skipped = long_breaks_skipped + ?,
        total_rest_seconds = total_rest_seconds + ?
    `).run(
      date,
      isMini && isCompleted ? 1 : 0,
      isMini && isSkipped ? 1 : 0,
      !isMini && isCompleted ? 1 : 0,
      !isMini && isSkipped ? 1 : 0,
      isCompleted ? (record.actualDuration || 0) : 0,
      // UPDATE 部分的参数
      isMini && isCompleted ? 1 : 0,
      isMini && isSkipped ? 1 : 0,
      !isMini && isCompleted ? 1 : 0,
      !isMini && isSkipped ? 1 : 0,
      isCompleted ? (record.actualDuration || 0) : 0
    )
  }

  /** 获取今日统计 */
  getTodayStats(): DailyStats {
    const today = dayjs().format('YYYY-MM-DD')
    const row = this.db!.prepare(
      'SELECT * FROM daily_stats WHERE date = ?'
    ).get(today) as Record<string, unknown> | undefined

    if (!row) {
      return {
        date: today,
        miniBreaksCompleted: 0,
        miniBreaksSkipped: 0,
        longBreaksCompleted: 0,
        longBreaksSkipped: 0,
        totalRestSeconds: 0
      }
    }

    return {
      date: row.date as string,
      miniBreaksCompleted: row.mini_breaks_completed as number,
      miniBreaksSkipped: row.mini_breaks_skipped as number,
      longBreaksCompleted: row.long_breaks_completed as number,
      longBreaksSkipped: row.long_breaks_skipped as number,
      totalRestSeconds: row.total_rest_seconds as number
    }
  }

  /** 获取日期范围内的统计 */
  getStatsRange(startDate: string, endDate: string): DailyStats[] {
    const rows = this.db!.prepare(
      'SELECT * FROM daily_stats WHERE date >= ? AND date <= ? ORDER BY date ASC'
    ).all(startDate, endDate) as Record<string, unknown>[]

    return rows.map((row) => ({
      date: row.date as string,
      miniBreaksCompleted: row.mini_breaks_completed as number,
      miniBreaksSkipped: row.mini_breaks_skipped as number,
      longBreaksCompleted: row.long_breaks_completed as number,
      longBreaksSkipped: row.long_breaks_skipped as number,
      totalRestSeconds: row.total_rest_seconds as number
    }))
  }

  /** 获取连续坚持天数 (从今天往前数连续有完成记录的天数) */
  getStreak(): number {
    const rows = this.db!.prepare(
      `SELECT date, (mini_breaks_completed + long_breaks_completed) as completed
       FROM daily_stats
       WHERE completed > 0
       ORDER BY date DESC
       LIMIT 90`
    ).all() as { date: string; completed: number }[]

    if (rows.length === 0) return 0

    let streak = 0
    let checkDate = dayjs()

    // 如果今天还没有记录，从昨天开始算
    if (rows.length === 0 || rows[0].date !== checkDate.format('YYYY-MM-DD')) {
      checkDate = checkDate.subtract(1, 'day')
    }

    for (const row of rows) {
      if (row.date === checkDate.format('YYYY-MM-DD')) {
        streak++
        checkDate = checkDate.subtract(1, 'day')
      } else {
        break
      }
    }

    return streak
  }

  // ========================================
  // 喝水记录
  // ========================================

  /** 记录一次喝水 */
  addWaterRecord(amountMl: number, source: WaterRecord['source'] = 'manual'): number {
    const now = dayjs()
    const stmt = this.db!.prepare(`
      INSERT INTO water_records (amount_ml, recorded_at, created_date, source)
      VALUES (?, ?, ?, ?)
    `)
    const result = stmt.run(amountMl, now.toISOString(), now.format('YYYY-MM-DD'), source)
    log.info(`[StatsDatabase] 记录喝水: ${amountMl}ml (${source})`)
    return result.lastInsertRowid as number
  }

  /** 获取今日喝水统计 */
  getWaterToday(): WaterDailyStats {
    const today = dayjs().format('YYYY-MM-DD')
    const row = this.db!.prepare(
      'SELECT SUM(amount_ml) as total_ml, COUNT(*) as record_count FROM water_records WHERE created_date = ?'
    ).get(today) as { total_ml: number | null; record_count: number } | undefined

    return {
      date: today,
      totalMl: row?.total_ml || 0,
      recordCount: row?.record_count || 0
    }
  }

  /** 获取日期范围内的每日喝水统计 */
  getWaterRange(startDate: string, endDate: string): WaterDailyStats[] {
    const rows = this.db!.prepare(
      `SELECT created_date as date, SUM(amount_ml) as total_ml, COUNT(*) as record_count
       FROM water_records
       WHERE created_date >= ? AND created_date <= ?
       GROUP BY created_date
       ORDER BY created_date ASC`
    ).all(startDate, endDate) as { date: string; total_ml: number; record_count: number }[]

    return rows.map((row) => ({
      date: row.date,
      totalMl: row.total_ml,
      recordCount: row.record_count
    }))
  }

  /** 获取连续喝水达标天数 */
  getWaterStreak(dailyGoal: number): number {
    const rows = this.db!.prepare(
      `SELECT created_date as date, SUM(amount_ml) as total_ml
       FROM water_records
       GROUP BY created_date
       HAVING total_ml >= ?
       ORDER BY created_date DESC
       LIMIT 90`
    ).all(dailyGoal) as { date: string; total_ml: number }[]

    if (rows.length === 0) return 0

    let streak = 0
    let checkDate = dayjs()

    if (rows[0].date !== checkDate.format('YYYY-MM-DD')) {
      checkDate = checkDate.subtract(1, 'day')
    }

    for (const row of rows) {
      if (row.date === checkDate.format('YYYY-MM-DD')) {
        streak++
        checkDate = checkDate.subtract(1, 'day')
      } else {
        break
      }
    }

    return streak
  }

  // ========================================
  // 运动记录
  // ========================================

  /** 记录一次运动 */
  addExerciseRecord(record: ExerciseRecord): number {
    const stmt = this.db!.prepare(`
      INSERT INTO exercise_records (timestamp, exercise_type, exercise_name, duration, source, created_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `)
    const result = stmt.run(
      record.timestamp,
      record.exerciseType,
      record.exerciseName || null,
      record.duration,
      record.source,
      record.createdDate
    )
    log.info(`[StatsDatabase] 记录运动: ${record.exerciseType} (${record.source})`)
    return result.lastInsertRowid as number
  }

  /** 获取今日运动统计 */
  getExerciseToday(): ExerciseDailyStats {
    const today = dayjs().format('YYYY-MM-DD')
    const row = this.db!.prepare(
      `SELECT
        COUNT(CASE WHEN exercise_type = 'stand' THEN 1 END) as stand_count,
        COUNT(CASE WHEN exercise_type = 'stretch' THEN 1 END) as stretch_count,
        COUNT(CASE WHEN exercise_type = 'mindful' THEN 1 END) as mindful_count,
        SUM(duration) as total_duration
       FROM exercise_records
       WHERE created_date = ?`
    ).get(today) as { stand_count: number; stretch_count: number; mindful_count: number; total_duration: number | null } | undefined

    return {
      date: today,
      standCount: row?.stand_count || 0,
      stretchCount: row?.stretch_count || 0,
      mindfulCount: row?.mindful_count || 0,
      totalDuration: row?.total_duration || 0
    }
  }

  /** 获取日期范围内的每日运动统计 */
  getExerciseRange(startDate: string, endDate: string): ExerciseDailyStats[] {
    const rows = this.db!.prepare(
      `SELECT 
        created_date as date,
        COUNT(CASE WHEN exercise_type = 'stand' THEN 1 END) as stand_count,
        COUNT(CASE WHEN exercise_type = 'stretch' THEN 1 END) as stretch_count,
        COUNT(CASE WHEN exercise_type = 'mindful' THEN 1 END) as mindful_count,
        SUM(duration) as total_duration
       FROM exercise_records
       WHERE created_date >= ? AND created_date <= ?
       GROUP BY created_date
       ORDER BY created_date ASC`
    ).all(startDate, endDate) as { date: string; stand_count: number; stretch_count: number; mindful_count: number; total_duration: number | null }[]

    return rows.map((row) => ({
      date: row.date,
      standCount: row.stand_count,
      stretchCount: row.stretch_count,
      mindfulCount: row.mindful_count,
      totalDuration: row.total_duration || 0
    }))
  }

  /** 获取连续运动打卡天数（至少完成一次站立或拉伸） */
  getExerciseStreak(): number {
    const rows = this.db!.prepare(
      `SELECT created_date as date,
        COUNT(*) as count
       FROM exercise_records
       GROUP BY created_date
       HAVING count > 0
       ORDER BY created_date DESC
       LIMIT 90`
    ).all() as { date: string; count: number }[]

    if (rows.length === 0) return 0

    let streak = 0
    let checkDate = dayjs()

    if (rows[0].date !== checkDate.format('YYYY-MM-DD')) {
      checkDate = checkDate.subtract(1, 'day')
    }

    for (const row of rows) {
      if (row.date === checkDate.format('YYYY-MM-DD')) {
        streak++
        checkDate = checkDate.subtract(1, 'day')
      } else {
        break
      }
    }

    return streak
  }

  /** 关闭数据库 */
  close(): void {
    if (this.db) {
      this.db.close()
      log.info('[StatsDatabase] 数据库已关闭')
    }
  }
}

export const statsDatabase = new StatsDatabase()
