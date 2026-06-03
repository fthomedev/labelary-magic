import { PDFDocument } from 'pdf-lib';

// Page geometry (mm → points; 1 mm = 2.83465 pt)
const MM = 2.83465;
const PAGE_W = 85 * MM;
const PAGE_H = 25 * MM;
const LABEL_W = 40 * MM;
const LABEL_H = 25 * MM;
const GAP = 5 * MM;

/**
 * Combine 40×25mm label PDFs into an 85×25mm 2-column PDF.
 *
 * Accepts an array of PDF blobs (each may contain multiple 40×25mm pages,
 * matching how Labelary returns batched requests). All pages are flattened
 * sequentially and paired left/right into 85×25mm pages with a 5mm gap.
 * Odd totals leave the right column blank on the last page.
 */
export async function pairUpPdfs(pdfBlobs: Blob[]): Promise<Blob> {
  if (pdfBlobs.length === 0) {
    throw new Error('pairUpPdfs: no PDFs to process');
  }

  const out = await PDFDocument.create();

  // Flatten: each entry is [sourceDoc, pageIndex] across all batches.
  const allPages: Array<{ doc: PDFDocument; index: number }> = [];
  for (const blob of pdfBlobs) {
    const bytes = await blob.arrayBuffer();
    const doc = await PDFDocument.load(bytes);
    const count = doc.getPageCount();
    for (let i = 0; i < count; i++) {
      allPages.push({ doc, index: i });
    }
  }

  console.log(`📐 pairUpPdfs: flattened ${pdfBlobs.length} PDFs → ${allPages.length} labels → ${Math.ceil(allPages.length / 2)} pages`);

  // Embed every source page in one go (pdf-lib dedupes by doc).
  // We embed per blob to keep memory reasonable.
  const embedCache = new Map<PDFDocument, any[]>();

  for (let i = 0; i < allPages.length; i += 2) {
    const page = out.addPage([PAGE_W, PAGE_H]);

    // Left
    const left = allPages[i];
    let leftEmbedded = embedCache.get(left.doc);
    if (!leftEmbedded) {
      leftEmbedded = await out.embedPdf(left.doc, left.doc.getPageIndices());
      embedCache.set(left.doc, leftEmbedded);
    }
    page.drawPage(leftEmbedded[left.index], {
      x: 0,
      y: 0,
      width: LABEL_W,
      height: LABEL_H,
    });

    // Right (optional)
    const right = allPages[i + 1];
    if (right) {
      let rightEmbedded = embedCache.get(right.doc);
      if (!rightEmbedded) {
        rightEmbedded = await out.embedPdf(right.doc, right.doc.getPageIndices());
        embedCache.set(right.doc, rightEmbedded);
      }
      page.drawPage(rightEmbedded[right.index], {
        x: LABEL_W + GAP,
        y: 0,
        width: LABEL_W,
        height: LABEL_H,
      });
    }
  }

  const bytes = await out.save();
  return new Blob([bytes as BlobPart], { type: 'application/pdf' });
}
