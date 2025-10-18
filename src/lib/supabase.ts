// Simple in-browser DB replacement for Supabase used during development.
// Stores all data under localStorage key `clinic_db`. Provides a minimal
// `supabase.from(table)` chainable API used by the app and exports the
// same TypeScript types as before so components keep working unchanged.

export type Patient = {
  id: string;
  full_name: string;
  age: number | null;
  medical_record: string;
  admission_day: string | null;
  attention_point: string | null;
  admission_date: string;
  status: string;
  created_at: string;
  updated_at: string;
};

export type WoundCategory = {
  id: string;
  name: string;
  parent_id: string | null;
  order_index: number;
  created_at: string;
};

export type WoundRecord = {
  id: string;
  patient_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  is_planned: boolean;
  status: string;
  created_at: string;
  updated_at: string;
};

export type WoundImage = {
  id: string;
  wound_record_id: string;
  image_url: string;
  thumbnail_url: string | null;
  annotations: Annotation[];
  transformations: Transformations;
  order_index: number;
  created_at: string;
};

export type Annotation = {
  id: string;
  type: 'text' | 'shape' | 'draw';
  content: string;
  x: number;
  y: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textDecoration?: string;
  color?: string;
  rotation?: number;
};

export type Transformations = {
  rotation?: number;
  flipH?: boolean;
  flipV?: boolean;
  scale?: number;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

// Database shape stored in localStorage
type DBSchema = {
  patients: Patient[];
  wound_categories: WoundCategory[];
  wound_records: WoundRecord[];
  wound_images: WoundImage[];
};

const STORAGE_KEY = 'clinic_db_v1';

function loadDB(): DBSchema {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyDB();
    return JSON.parse(raw) as DBSchema;
  } catch (e) {
    console.error('Failed to parse local DB, resetting.', e);
    return emptyDB();
  }
}

function saveDB(db: DBSchema) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
}

function emptyDB(): DBSchema {
  return {
    patients: [],
    wound_categories: [],
    wound_records: [],
    wound_images: []
  };
}

function nowISO() {
  return new Date().toISOString();
}

function ensureSeed() {
  const db = loadDB();
  let changed = false;

  if (!db.patients || db.patients.length === 0) {
    const patients: Patient[] = Array.from({ length: 10 }).map((_, i) => {
      const id = crypto.randomUUID();
      const created_at = nowISO();
      return {
        id,
        full_name: `Paciente ${i + 1}`,
        age: Math.floor(Math.random() * 80) + 20,
        medical_record: `HC-${1000 + i}`,
        admission_day: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'][i % 5],
        attention_point: `Punto ${((i % 3) + 1)}`,
        admission_date: created_at,
        status: 'activo',
        created_at,
        updated_at: created_at
      };
    });
    db.patients = patients;
    changed = true;
  }

  if (!db.wound_categories || db.wound_categories.length === 0) {
    const created_at = nowISO();
    db.wound_categories = [
      { id: crypto.randomUUID(), name: 'Curas', parent_id: null, order_index: 0, created_at },
      { id: crypto.randomUUID(), name: 'Heridas Quirúrgicas', parent_id: null, order_index: 1, created_at }
    ];
    changed = true;
  }

  if (changed) saveDB(db);
}

ensureSeed();

// Minimal query builder that mirrors the small subset of Supabase API used in the app.
function from(table: keyof DBSchema) {
  const state: any = {
    table,
    selectCols: '*',
    filters: [] as Array<{ type: 'eq'; field: string; value: any }>,
    notFilters: [] as Array<{ field: string; op: string; value: any }>,
    order: null as null | { column: string; opts?: any },
    updateData: null as any,
    singleFlag: false
  };

  const executor: any = {
    select(cols = '*') {
      state.selectCols = cols;
      return executor;
    },
    order(column: string, opts?: any) {
      state.order = { column, opts };
      return executor;
    },
    eq(field: string, value: any) {
      state.filters.push({ type: 'eq', field, value });
      return executor;
    },
    not(field: string, op: string, value: any) {
      state.notFilters.push({ field, op, value });
      return executor;
    },
    insert(data: any) {
      // perform insert immediately and return a thenable/selectable object
      const db = loadDB();
      const tableArr = (db as any)[table];
      const rows = Array.isArray(data) ? data : [data];
  const created: any[] = rows.map((r: any) => {
        const id = r.id || crypto.randomUUID();
        const created_at = r.created_at || nowISO();
        const base = { id, created_at, updated_at: nowISO() };
        return { ...base, ...r };
      });
      tableArr.push(...created);
      saveDB(db);

      const result = {
        data: created,
        error: null
      };

      const wrapper: any = {
        select(_cols?: any) {
          return {
            single: async () => ({ data: created.length === 1 ? created[0] : created, error: null })
          };
        },
        then: async (resolve: any) => resolve(result),
  catch: async (_cb: any) => result
      };

      return wrapper;
    },
    update(data: any) {
      state.updateData = data;
      return executor;
    },
    single() {
      state.singleFlag = true;
      return executor;
    },
    // then makes the object awaitable: await from(...).select() works
    then: async (resolve: any, _reject: any) => {
      try {
        const db = loadDB();
        let rows = (db as any)[table] as any[];

        // apply filters
        for (const f of state.filters) {
          if (f.type === 'eq') {
            rows = rows.filter(r => {
              // support nested fields if needed in future
              return (r as any)[f.field] === f.value;
            });
          }
        }

        for (const nf of state.notFilters) {
          if (nf.op === 'is' && nf.value === null) {
            rows = rows.filter(r => (r as any)[nf.field] !== null && (r as any)[nf.field] !== undefined);
          }
        }

        // handle update
        if (state.updateData) {
          const updated: any[] = [];
          rows.forEach((r) => {
            const changed = Object.assign(r, state.updateData, { updated_at: nowISO() });
            updated.push(changed);
          });
          saveDB(db);
          const out = { data: updated, error: null };
          return resolve(out);
        }

        // handle order
        if (state.order) {
          const col = state.order.column;
          const asc = !(state.order.opts && state.order.opts.ascending === false);
          rows = rows.slice().sort((a, b) => {
            const aa = (a as any)[col];
            const bb = (b as any)[col];
            if (aa === bb) return 0;
            if (aa == null) return 1;
            if (bb == null) return -1;
            if (aa < bb) return asc ? -1 : 1;
            return asc ? 1 : -1;
          });
        }

        const outRows = state.singleFlag ? (rows[0] ? [rows[0]] : []) : rows;

        return resolve({ data: outRows, error: null });
      } catch (e) {
        return resolve({ data: null, error: e });
      }
    }
  };

  // allow chaining like supabase.from(...).insert(...).select().single()
  return executor;
}

export const supabase = { from } as any;
