import React, { useState, useCallback } from 'react';
import { UploadCloud } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.dbf')) {
        onFileSelect(file);
      } else {
        alert("Per favore, carica un file in formato .dbf");
      }
    }
  }, [onFileSelect]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.name.toLowerCase().endsWith('.dbf')) {
        onFileSelect(file);
      } else {
        alert("Per favore, carica un file in formato .dbf");
      }
    }
  };

  return (
    <div 
      className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-colors duration-200
        ${isDragging ? 'border-primary bg-primary/10' : 'border-border bg-card hover:bg-muted/50'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => document.getElementById('file-upload')?.click()}
    >
      <input 
        id="file-upload" 
        type="file" 
        accept=".dbf" 
        className="hidden" 
        onChange={handleInputChange} 
      />
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="p-4 bg-primary/10 rounded-full text-primary">
          <UploadCloud size={48} />
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Carica il tuo file DBF</h3>
          <p className="text-muted-foreground">
            Trascina qui il file oppure clicca per selezionarlo dal computer
          </p>
        </div>
      </div>
    </div>
  );
};
