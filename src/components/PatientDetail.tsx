import { useState, useEffect } from 'react';
import { ArrowLeft, Plus } from 'lucide-react';
import { supabase, Patient, WoundRecord, WoundCategory } from '../lib/supabase';
import WoundRecordsList from './WoundRecordsList';

type PatientDetailProps = {
  patient: Patient;
  onBack: () => void;
  onOpenWoundRecord: (record: WoundRecord) => void;
};

export default function PatientDetail({ patient, onBack, onOpenWoundRecord }: PatientDetailProps) {
  const [categories, setCategories] = useState<WoundCategory[]>([]);
  const [woundRecords, setWoundRecords] = useState<WoundRecord[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [patient.id]);

  const loadData = async () => {
    setLoading(true);

    const [categoriesResult, recordsResult] = await Promise.all([
      supabase.from('wound_categories').select('*').order('order_index'),
      supabase.from('wound_records').select('*').eq('patient_id', patient.id).order('created_at', { ascending: false })
    ]);

    if (categoriesResult.data) {
      setCategories(categoriesResult.data);
      const curas = categoriesResult.data.find(c => c.name === 'Curas' && !c.parent_id);
      if (curas) {
        setExpandedCategories(new Set([curas.id]));
      }
    }

    if (recordsResult.data) {
      setWoundRecords(recordsResult.data);
    }

    setLoading(false);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const calculateAge = (admissionDate: string) => {
    const admission = new Date(admissionDate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - admission.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <div className="h-full flex">
      <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-4 bg-white border-b">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Volver</span>
          </button>
        </div>

        <div className="p-4 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <button className="px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50 transition-colors">
              Expandir Todo
            </button>
            <button className="px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
              Colapsar Todo
            </button>
          </div>

          <div className="relative mb-4">
            <input
              type="text"
              placeholder="Buscar..."
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <WoundRecordsList
            categories={categories}
            woundRecords={woundRecords}
            expandedCategories={expandedCategories}
            onToggleCategory={toggleCategory}
            onSelectRecord={onOpenWoundRecord}
          />
        </div>
      </div>

      <div className="flex-1 bg-white">
        <div className="h-full flex flex-col">
          <div className="bg-white border-b px-6 py-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-2xl font-semibold text-gray-900">{patient.full_name}</h1>
                <div className="mt-2 text-sm text-gray-600 space-y-1">
                  <div>Desconocido {patient.age} años | HC: {patient.medical_record} | {formatDate(patient.admission_date)}</div>
                  <div>Día ingreso: {patient.admission_day} | P. Atención: {patient.attention_point}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors">
                  Alergias
                </button>
                <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                  Alertas
                </button>
                <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                  Antecedentes
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto">
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="px-4 py-3 border-b bg-gray-50 flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">Registro de enfermería</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Estado:</span>
                  <select className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option>Pendiente</option>
                    <option>En progreso</option>
                    <option>Completado</option>
                  </select>
                </div>
              </div>

              {loading ? (
                <div className="p-8 text-center text-gray-500">Cargando registros...</div>
              ) : woundRecords.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No hay registros que cumplan con los filtros seleccionados.
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
