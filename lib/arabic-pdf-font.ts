// Arabic font support for jsPDF using Amiri Regular
// Font: Amiri Regular (SIL Open Font License)

import { jsPDF } from "jspdf";

export const getAmiriFontBase64 = async (): Promise<string> => {
  try {
    // Fetch the font file
    const response = await fetch('/fonts/Amiri-Regular.ttf');
    if (!response.ok) {
      throw new Error(`Failed to load font: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();

    // Convert ArrayBuffer to base64
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch (error) {
    console.error('Error loading Amiri font:', error);
    throw error;
  }
};

export const addArabicFontToDoc = (doc: jsPDF, fontBase64: string) => {
  try {
    // Add the font to jsPDF's virtual file system
    doc.addFileToVFS('Amiri-Regular.ttf', fontBase64);

    // Register the font with jsPDF
    doc.addFont('Amiri-Regular.ttf', 'Amiri', 'normal');

    // Set as default font
    doc.setFont('Amiri', 'normal');

    console.log('Arabic font successfully added to PDF');
  } catch (error) {
    console.error('Error adding Arabic font to PDF:', error);
    throw error;
  }
};
