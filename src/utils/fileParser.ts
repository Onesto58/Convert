export const parseFile = async (file: File): Promise<any[]> => {
  console.log("Inizio parsing manuale dBASE III:", file.name, "Dimensione:", file.size);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        if (!buffer) throw new Error("File vuoto");
        
        const view = new DataView(buffer);
        const u8 = new Uint8Array(buffer);
        
        // 1. Leggiamo l'header (primi 32 byte)
        const version = view.getUint8(0);
        const numRecords = view.getUint32(4, true);
        const headerSize = view.getUint16(8, true);
        const recordSize = view.getUint16(10, true);
        
        console.log(`Versione: ${version}, Record: ${numRecords}, HeaderSize: ${headerSize}, RecordSize: ${recordSize}`);
        
        // 2. Leggiamo i descrittori dei campi (32 byte ciascuno, iniziano a offset 32)
        const fields: { name: string, type: string, length: number }[] = [];
        let offset = 32;
        while (offset < headerSize - 1 && u8[offset] !== 0x0D) {
          let name = "";
          for (let i = 0; i < 11; i++) {
            const charCode = u8[offset + i];
            if (charCode === 0) break;
            name += String.fromCharCode(charCode);
          }
          const type = String.fromCharCode(u8[offset + 11]);
          const length = u8[offset + 16];
          fields.push({ name: name.trim(), type, length });
          offset += 32;
        }
        
        console.log("Campi trovati:", fields.map(f => f.name).join(", "));
        
        // 3. Leggiamo i record
        const records: any[] = [];
        let recordOffset = headerSize;
        
        for (let i = 0; i < numRecords; i++) {
          const record: any = {};
          // Il primo byte di ogni record è il flag di cancellazione (spazio = ok, * = cancellato)
          const isDeleted = u8[recordOffset] === 0x2A; // '*'
          
          if (!isDeleted) {
            let fieldOffset = recordOffset + 1;
            for (const field of fields) {
              let value = "";
              for (let j = 0; j < field.length; j++) {
                value += String.fromCharCode(u8[fieldOffset + j]);
              }
              // Pulizia base (trim) e gestione tipi semplici
              const trimmedValue = value.trim();
              if (field.type === 'N' || field.type === 'F') {
                record[field.name] = trimmedValue === "" ? null : Number(trimmedValue);
              } else {
                record[field.name] = trimmedValue;
              }
              fieldOffset += field.length;
            }
            records.push(record);
          }
          recordOffset += recordSize;
        }
        
        console.log("Parsing ultimato. Record validi:", records.length);
        resolve(records);
      } catch (err) {
        console.error("Errore nel parsing manuale:", err);
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
