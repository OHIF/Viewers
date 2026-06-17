const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

function nowIso() {
  return new Date().toISOString();
}

function rowToMeasurement(record) {
  return {
    id: record.id,
    studyInstanceUID: record.study_instance_uid,
    label: record.label,
    value: record.value,
    unit: record.unit,
    toolName: record.tool_name,
    annotationUID: record.annotation_uid,
    toothId: record.tooth_id,
    notes: record.notes,
    metadata: record.metadata_json ? JSON.parse(record.metadata_json) : {},
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

class DentalSQLiteStore {
  constructor({ databasePath }) {
    this.databasePath = databasePath;
    this.db = this.openDatabase();
    this.migrate();
  }

  static async create({ databasePath }) {
    return new DentalSQLiteStore({ databasePath });
  }

  openDatabase() {
    if (!this.databasePath) {
      return new DatabaseSync(':memory:');
    }

    fs.mkdirSync(path.dirname(this.databasePath), { recursive: true });
    return new DatabaseSync(this.databasePath);
  }

  migrate() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS dental_viewer_state (
        user_id TEXT NOT NULL,
        study_instance_uid TEXT NOT NULL,
        state_json TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        PRIMARY KEY (user_id, study_instance_uid)
      );

      CREATE TABLE IF NOT EXISTS dental_measurements (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        study_instance_uid TEXT NOT NULL,
        label TEXT NOT NULL,
        value REAL,
        unit TEXT NOT NULL,
        tool_name TEXT,
        annotation_uid TEXT,
        tooth_id TEXT,
        notes TEXT,
        metadata_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );

      CREATE INDEX IF NOT EXISTS idx_dental_measurements_owner_study
      ON dental_measurements (user_id, study_instance_uid);
    `);
  }

  async getViewerState(userId, studyInstanceUID) {
    const row = this.db
      .prepare(
        'SELECT state_json, updated_at FROM dental_viewer_state WHERE user_id = ? AND study_instance_uid = ?'
      )
      .get(userId, studyInstanceUID);

    if (!row) {
      return null;
    }

    return {
      state: JSON.parse(row.state_json),
      updatedAt: row.updated_at,
    };
  }

  async putViewerState(userId, studyInstanceUID, state) {
    const updatedAt = nowIso();

    this.db
      .prepare(
        `
      INSERT INTO dental_viewer_state (user_id, study_instance_uid, state_json, updated_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(user_id, study_instance_uid)
      DO UPDATE SET state_json = excluded.state_json, updated_at = excluded.updated_at
      `
      )
      .run(userId, studyInstanceUID, JSON.stringify(state), updatedAt);

    return {
      state,
      updatedAt,
    };
  }

  async listMeasurements(userId, studyInstanceUID) {
    const rows = this.db
      .prepare(
        `
      SELECT id, study_instance_uid, label, value, unit, tool_name, annotation_uid, tooth_id,
             notes, metadata_json, created_at, updated_at
      FROM dental_measurements
      WHERE user_id = ? AND study_instance_uid = ?
      ORDER BY created_at ASC
      `
      )
      .all(userId, studyInstanceUID);

    return rows.map(rowToMeasurement);
  }

  async createMeasurement(userId, studyInstanceUID, measurement) {
    const createdAt = nowIso();
    const record = {
      ...measurement,
      metadata: measurement.metadata || {},
      createdAt,
      updatedAt: createdAt,
    };

    this.db
      .prepare(
        `
      INSERT INTO dental_measurements (
        id, user_id, study_instance_uid, label, value, unit, tool_name,
        annotation_uid, tooth_id, notes, metadata_json, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `
      )
      .run(
        record.id,
        userId,
        studyInstanceUID,
        record.label,
        record.value,
        record.unit,
        record.toolName,
        record.annotationUID,
        record.toothId,
        record.notes,
        JSON.stringify(record.metadata),
        record.createdAt,
        record.updatedAt
      );

    return {
      ...record,
      studyInstanceUID,
    };
  }

  async deleteMeasurement(userId, studyInstanceUID, id) {
    const result = this.db
      .prepare('DELETE FROM dental_measurements WHERE user_id = ? AND study_instance_uid = ? AND id = ?')
      .run(userId, studyInstanceUID, id);

    return result.changes > 0;
  }

  close() {
    this.db.close();
  }
}

module.exports = {
  DentalSQLiteStore,
};
