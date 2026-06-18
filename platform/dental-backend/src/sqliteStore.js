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
    presetId: record.preset_id,
    label: record.label,
    value: record.value,
    unit: record.unit,
    toolName: record.tool_name,
    annotationUID: record.annotation_uid,
    toothId: record.tooth_id,
    note: record.notes,
    viewportId: record.viewport_id,
    displaySetInstanceUID: record.display_set_instance_uid,
    referenceSeriesUID: record.reference_series_uid,
    points: record.geometry_json ? JSON.parse(record.geometry_json) : undefined,
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

    this.ensureMeasurementColumn('preset_id', 'TEXT');
    this.ensureMeasurementColumn('viewport_id', 'TEXT');
    this.ensureMeasurementColumn('display_set_instance_uid', 'TEXT');
    this.ensureMeasurementColumn('reference_series_uid', 'TEXT');
    this.ensureMeasurementColumn('geometry_json', 'TEXT');
  }

  ensureMeasurementColumn(name, type) {
    const columns = this.db.prepare('PRAGMA table_info(dental_measurements)').all();
    if (!columns.some(column => column.name === name)) {
      this.db.exec(`ALTER TABLE dental_measurements ADD COLUMN ${name} ${type}`);
    }
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
      SELECT id, study_instance_uid, preset_id, label, value, unit, tool_name, annotation_uid,
             tooth_id, notes, viewport_id, display_set_instance_uid, reference_series_uid,
             geometry_json, metadata_json, created_at, updated_at
      FROM dental_measurements
      WHERE user_id = ? AND study_instance_uid = ?
      ORDER BY created_at DESC
      `
      )
      .all(userId, studyInstanceUID);

    return rows.map(rowToMeasurement);
  }

  async createMeasurement(userId, studyInstanceUID, measurement) {
    const existing = measurement.annotationUID
      ? this.db
          .prepare(
            `SELECT id FROM dental_measurements
             WHERE user_id = ? AND study_instance_uid = ? AND annotation_uid = ?`
          )
          .get(userId, studyInstanceUID, measurement.annotationUID)
      : null;
    const createdAt = measurement.createdAt || nowIso();
    const updatedAt = nowIso();
    const record = {
      ...measurement,
      id: existing?.id || measurement.id,
      metadata: measurement.metadata || {},
      createdAt,
      updatedAt,
    };

    this.db
      .prepare(
        `
      INSERT INTO dental_measurements (
        id, user_id, study_instance_uid, preset_id, label, value, unit, tool_name,
        annotation_uid, tooth_id, notes, viewport_id, display_set_instance_uid,
        reference_series_uid, geometry_json, metadata_json, created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        preset_id = excluded.preset_id,
        label = excluded.label,
        value = excluded.value,
        unit = excluded.unit,
        tool_name = excluded.tool_name,
        annotation_uid = excluded.annotation_uid,
        tooth_id = excluded.tooth_id,
        notes = excluded.notes,
        viewport_id = excluded.viewport_id,
        display_set_instance_uid = excluded.display_set_instance_uid,
        reference_series_uid = excluded.reference_series_uid,
        geometry_json = excluded.geometry_json,
        metadata_json = excluded.metadata_json,
        updated_at = excluded.updated_at
      `
      )
      .run(
        record.id,
        userId,
        studyInstanceUID,
        record.presetId,
        record.label,
        record.value,
        record.unit,
        record.toolName,
        record.annotationUID,
        record.toothId,
        record.note,
        record.viewportId,
        record.displaySetInstanceUID,
        record.referenceSeriesUID,
        record.points ? JSON.stringify(record.points) : null,
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
      .prepare(
        `DELETE FROM dental_measurements
         WHERE user_id = ? AND study_instance_uid = ? AND (id = ? OR annotation_uid = ?)`
      )
      .run(userId, studyInstanceUID, id, id);

    return result.changes > 0;
  }

  close() {
    this.db.close();
  }
}

module.exports = {
  DentalSQLiteStore,
};
