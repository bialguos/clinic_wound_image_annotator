import { useState, useEffect } from 'react';
import { Search, ChevronRight, Plus } from 'lucide-react';
import { supabase, Patient } from '../lib/supabase';

type PatientListProps = {
  onSelectPatient: (patient: Patient) => void;
};

export default function PatientList({ onSelectPatient }: PatientListProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPatients(data);
    }
    setLoading(false);
  };

  const filteredPatients = patients.filter(patient =>
    patient.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.medical_record.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col bg-white">
      <div className="p-4 border-b">
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar paciente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <p className="text-xs text-gray-500 mb-2">Selecciona un paciente para añadir una imagen:</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-gray-500">Cargando...</div>
        ) : filteredPatients.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchTerm ? 'No se encontraron pacientes' : 'No hay pacientes registrados'}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredPatients.map((patient) => (
              <div
                key={patient.id}
                className="px-4 py-3 hover:bg-gray-50 transition-colors flex items-center justify-between group"
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{patient.full_name}</div>
                  <div className="text-sm text-gray-500">HC: {patient.medical_record}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {patient.age && `${patient.age} años`}
                    {patient.admission_day && ` • ${patient.admission_day}`}
                  </div>
                </div>
                <button
                  onClick={() => onSelectPatient(patient)}
                  className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Plus className="w-4 h-4" />
                  Añadir
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
