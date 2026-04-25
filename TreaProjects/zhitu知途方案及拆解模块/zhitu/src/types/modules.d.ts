/**
 * Type declarations for modules without TypeScript support
 */

declare module 'pdf-parse' {
  interface PDFData {
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: unknown;
    text: string;
    version: string;
  }

  interface PDFOptions {
    pagerender?: (pageData: { getTextContent: () => Promise<unknown> }) => Promise<string>;
    max?: number;
    version?: string;
  }

  function pdfParse(
    dataBuffer: Buffer,
    options?: PDFOptions
  ): Promise<PDFData>;

  export = pdfParse;
}

declare module 'mammoth' {
  interface MammothOptions {
    buffer: Buffer;
  }

  interface MammothResult {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }

  interface Mammoth {
    extractRawText(options: MammothOptions): Promise<MammothResult>;
  }

  const mammoth: Mammoth;
  export = mammoth;
}