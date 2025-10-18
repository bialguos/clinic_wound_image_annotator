import { ChevronDown, ChevronRight, Folder, FolderOpen, FileText } from 'lucide-react';
import { WoundCategory, WoundRecord } from '../lib/supabase';

type WoundRecordsListProps = {
  categories: WoundCategory[];
  woundRecords: WoundRecord[];
  expandedCategories: Set<string>;
  onToggleCategory: (categoryId: string) => void;
  onSelectRecord: (record: WoundRecord) => void;
};

export default function WoundRecordsList({
  categories,
  woundRecords,
  expandedCategories,
  onToggleCategory,
  onSelectRecord
}: WoundRecordsListProps) {
  const parentCategories = categories.filter(c => !c.parent_id);

  const getChildCategories = (parentId: string) => {
    return categories.filter(c => c.parent_id === parentId);
  };

  const getRecordsByCategory = (categoryId: string) => {
    return woundRecords.filter(r => r.category_id === categoryId);
  };

  const renderCategory = (category: WoundCategory, level: number = 0) => {
    const isExpanded = expandedCategories.has(category.id);
    const children = getChildCategories(category.id);
    const records = getRecordsByCategory(category.id);
    const hasChildren = children.length > 0;
    const hasRecords = records.length > 0;

    return (
      <div key={category.id}>
        <button
          onClick={() => onToggleCategory(category.id)}
          className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-gray-100 rounded transition-colors"
          style={{ paddingLeft: `${level * 16 + 8}px` }}
        >
          {hasChildren || hasRecords ? (
            isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
          ) : (
            <span className="w-4" />
          )}
          {isExpanded ? (
            <FolderOpen className="w-4 h-4 text-blue-500" />
          ) : (
            <Folder className="w-4 h-4 text-gray-400" />
          )}
          <span className="font-medium text-gray-700">{category.name}</span>
        </button>

        {isExpanded && (
          <>
            {children.map(child => renderCategory(child, level + 1))}
            {records.map(record => (
              <button
                key={record.id}
                onClick={() => onSelectRecord(record)}
                className="w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-gray-100 rounded transition-colors"
                style={{ paddingLeft: `${(level + 1) * 16 + 8}px` }}
              >
                <span className="w-4" />
                <FileText className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600">{record.title}</span>
              </button>
            ))}
          </>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-1">
      {parentCategories.map(category => renderCategory(category))}
    </div>
  );
}
