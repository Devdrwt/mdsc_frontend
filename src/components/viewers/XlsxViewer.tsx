'use client';

import React, { useState, useEffect } from 'react';
import { Loader, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface XlsxViewerProps {
  url: string;
  filename?: string;
}

export default function XlsxViewer({ url, filename }: XlsxViewerProps) {
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [activeSheet, setActiveSheet] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadWorkbook = async () => {
      setIsLoading(true);
      setError(false);

      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Erreur lors du chargement du fichier');
        }

        const arrayBuffer = await response.arrayBuffer();
        const wb = XLSX.read(arrayBuffer, { type: 'array' });
        
        setWorkbook(wb);
        setActiveSheet(wb.SheetNames[0] || '');
        setIsLoading(false);
      } catch (err: any) {
        console.error('Erreur lors du chargement du fichier Excel:', err);
        setError(true);
        setIsLoading(false);
      }
    };

    if (url) {
      loadWorkbook();
    }
  }, [url]);

  const renderSheet = (sheetName: string) => {
    if (!workbook) return null;

    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

    if (jsonData.length === 0) {
      return (
        <div className="p-8 text-center text-gray-500">
          <p>La feuille est vide</p>
        </div>
      );
    }

    return (
      <div className="overflow-auto">
        <table className="min-w-full border-collapse border border-gray-300">
          <tbody>
            {jsonData.map((row: any, rowIndex: number) => (
              <tr key={rowIndex}>
                {Array.isArray(row) ? (
                  row.map((cell: any, cellIndex: number) => (
                    <td
                      key={cellIndex}
                      className={`border border-gray-300 px-4 py-2 ${
                        rowIndex === 0 ? 'bg-gray-100 font-semibold' : ''
                      }`}
                    >
                      {cell !== null && cell !== undefined ? String(cell) : ''}
                    </td>
                  ))
                ) : (
                  <td className="border border-gray-300 px-4 py-2">
                    {row !== null && row !== undefined ? String(row) : ''}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 min-h-[600px]">
        <Loader className="h-8 w-8 animate-spin text-mdsc-blue-primary mb-4" />
        <p className="text-sm text-gray-600">Chargement du fichier Excel...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 min-h-[600px]">
        <AlertCircle className="h-16 w-16 text-gray-400 mb-4" />
        <p className="text-gray-600 font-medium mb-2">Impossible d'afficher le fichier Excel</p>
        <p className="text-sm text-gray-500">Veuillez réessayer plus tard</p>
      </div>
    );
  }

  if (!workbook || !activeSheet) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gray-50 min-h-[600px]">
        <AlertCircle className="h-16 w-16 text-gray-400 mb-4" />
        <p className="text-gray-600 font-medium mb-2">Aucune donnée disponible</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-white">
      {/* Sélecteur de feuilles */}
      {workbook.SheetNames.length > 1 && (
        <div className="bg-gray-100 px-4 py-3 border-b border-gray-200 flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-gray-700">Feuilles:</span>
          {workbook.SheetNames.map((sheetName) => (
            <button
              key={sheetName}
              onClick={() => setActiveSheet(sheetName)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeSheet === sheetName
                  ? 'bg-mdsc-blue-primary text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {sheetName}
            </button>
          ))}
        </div>
      )}

      {/* Contenu de la feuille */}
      <div className="flex-1 overflow-auto p-4">
        {renderSheet(activeSheet)}
      </div>
    </div>
  );
}

