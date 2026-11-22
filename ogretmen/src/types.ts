// Ders öğretmeni sözleşmeleri. Sunucu, arayüz ve ajanlar bu tipleri paylaşır.
// Şema karşılıkları: schemas.ts. Örnek dosyalar: ogretmen/ornekler/.

export type LessonLang = 'tr' | 'de' | 'en';

/** Normalleştirilmiş kutu: 0–1 aralığında, resmin sol üst köşesine göre. */
export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

// ---------- 1. Anlayıcı ajanın çıktısı: source.json ----------

export type PageType =
  | 'textbook'
  | 'notebook'
  | 'worksheet'
  | 'story'
  | 'exam'
  | 'topic'
  | 'other';

export type RegionKind =
  | 'text'
  | 'heading'
  | 'figure'
  | 'table'
  | 'formula'
  | 'exercise'
  | 'handwriting';

export interface SourceRegion {
  id: string;
  kind: RegionKind;
  /** Girdi resimlerinden hangisi (0'dan başlar). */
  image: number;
  box: Box;
  description: string;
  text?: string;
}

export interface SourceDoc {
  lang: LessonLang;
  subject: string;
  topic: string;
  /** Tahmini sınıf (1–12); belirlenemezse null. */
  gradeGuess: number | null;
  pageType: PageType;
  /** Sayfadaki metnin sadık dökümü (markdown). Konu girdisinde konunun kısa tanımı. */
  transcript: string;
  regions: SourceRegion[];
  keyConcepts: { term: string; explanation: string }[];
  learningGoals: string[];
  exercises: { id: string; text: string; regionId?: string }[];
  /** Okunamayan veya emin olunamayan kısımlar. */
  uncertainties: string[];
  safety: { ok: boolean; note?: string };
}

// ---------- 2. Öğretmen ajanın çıktısı: lesson.json ----------

export type AvatarMood =
  | 'happy'
  | 'explaining'
  | 'thinking'
  | 'surprised'
  | 'encouraging'
  | 'proud';

export type AvatarGesture = 'none' | 'wave' | 'point' | 'nod' | 'clap' | 'think';

export type BoardAnim = 'appear' | 'write' | 'pop' | 'slide';

export type DiagramKind =
  | 'flow'
  | 'cycle'
  | 'timeline'
  | 'compare'
  | 'table'
  | 'numberline'
  | 'fraction';

export type BoardOpName =
  | 'clear'
  | 'heading'
  | 'text'
  | 'bullets'
  | 'math'
  | 'highlight'
  | 'remove'
  | 'image'
  | 'emoji'
  | 'diagram'
  | 'svg';

/**
 * Tahta komutu. Düz yapı: hangi alanın zorunlu olduğu `op`'a bağlıdır
 * (bkz. validate.ts → BOARD_OP_REQUIRED). Arayüz komutları sırayla, `say`
 * seslendirilirken uygular.
 */
export interface BoardOp {
  op: BoardOpName;
  /** Bu komutun oluşturduğu öğenin kimliği (sahne içinde benzersiz). */
  id?: string;
  /** highlight/remove için hedef öğe kimliği. */
  target?: string;
  text?: string;
  style?: 'normal' | 'big' | 'note';
  items?: string[];
  latex?: string;
  /** image: girdi resim sırası. */
  image?: number;
  box?: Box;
  caption?: string;
  emoji?: string;
  count?: number;
  label?: string;
  kind?: DiagramKind;
  columns?: { title: string; items: string[] }[];
  numberline?: {
    min: number;
    max: number;
    step?: number;
    marks?: number[];
    jumps?: { from: number; to: number; label?: string }[];
  };
  fraction?: { numerator: number; denominator: number };
  /** Yedek: küçük, script içermeyen SVG. Arayüz mutlaka temizlemeli (DOMPurify). */
  svg?: string;
  anim?: BoardAnim;
}

export interface CheckQuestion {
  question: string;
  choices: string[];
  answerIndex: number;
  onCorrect: string;
  onWrong: string;
}

export interface LessonStep {
  /** Seslendirilecek metin: düz yazı, kısa cümleler, markdown yok. */
  say: string;
  /** Altyazı `say`'den farklı olacaksa (ör. formül yazımı). */
  caption?: string;
  avatar?: { mood: AvatarMood; gesture?: AvatarGesture };
  board?: BoardOp[];
  /** Adım sonunda çocuğa sorulan küçük kontrol sorusu; cevap gelene kadar ders bekler. */
  check?: CheckQuestion;
}

export interface LessonScene {
  id: string;
  title: string;
  steps: LessonStep[];
}

export interface Lesson {
  version: 1;
  lang: LessonLang;
  title: string;
  subject: string;
  gradeBand: string;
  summary: string;
  scenes: LessonScene[];
  recap: { points: string[]; say: string };
  glossary: { term: string; meaning: string }[];
  nextIdeas: string[];
}

// ---------- 3. Sınav: quiz-N.json ----------

export type QuizQuestionType =
  | 'multiple_choice'
  | 'true_false'
  | 'short_answer'
  | 'fill_blank'
  | 'ordering';

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  prompt: string;
  /** Sesli okunacak hâli (prompt'tan farklıysa). */
  say?: string;
  choices?: string[];
  answerIndex?: number;
  answerBool?: boolean;
  acceptedAnswers?: string[];
  orderedItems?: string[];
  explanation: string;
  hint?: string;
  difficulty: 1 | 2 | 3;
}

export interface Quiz {
  version: 1;
  lang: LessonLang;
  title: string;
  questions: QuizQuestion[];
}

// ---------- 4. Soru-cevap: answers/N.json ----------

export interface TutorAnswer {
  version: 1;
  /** Çocuğun sorusu ders konusuyla ilgisizse veya uygunsuzsa false. */
  onTopic: boolean;
  steps: LessonStep[];
  followUp?: string;
}

// ---------- Kayıt bilgisi: meta.json ----------

export type LessonStatus =
  | 'understanding'
  | 'teaching'
  | 'ready'
  | 'rejected'
  | 'error';

export interface LessonInput {
  /** Fotoğraf yolları (sunucu diske kaydettikten sonra). */
  images?: string[];
  text?: string;
  topic?: string;
  lang?: LessonLang;
  /** Çocuğun sınıfı (1–12). */
  grade?: number;
  /** Çocuğun veya ebeveynin isteği: "sadece 2. alıştırmayı anlat" gibi. */
  request?: string;
}

export interface LessonMeta {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: LessonStatus;
  error?: string;
  input: {
    kind: 'page' | 'text' | 'topic';
    images: string[];
    lang: LessonLang;
    grade?: number;
    request?: string;
  };
  model: string;
  agentIds: { understand?: string; teach?: string; tutor?: string };
  quizzes: number;
  answers: number;
}

/** Ders listesinde görünen başlık, kategori ve konu. meta.json içine yazılmaz. */
export interface LessonListItem extends LessonMeta {
  title?: string;
  subject?: string;
  topic?: string;
}

export type ProgressStage = 'understand' | 'teach' | 'quiz' | 'answer';

export interface ProgressEvent {
  lessonId: string;
  stage: ProgressStage;
  kind: 'started' | 'working' | 'saved' | 'retry' | 'done' | 'error';
  message: string;
}
