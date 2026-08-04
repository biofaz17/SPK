import fs from 'fs';
import path from 'path';
import { createCanvas } from 'canvas';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.js';

class NodeCanvasFactory {
  create(width, height) {
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');
    return { canvas, context };
  }
  reset(canvasAndContext, width, height) {
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }
  destroy(canvasAndContext) {
    // nothing special to do for node-canvas
  }
}

async function renderPdfToImages(pdfPath, outDir, scale = 2.0) {
  const data = fs.readFileSync(pdfPath);
  const loadingTask = getDocument({ data });
  const pdf = await loadingTask.promise;
  fs.mkdirSync(outDir, { recursive: true });

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale });

    const canvasFactory = new NodeCanvasFactory();
    const { canvas, context } = canvasFactory.create(viewport.width, viewport.height);

    const renderContext = {
      canvasContext: context,
      viewport,
      canvasFactory,
    };

    await page.render(renderContext).promise;

    const fileName = `${path.basename(pdfPath, path.extname(pdfPath))}_page_${i}.png`;
    const outPath = path.join(outDir, fileName);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outPath, buffer);
    console.log('Wrote', outPath);
  }

  await pdf.destroy();
}

async function main() {
  const projectRoot = process.cwd();
  const files = fs.readdirSync(projectRoot).filter(f => f.toLowerCase().endsWith('.pdf'));

  if (files.length === 0) {
    console.error('No PDF files found in project root. Place PDFs in the project root or pass a path.');
    process.exit(1);
  }

  for (const f of files) {
    const pdfPath = path.join(projectRoot, f);
    const name = path.basename(f, path.extname(f));
    const outDir = path.join(projectRoot, 'public', 'assets', 'images', name);
    try {
      await renderPdfToImages(pdfPath, outDir, 2.0);
    } catch (err) {
      console.error('Failed to process', pdfPath, err);
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
