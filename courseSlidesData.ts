export interface CourseSlide {
  id: number;
  slideNumber: number;
  totalSlides: number;
  imageUrl?: string;
  moduleTitle?: string;
  isModuleCover?: boolean;
  title: string;
  subtitle?: string;
  xpReward: number;
  categoryTag?: string;
  bulletPoints?: string[];
  codeBox?: {
    scratchTitle?: string;
    scratchCode?: string;
    pythonTitle?: string;
    pythonCode?: string;
    language?: 'scratch' | 'python' | 'both';
  };
  ninjaTip?: string;
  factCheck?: string;
  quiz?: {
    question: string;
    options: string[];
    correctIndex: number;
  };
}

export interface CourseSlidesDeck {
  courseId: string;
  courseTitle: string;
  badge: string;
  slides: CourseSlide[];
}

export function buildPdfSlides(
  folder: string,
  filenamePrefix: string,
  pageCount: number,
  titlePrefix: string,
  zeroPad: boolean = false
): CourseSlide[] {
  return Array.from({ length: pageCount }, (_, index) => {
    const slideNumber = index + 1;
    const formattedPage = zeroPad ? String(slideNumber).padStart(2, '0') : String(slideNumber);
    // Create a minimal slide object that reflects only the original PDF page image.
    // Do NOT invent titles, subtitles or bullet points — be faithful to the PDF.
    return {
      id: slideNumber,
      slideNumber,
      totalSlides: pageCount,
      isModuleCover: slideNumber === 1,
      title: '',
      xpReward: 0,
      imageUrl: `/assets/images/${folder}/${filenamePrefix}${formattedPage}.png`,
    };
  });
}

export const SCRATCH_NINJA_SLIDES: CourseSlide[] = buildPdfSlides(
  'guia_completo_aulas_tecnologia_2025',
  'guia_page-',
  4,
  'Guia Completo de Aulas de Tecnologia e Computação 2025',
  false
);

export const PYTHON_PRO_SLIDES: CourseSlide[] = buildPdfSlides(
  'trilha_tecnologia_computacao_2025',
  'trilha_page-',
  41,
  'Trilha Completa de Tecnologia e Computação 2025 - 1º EF ao 3º EM',
  true
);

export const COURSE_DECKS: Record<string, CourseSlidesDeck> = {
  'curso-1-scratch-ninja': {
    courseId: 'curso-1-scratch-ninja',
    courseTitle: 'Aventura Scratch Ninja',
    badge: 'Plano Básico & Completo',
    slides: SCRATCH_NINJA_SLIDES
  },
  'curso-2-python-pro-mode': {
    courseId: 'curso-2-python-pro-mode',
    courseTitle: 'Python Pro Mode',
    badge: 'Exclusivo Plano Completo (PRO)',
    slides: PYTHON_PRO_SLIDES
  }
};
