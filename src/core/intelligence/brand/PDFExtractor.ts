import { PDFDocument } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';

interface ExtractedContent {
  text: string;
  metadata: {
    title?: string;
    author?: string;
    creationDate?: Date;
    pageCount: number;
  };
  sections: {
    title: string;
    content: string;
    pageNumber: number;
  }[];
}

export class PDFExtractor {
  private static instance: PDFExtractor;

  private constructor() {
    // Initialize PDF.js worker
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;
  }

  public static getInstance(): PDFExtractor {
    if (!PDFExtractor.instance) {
      PDFExtractor.instance = new PDFExtractor();
    }
    return PDFExtractor.instance;
  }

  public async extractContent(pdfBuffer: Buffer): Promise<ExtractedContent> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pageCount = pdfDoc.getPageCount();
      const metadata = await this.extractMetadata(pdfDoc);
      const sections = await this.extractSections(pdfBuffer);

      return {
        text: sections.map(s => s.content).join('\n'),
        metadata: {
          ...metadata,
          pageCount,
        },
        sections,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Failed to extract PDF content: ${error.message}`);
      }
      throw new Error('Failed to extract PDF content: Unknown error occurred');
    }
  }

  private async extractMetadata(pdfDoc: PDFDocument) {
    return {
      title: pdfDoc.getTitle(),
      author: pdfDoc.getAuthor(),
      creationDate: pdfDoc.getCreationDate(),
    };
  }

  private async extractSections(pdfBuffer: Buffer) {
    const sections = [];
    const pdf = await pdfjs.getDocument({ data: pdfBuffer }).promise;
    const pageCount = pdf.numPages;

    for (let i = 0; i < pageCount; i++) {
      const page = await pdf.getPage(i + 1);
      const content = await this.extractPageContent(page);
      
      if (content.trim()) {
        sections.push({
          title: `Page ${i + 1}`,
          content: content.trim(),
          pageNumber: i + 1,
        });
      }
    }

    return sections;
  }

  private async extractPageContent(page: pdfjs.PDFPageProxy): Promise<string> {
    const textContent = await page.getTextContent();
    return textContent.items
      .map((item: any) => item.str)
      .join(' ');
  }
}

export default PDFExtractor; 