// JSON şemaları. Ajanlara özel aracın `inputSchema`'sı olarak verilir ve
// kayıttan önce ajv ile doğrulanır. Tipler: types.ts. Ek kurallar: validate.ts.

type Schema = Record<string, unknown>;

const str = (description?: string, extra: Schema = {}): Schema => ({
  type: 'string',
  minLength: 1,
  ...(description ? { description } : {}),
  ...extra,
});

const strList = (description?: string, extra: Schema = {}): Schema => ({
  type: 'array',
  items: { type: 'string', minLength: 1 },
  ...(description ? { description } : {}),
  ...extra,
});

const obj = (properties: Schema, required: string[], description?: string): Schema => ({
  type: 'object',
  properties,
  required,
  additionalProperties: false,
  ...(description ? { description } : {}),
});

const unit = { type: 'number', minimum: 0, maximum: 1 };

const box = obj(
  { x: unit, y: unit, w: unit, h: unit },
  ['x', 'y', 'w', 'h'],
  'Resim üzerinde 0–1 aralığında normalleştirilmiş kutu; x,y sol üst köşe.',
);

const lang = { type: 'string', enum: ['tr', 'de', 'en'] };

export const sourceSchema: Schema = obj(
  {
    lang,
    subject: str('Ders adı: Matematik, Fen Bilimleri, Türkçe, Sosyal Bilgiler...'),
    topic: str('Sayfanın ana konusu, kısa.'),
    gradeGuess: {
      type: ['integer', 'null'],
      minimum: 1,
      maximum: 12,
      description: 'Tahmini sınıf; bilinmiyorsa null.',
    },
    pageType: {
      type: 'string',
      enum: ['textbook', 'notebook', 'worksheet', 'story', 'exam', 'topic', 'other'],
    },
    transcript: str('Sayfadaki metnin sadık dökümü (markdown). Uydurma yok.'),
    regions: {
      type: 'array',
      items: obj(
        {
          id: str(),
          kind: {
            type: 'string',
            enum: ['text', 'heading', 'figure', 'table', 'formula', 'exercise', 'handwriting'],
          },
          image: { type: 'integer', minimum: 0 },
          box,
          description: str(),
          text: { type: 'string' },
        },
        ['id', 'kind', 'image', 'box', 'description'],
      ),
    },
    keyConcepts: {
      type: 'array',
      minItems: 1,
      items: obj({ term: str(), explanation: str() }, ['term', 'explanation']),
    },
    learningGoals: strList(undefined, { minItems: 1, maxItems: 6 }),
    exercises: {
      type: 'array',
      items: obj({ id: str(), text: str(), regionId: { type: 'string' } }, ['id', 'text']),
    },
    uncertainties: strList(),
    safety: obj({ ok: { type: 'boolean' }, note: { type: 'string' } }, ['ok']),
  },
  [
    'lang',
    'subject',
    'topic',
    'gradeGuess',
    'pageType',
    'transcript',
    'regions',
    'keyConcepts',
    'learningGoals',
    'exercises',
    'uncertainties',
    'safety',
  ],
);

const boardOp = obj(
  {
    op: {
      type: 'string',
      enum: [
        'clear',
        'heading',
        'text',
        'bullets',
        'math',
        'highlight',
        'remove',
        'image',
        'emoji',
        'diagram',
        'svg',
      ],
    },
    id: str('Oluşan öğenin sahne içinde benzersiz kimliği.'),
    target: str('highlight/remove: hedef öğenin id değeri.'),
    text: str(),
    style: { type: 'string', enum: ['normal', 'big', 'note'] },
    items: strList(undefined, { minItems: 1, maxItems: 8 }),
    latex: str(),
    image: { type: 'integer', minimum: 0, description: 'Girdi resim sırası (0’dan).' },
    box,
    caption: str(),
    emoji: str(),
    count: { type: 'integer', minimum: 1, maximum: 20 },
    label: str(),
    kind: {
      type: 'string',
      enum: ['flow', 'cycle', 'timeline', 'compare', 'table', 'numberline', 'fraction'],
    },
    columns: {
      type: 'array',
      minItems: 1,
      maxItems: 4,
      items: obj({ title: str(), items: strList(undefined, { maxItems: 8 }) }, ['title', 'items']),
    },
    numberline: obj(
      {
        min: { type: 'number' },
        max: { type: 'number' },
        step: { type: 'number', exclusiveMinimum: 0 },
        marks: { type: 'array', items: { type: 'number' } },
        jumps: {
          type: 'array',
          items: obj(
            { from: { type: 'number' }, to: { type: 'number' }, label: { type: 'string' } },
            ['from', 'to'],
          ),
        },
      },
      ['min', 'max'],
    ),
    fraction: obj(
      {
        numerator: { type: 'integer', minimum: 0 },
        denominator: { type: 'integer', minimum: 1, maximum: 24 },
      },
      ['numerator', 'denominator'],
    ),
    svg: str('Yalnızca diğer komutlar yetmezse: küçük, script içermeyen <svg>.', { maxLength: 4000 }),
    anim: { type: 'string', enum: ['appear', 'write', 'pop', 'slide'] },
  },
  ['op'],
);

const avatar = obj(
  {
    mood: {
      type: 'string',
      enum: ['happy', 'explaining', 'thinking', 'surprised', 'encouraging', 'proud'],
    },
    gesture: { type: 'string', enum: ['none', 'wave', 'point', 'nod', 'clap', 'think'] },
  },
  ['mood'],
);

const check = obj(
  {
    question: str(),
    choices: strList(undefined, { minItems: 2, maxItems: 4 }),
    answerIndex: { type: 'integer', minimum: 0, maximum: 3 },
    onCorrect: str(),
    onWrong: str('Yanlışta ipucu ver, cevabı hemen söyleme.'),
  },
  ['question', 'choices', 'answerIndex', 'onCorrect', 'onWrong'],
);

const step = obj(
  {
    say: str('Seslendirilecek metin: düz yazı, kısa cümleler, markdown/emoji yok.', {
      maxLength: 600,
    }),
    caption: str(),
    avatar,
    board: { type: 'array', items: boardOp, maxItems: 6 },
    check,
  },
  ['say'],
);

export const lessonSchema: Schema = obj(
  {
    version: { const: 1 },
    lang,
    title: str(),
    subject: str(),
    gradeBand: str('Ör. "3-4. sınıf".'),
    summary: str('Ebeveyn için 1-2 cümlelik özet.'),
    scenes: {
      type: 'array',
      minItems: 2,
      maxItems: 8,
      items: obj(
        {
          id: str(),
          title: str(),
          steps: { type: 'array', minItems: 1, maxItems: 8, items: step },
        },
        ['id', 'title', 'steps'],
      ),
    },
    recap: obj(
      { points: strList(undefined, { minItems: 2, maxItems: 5 }), say: str() },
      ['points', 'say'],
    ),
    glossary: {
      type: 'array',
      items: obj({ term: str(), meaning: str() }, ['term', 'meaning']),
    },
    nextIdeas: strList(undefined, { maxItems: 4 }),
  },
  [
    'version',
    'lang',
    'title',
    'subject',
    'gradeBand',
    'summary',
    'scenes',
    'recap',
    'glossary',
    'nextIdeas',
  ],
);

export const quizSchema: Schema = obj(
  {
    version: { const: 1 },
    lang,
    title: str(),
    questions: {
      type: 'array',
      minItems: 1,
      maxItems: 20,
      items: obj(
        {
          id: str(),
          type: {
            type: 'string',
            enum: ['multiple_choice', 'true_false', 'short_answer', 'fill_blank', 'ordering'],
          },
          prompt: str(),
          say: str(),
          choices: strList(undefined, { minItems: 2, maxItems: 5 }),
          answerIndex: { type: 'integer', minimum: 0 },
          answerBool: { type: 'boolean' },
          acceptedAnswers: strList(undefined, { minItems: 1 }),
          orderedItems: strList(undefined, { minItems: 2, maxItems: 8 }),
          explanation: str(),
          hint: str(),
          difficulty: { type: 'integer', enum: [1, 2, 3] },
        },
        ['id', 'type', 'prompt', 'explanation', 'difficulty'],
      ),
    },
  },
  ['version', 'lang', 'title', 'questions'],
);

export const answerSchema: Schema = obj(
  {
    version: { const: 1 },
    onTopic: { type: 'boolean' },
    steps: { type: 'array', minItems: 1, maxItems: 6, items: step },
    followUp: str('Çocuğa önerilecek bir sonraki küçük soru veya etkinlik.'),
  },
  ['version', 'onTopic', 'steps'],
);
