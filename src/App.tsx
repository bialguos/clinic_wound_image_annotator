import { useState } from 'react';
import { Heart } from 'lucide-react';
import { Patient, WoundRecord } from './lib/supabase';
import PatientList from './components/PatientList';
import PatientDetail from './components/PatientDetail';
import WoundRecordEditor from './components/WoundRecordEditor';

type View = 'list' | 'detail' | 'editor';

function App() {
  const [view, setView] = useState<View>('list');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<WoundRecord | null>(null);

  const handleSelectPatient = (patient: Patient) => {
    setSelectedPatient(patient);
    setView('detail');
  };

  const handleOpenWoundRecord = (record: WoundRecord) => {
    setSelectedRecord(record);
    setView('editor');
  };

  const handleBack = () => {
    setSelectedPatient(null);
    setView('list');
  };

  const handleCloseEditor = () => {
    setSelectedRecord(null);
    setView('detail');
  };

  const handleSaveEditor = () => {
    setSelectedRecord(null);
    setView('detail');
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <header className="bg-white border-b shadow-sm">
        <div className="px-6 py-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Cuidados de Enfermería</h1>
        </div>
      </header>

      <div className="flex-1 overflow-hidden">
        {view === 'list' && (
          <div className="h-full max-w-4xl mx-auto">
            <PatientList onSelectPatient={handleSelectPatient} />
          </div>
        )}

        {view === 'detail' && selectedPatient && (
          <PatientDetail
            patient={selectedPatient}
            onBack={handleBack}
            onOpenWoundRecord={handleOpenWoundRecord}
          />
        )}

        {view === 'editor' && selectedPatient && (
          <WoundRecordEditor
            record={selectedRecord}
            patientId={selectedPatient.id}
            onClose={handleCloseEditor}
            onSave={handleSaveEditor}
          />
        )}
      </div>
    </div>
  );
}

export default App;
