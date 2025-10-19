// IndexedDB wrapper for storing images and data
// This replaces localStorage to avoid quota exceeded errors

const DB_NAME = 'clinic_db';
const DB_VERSION = 1;
const STORE_WOUND_IMAGES = 'wound_images';
const STORE_PATIENTS = 'patients';

let db: IDBDatabase | null = null;

// Initialize IndexedDB
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      reject(request.error);
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Create wound_images store if it doesn't exist
      if (!database.objectStoreNames.contains(STORE_WOUND_IMAGES)) {
        const woundStore = database.createObjectStore(STORE_WOUND_IMAGES, { keyPath: 'id' });
        woundStore.createIndex('created_at', 'created_at', { unique: false });
        woundStore.createIndex('image_name', 'image_name', { unique: false });
      }

      // Create patients store if it doesn't exist
      if (!database.objectStoreNames.contains(STORE_PATIENTS)) {
        const patientStore = database.createObjectStore(STORE_PATIENTS, { keyPath: 'id' });
        patientStore.createIndex('medical_record', 'medical_record', { unique: true });
      }
    };
  });
};

// Generic function to get all items from a store
export const getAllFromStore = async (storeName: string): Promise<any[]> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => {
      resolve(request.result || []);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

// Generic function to get a single item by id
export const getFromStore = async (storeName: string, id: string): Promise<any> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

// Generic function to add/update an item in a store
export const putInStore = async (storeName: string, item: any): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

// Generic function to delete an item from a store
export const deleteFromStore = async (storeName: string, id: string): Promise<void> => {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([storeName], 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve();
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

// Wound Images specific functions
export const woundImagesDB = {
  getAll: () => getAllFromStore(STORE_WOUND_IMAGES),
  get: (id: string) => getFromStore(STORE_WOUND_IMAGES, id),
  put: (item: any) => putInStore(STORE_WOUND_IMAGES, item),
  delete: (id: string) => deleteFromStore(STORE_WOUND_IMAGES, id),
};

// Patients specific functions
export const patientsDB = {
  getAll: () => getAllFromStore(STORE_PATIENTS),
  get: (id: string) => getFromStore(STORE_PATIENTS, id),
  put: (item: any) => putInStore(STORE_PATIENTS, item),
  delete: (id: string) => deleteFromStore(STORE_PATIENTS, id),
};

// Migrate data from localStorage to IndexedDB (run once)
export const migrateFromLocalStorage = async () => {
  try {
    const oldData = localStorage.getItem('clinic_db_v1');
    if (!oldData) return;

    const parsed = JSON.parse(oldData);

    // Migrate wound_images
    if (parsed.wound_images && Array.isArray(parsed.wound_images)) {
      for (const image of parsed.wound_images) {
        await woundImagesDB.put(image);
      }
    }

    // Migrate patients
    if (parsed.patients && Array.isArray(parsed.patients)) {
      for (const patient of parsed.patients) {
        await patientsDB.put(patient);
      }
    }

    console.log('Migration from localStorage to IndexedDB completed');
  } catch (error) {
    console.error('Error migrating from localStorage:', error);
  }
};
