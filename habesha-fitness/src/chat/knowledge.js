// Habesha Fitness chat assistant — knowledge base and language detection.
//
// This is a rule-based FAQ assistant (no AI service, no internet needed). It reads the
// visitor's message, works out which language they wrote in, finds the best matching topic
// and answers in THAT language. Answers use live gym data (phone, address, hours, plans).
//
// To add a topic: add an entry to INTENTS with keywords (any language) and answers (en/am/ti).
// Placeholders available in answers: {gym} {phone} {email} {address} {hours} {plans}

// ---------- Language detection ----------
const GEEZ = /[ሀ-፿]/;

// Words that mostly appear in one of the two Ge'ez-script languages.
const TI_MARKERS = ['እንታይ', 'ከመይ', 'ኣብ ', 'ኣነ', 'ኣለኒ', 'ኣለኹ', 'ኣለዉ', 'ኣበይ', 'ብኸመይ', 'ሕጂ', 'ናይ ', 'እዩ', 'ዶ ', 'ዶ?', 'ኣይ', 'ክእቶ', 'ክምዝገብ', 'ምምዝጋብ', 'ምእታው', 'ቃል-ምስጢር', 'ቃል ምስጢር', 'ኢመይል', 'ተሌፎን', 'ክንደይ', 'መዓስ', 'ኣሰልጣኒ', 'ኣሰልጠንቲ', 'ትግርኛ', 'መቐለ', 'ሰሙን', 'ወርሒ', 'እኽእል', 'ኣይከኣልኩን', 'ኣይሰርሕን', 'ረሲዐ', 'ሕሳብ', 'ክሓዋወስ', 'ኣድራሻ', 'ዘለዉ', 'እንተ', 'ዋጋታት', 'ኣባልነት', 'ኣባላት', 'መደባት', 'ሰዓት ስራሕ', 'ስራሕ', 'ኣይከኣልን', 'ክኣቱ', 'ጂም ኣበይ'];
const AM_MARKERS = ['ምንድን', 'እንዴት', 'የት ', 'የት?', 'ነው', 'ነኝ', 'አለ ', 'አለኝ', 'ይችላል', 'ይቻላል', 'አልችልም', 'ልመዘገብ', 'መመዝገብ', 'መግባት', 'ለመግባት', 'የይለፍ', 'ረሳሁ', 'ረስቻለሁ', 'ስንት', 'መቼ', 'ምን ', 'ወር ', 'እኔ', 'አይሰራም', 'አድራሻ', 'ስልክ', 'አሰልጣኝ', 'አሰልጣኞች', 'አማርኛ', 'መቀሌ', 'ኢሜይል', 'እባክ', 'ክፍያ', 'አካውንት', 'ሳምንት', 'ልግባ', 'አልቻልኩም'];

const countHits = (text, list) => list.reduce((n, w) => n + (text.includes(w) ? 1 : 0), 0);

/** Returns 'en' | 'am' | 'ti'. Latin text → English. Ge'ez text → Amharic or Tigrinya. */
export function detectLanguage(text, uiLang = 'en') {
  if (!GEEZ.test(text)) return 'en';
  const padded = `${text} `;
  const ti = countHits(padded, TI_MARKERS);
  const am = countHits(padded, AM_MARKERS);
  if (ti > am) return 'ti';
  if (am > ti) return 'am';
  return uiLang === 'ti' ? 'ti' : 'am'; // tie → the language chosen in the dropdown (Amharic by default)
}

// ---------- Matching ----------
const normalize = (s) =>
  s.toLowerCase().replace(/[’‘`]/g, "'").replace(/[.,!?;:፣።፤፡፧"()\[\]]/g, ' ').replace(/\s+/g, ' ').trim();

// ---------- Topics ----------
// kw: keywords from all three languages. A multi-word keyword scores higher than a single word.
export const INTENTS = [
  {
    id: 'forgot', weight: 1.2,
    kw: ['forgot', 'forget', 'reset password', 'lost password', 'lost my password', 'ረሳሁ', 'ረስቻለሁ', 'ረሳሁት', 'ዳግም ማስጀመር', 'ረሲዐ', 'ረሲዐዮ', 'ረሲዐ', 'ኣይዘክርን', 'ኣይዝክርን'],
    a: {
      en: 'Forgot your password? On the Log in page, click “Forgot password?” under the password box and enter your email.\n\nIn this demo website no email is really sent. In the real system a reset link would be emailed to you. For help right now, please call us on {phone}.',
      am: 'የይለፍ ቃልዎን ረሱ? በመግቢያ ገጹ ላይ ከይለፍ ቃል መስኩ ስር “የይለፍ ቃል ረሱ?” የሚለውን ይጫኑና ኢሜይልዎን ያስገቡ።\n\nበዚህ የማሳያ ድር ጣቢያ ውስጥ ምንም ኢሜይል በእውነት አይላክም። በእውነተኛ ሥርዓት የማስጀመሪያ አገናኝ በኢሜይል ይላክልዎታል። አሁን እርዳታ ከፈለጉ በ {phone} ይደውሉልን።',
      ti: 'ቃል-ምስጢርኩም ረሲዕኩም? ኣብ መእተዊ ገጽ ኣብ ትሕቲ ቦታ ቃል-ምስጢር “ቃል-ምስጢር ረሲዕኩም?” ጠውቑን ኢመይልኩም የእትዉን።\n\nኣብዚ ናይ ምርኣይ ድረ-ገጽ ዝለኣኸ ኢመይል የለን። ኣብ ሓቀኛ ስርዓት ናይ ምሕዳስ ሊንክ ብኢመይል ይለኣኸልኩም። ሕጂ ሓገዝ እንተደሊኹም ብ {phone} ደውሉልና።',
    },
  },
  {
    id: 'register', weight: 1,
    kw: ['register', 'registration', 'sign up', 'signup', 'create account', 'create an account', 'new account', 'join', 'become a member', 'cannot register', "can't register", 'cant register', 'መመዝገብ', 'ለመመዝገብ', 'ምዝገባ', 'ልመዘገብ', 'መለያ', 'አካውንት', 'መቀላቀል', 'ለመቀላቀል', 'አልችልም መመዝገብ', 'ምምዝጋብ', 'ክምዝገብ', 'ተመዝገብ', 'ሕሳብ ክፈት', 'ሕሳብ', 'ክሓዋወስ', 'ምሕዋስ', 'ኣካውንት'],
    a: {
      en: 'To register:\n1. Tap “Join now” at the top of the page.\n2. Fill in your full name, email, phone number, gender and a password (8+ characters with letters AND numbers).\n3. Press “Create account”.\n\nIf you cannot continue, read the red message under each field. The most common problems are: an invalid email, letters in the phone number, a password without numbers, or two passwords that do not match. An email address can be used only once.\n\nStill stuck? Call us on {phone}.',
      am: 'ለመመዝገብ፦\n1. ከገጹ ላይ ያለውን “አሁን ይቀላቀሉ” ይጫኑ።\n2. ሙሉ ስምዎን፣ ኢሜይል፣ ስልክ ቁጥር፣ ፆታና የይለፍ ቃል (ቢያንስ 8 ቁምፊዎች፣ ፊደልና ቁጥር የያዘ) ይሙሉ።\n3. “መለያ ክፈት” ይጫኑ።\n\nመቀጠል ካልቻሉ ከእያንዳንዱ መስክ ስር ያለውን ቀይ መልዕክት ያንብቡ። ብዙ ጊዜ የሚከሰቱ ችግሮች፦ የተሳሳተ ኢሜይል፣ ፊደል ያለው ስልክ ቁጥር፣ ቁጥር የሌለው የይለፍ ቃል ወይም የማይመሳሰሉ ሁለት የይለፍ ቃሎች ናቸው። አንድ ኢሜይል አድራሻ አንድ ጊዜ ብቻ መጠቀም ይቻላል።\n\nአሁንም ካልተሳካ በ {phone} ይደውሉልን።',
      ti: 'ንምምዝጋብ፦\n1. ኣብ ላዕሊ ዘሎ “ሕጂ ተሓወሱ” ጠውቑ።\n2. ምሉእ ስምኩም፣ ኢመይል፣ ቁጽሪ ተሌፎን፣ ጾታን ቃል-ምስጢርን (ብውሑዱ 8 ፊደላት፣ ፊደላትን ቁጽርታትን ዝሓዘ) ምልኡ።\n3. “ሕሳብ ክፈት” ጠውቑ።\n\nክትቅጽሉ እንተዘይከኣልኩም ኣብ ትሕቲ ነፍሲ ወከፍ ቦታ ዘሎ ቀዪሕ መልእኽቲ ኣንብቡ። ብዙሕ ግዜ ዚርከቡ ጸገማት፦ ጌጋ ኢመይል፣ ፊደላት ዘለዎ ቁጽሪ ተሌፎን፣ ቁጽሪ ዘይብሉ ቃል-ምስጢር ወይ ክልተ ዘይመሳሰሉ ቃላት-ምስጢር እዮም። ሓደ ኢመይል ሓደ ግዜ ጥራይ ይጥቀም።\n\nጸገም እንተሃልዩ ብ {phone} ደውሉልና።',
    },
  },
  {
    id: 'login', weight: 1,
    kw: ['login', 'log in', 'sign in', 'signin', 'cannot login', "can't login", 'cant login', 'cannot log in', "can't log in", 'password', 'credentials', 'demo', 'access my account', 'መግባት', 'ለመግባት', 'ልግባ', 'አልችልም መግባት', 'አልቻልኩም', 'የይለፍ ቃል', 'ግባ', 'ምእታው', 'ክኣቱ', 'እቶ', 'ኣይክእትን', 'ቃል-ምስጢር', 'ቃል ምስጢር'],
    a: {
      en: 'To log in: open “Log in” at the top, type the email and password you registered with, and press “Log in”.\n\n• Use the eye icon to show or hide your password.\n• Passwords are case-sensitive (A and a are different).\n• No account yet? Register first.\n• To try the demo, press “Fill in” on the login page (admin@habesha.demo / Admin1234).\n• If you forgot your password, just write “I forgot my password”.\n\nThis is a demo: accounts are stored only in your own browser, so use the same browser you registered in.',
      am: 'ለመግባት፦ ከላይ “ግባ” የሚለውን ይክፈቱ፣ የተመዘገቡበትን ኢሜይልና የይለፍ ቃል ያስገቡና “ግባ” ይጫኑ።\n\n• የይለፍ ቃልዎን ለማሳየት ወይም ለመደበቅ የዐይኑን ምልክት ይጠቀሙ።\n• የይለፍ ቃል ትልቅና ትንሽ ፊደልን ይለያል (A እና a የተለያዩ ናቸው)።\n• እስካሁን መለያ የለዎትም? መጀመሪያ ይመዝገቡ።\n• ማሳያውን ለመሞከር በመግቢያ ገጹ “ሙላ” ይጫኑ (admin@habesha.demo / Admin1234)።\n• የይለፍ ቃልዎን ከረሱ “የይለፍ ቃሌን ረሳሁ” ብለው ይጻፉ።\n\nይህ ማሳያ ነው፦ መለያዎች የሚቀመጡት በእርስዎ አሳሽ ውስጥ ብቻ ስለሆነ የተመዘገቡበትን ተመሳሳይ አሳሽ ይጠቀሙ።',
      ti: 'ንምእታው፦ ኣብ ላዕሊ “እቶ” ክፈቱ፣ ዝተመዝገብኩምሉ ኢመይልን ቃል-ምስጢርን የእትዉን “እቶ” ጠውቑን።\n\n• ቃል-ምስጢርኩም ንምርኣይ ወይ ንምሕባእ ምልክት ዓይኒ ተጠቐሙ።\n• ቃል-ምስጢር ዓቢን ንእሽቶን ፊደል ይፈሊ (A ከምኡ a ዝተፈለዩ እዮም)።\n• ኣብ ሕጂ ሕሳብ የብልኩምን? ቅድም ተመዝገቡ።\n• ናይ ምርኣይ ንምፍታን ኣብ መእተዊ ገጽ “ምላእ” ጠውቑ (admin@habesha.demo / Admin1234)።\n• ቃል-ምስጢርኩም ረሲዕኩም እንተኾንኩም “ቃል-ምስጢረይ ረሲዐ” ኢልኩም ጽሓፉ።\n\nእዚ ናይ ምርኣይ እዩ፦ ሕሳባት ኣብ ብሮውዘርኩም ጥራይ ስለ ዝተቐምጡ ዝተመዝገብኩምሉ ተመሳሳሊ ብሮውዘር ተጠቐሙ።',
    },
  },
  {
    id: 'plans', weight: 1,
    kw: ['price', 'prices', 'plan', 'plans', 'cost', 'how much', 'fee', 'fees', 'membership', 'subscription', 'basic', 'standard', 'premium', 'cheap', 'ዋጋ', 'ስንት', 'ዕቅድ', 'ፕላን', 'አባልነት', 'ክፍያ ስንት', 'ዋጋው', 'ክንደይ', 'መደብ', 'ኣባልነት', 'ፕሪሚየም', 'ዋጋኡ', 'ክፍሊት ክንደይ'],
    a: {
      en: 'Our membership plans:\n{plans}\n\nThese are sample demo prices. Your first session is free and there is no joining fee. Choose a plan in the Membership section of the home page, then register to get started.',
      am: 'የአባልነት ዕቅዶቻችን፦\n{plans}\n\nእነዚህ የማሳያ ናሙና ዋጋዎች ናቸው። የመጀመሪያ ስልጠናዎ ነጻ ነው፣ የመመዝገቢያ ክፍያም የለም። በመነሻ ገጹ የአባልነት ክፍል ዕቅድ ይምረጡና ለመጀመር ይመዝገቡ።',
      ti: 'መደባት ኣባልነትና፦\n{plans}\n\nእዚኦም ናይ ምርኣይ ናሙና ዋጋታት እዮም። ናይ መጀመርታ ስልጠናኹም ነጻ እዩ፣ ናይ ምዝገባ ክፍሊትውን የለን። ኣብ ናይ ኣባልነት ክፍሊ ቀዳማይ ገጽ መደብ ምረጹን ንምጅማር ተመዝገቡን።',
    },
  },
  {
    id: 'hours', weight: 1,
    kw: ['hour', 'hours', 'open', 'opening', 'close', 'closing', 'what time', 'schedule', 'ሰዓት', 'ስንት ሰዓት', 'ክፍት', 'ይከፈታል', 'ይዘጋል', 'የስራ ሰዓት', 'የሥራ ሰዓት', 'መቼ ', 'ክፉት', 'ይኽፈት', 'ይዕጾ', 'ሰዓት ስራሕ', 'መዓስ'],
    a: {
      en: 'Opening hours:\n{hours}\n\nYou can find us at: {address}.',
      am: 'የሥራ ሰዓት፦\n{hours}\n\nየምናገኘው በ፦ {address}።',
      ti: 'ሰዓት ስራሕ፦\n{hours}\n\nኣድራሻና፦ {address}።',
    },
  },
  {
    id: 'location', weight: 1,
    kw: ['where', 'location', 'address', 'directions', 'find you', 'located', 'mekelle', 'mekele', 'tigray', 'map', 'የት', 'የት ነው', 'አድራሻ', 'መቀሌ', 'ትግራይ', 'ቦታ', 'አካባቢ', 'ኣበይ', 'ኣድራሻ', 'መቐለ', 'ቦታ', 'ኣበይ ኣለኹም'],
    a: {
      en: 'We are in Mekelle, Tigray:\n📍 {address}\n🕐 {hours}\n📞 {phone}',
      am: 'የምንገኘው በመቀሌ፣ ትግራይ ነው፦\n📍 {address}\n🕐 {hours}\n📞 {phone}',
      ti: 'ኣብ መቐለ፣ ትግራይ ኢና ንርከብ፦\n📍 {address}\n🕐 {hours}\n📞 {phone}',
    },
  },
  {
    id: 'contact', weight: 1,
    kw: ['phone', 'call', 'contact', 'email', 'number', 'reach', 'telephone', 'whatsapp', 'ስልክ', 'ቁጥራ', 'ደውል', 'ለማግኘት', 'ኢሜይል', 'ያግኙን', 'ቁጥር', 'ተሌፎን', 'ስልኪ', 'ርክብ', 'ኢመይል', 'ደውሉ', 'ቁጽሪ', 'ንምርካብ'],
    a: {
      en: 'You can contact {gym}:\n📞 Phone: {phone}\n✉️ Email: {email}\n📍 {address}\n🕐 {hours}',
      am: '{gym}ን ማግኘት ይችላሉ፦\n📞 ስልክ፦ {phone}\n✉️ ኢሜይል፦ {email}\n📍 {address}\n🕐 {hours}',
      ti: 'ንሕና {gym} ክትረኽቡና ትኽእሉ፦\n📞 ተሌፎን፦ {phone}\n✉️ ኢመይል፦ {email}\n📍 {address}\n🕐 {hours}',
    },
  },
  {
    id: 'trainers', weight: 1,
    kw: ['trainer', 'trainers', 'coach', 'coaches', 'personal trainer', 'instructor', 'አሰልጣኝ', 'አሰልጣኞች', 'አሰልጣኝ ማግኘት', 'ኣሰልጣኒ', 'ኣሰልጠንቲ', 'ኣሰልጣኒ'],
    a: {
      en: 'We have experienced coaches in bodybuilding, strength, fat loss, cardio and beginner coaching. See the “Trainers” section on the home page. Premium members also get 4 personal training sessions per month, and every new member gets a free orientation with a coach.',
      am: 'በሰውነት ግንባታ፣ በጥንካሬ፣ በስብ መቀነስ፣ በካርዲዮና በጀማሪዎች ስልጠና ልምድ ያላቸው አሰልጣኞች አሉን። በመነሻ ገጹ “አሰልጣኞች” ክፍል ይመልከቱ። የፕሪሚየም አባላት በወር 4 የግል ስልጠና ክፍለ ጊዜ ያገኛሉ፣ እያንዳንዱ አዲስ አባልም ከአሰልጣኝ ጋር ነጻ ትውውቅ ያገኛል።',
      ti: 'ኣብ ምህናጽ ኣካል፣ ጽንዓት፣ ስብሒ ምቅናስ፣ ካርዲዮን ስልጠና ጀመርትን ተመክሮ ዘለዎም ኣሰልጠንቲ ኣለዉና። ኣብ ቀዳማይ ገጽ ክፍሊ “ኣሰልጠንቲ” ርኣዩ። ኣባላት ፕሪሚየም ኣብ ወርሒ 4 ናይ ውልቂ ስልጠና ክፍለ-ግዜ ይረኽቡ፣ ነፍሲ ወከፍ ሓድሽ ኣባል እውን ምስ ኣሰልጣኒ ነጻ ምልላይ ይረክብ።',
    },
  },
  {
    id: 'programs', weight: 1,
    kw: ['program', 'programs', 'workout', 'workouts', 'exercise', 'training', 'muscle', 'weight loss', 'lose weight', 'cardio', 'strength', 'beginner', 'bodybuilding', 'ፕሮግራም', 'ፕሮግራሞች', 'ስልጠና', 'ጡንቻ', 'ክብደት', 'ልምምድ', 'ጀማሪ', 'ካርዲዮ', 'ፕሮግራማት', 'ጭዋዳ', 'ክብደት ምቅናስ', 'ጀመርቲ', 'ምህናጽ'],
    a: {
      en: 'We offer 6 programs: Muscle Building, Weight Loss, Strength Training, Cardio Fitness, Beginner Training and Advanced Bodybuilding. Each has a weekly schedule and an exercise list, which members can see after registering. If you are new, start with Beginner Training — a coach will help you choose in your free orientation.',
      am: '6 ፕሮግራሞች አሉን፦ ጡንቻ ግንባታ፣ ክብደት መቀነስ፣ የጥንካሬ ስልጠና፣ የካርዲዮ ብቃት፣ የጀማሪዎች ስልጠና እና ከፍተኛ የሰውነት ግንባታ። እያንዳንዳቸው ሳምንታዊ መርሐ ግብርና የልምምድ ዝርዝር አላቸው፣ አባላት ከተመዘገቡ በኋላ ማየት ይችላሉ። አዲስ ከሆኑ በጀማሪዎች ስልጠና ይጀምሩ — በነጻ ትውውቅዎ ወቅት አሰልጣኝ ይመርጥልዎታል።',
      ti: '6 ፕሮግራማት ኣለዉና፦ ጭዋዳ ምህናጽ፣ ክብደት ምቅናስ፣ ስልጠና ጽንዓት፣ ካርዲዮ፣ ስልጠና ጀመርትን ላዕለዋይ ምህናጽ ኣካልን። ነፍሲ ወከፎም ሰሙናዊ ሰሌዳን ዝርዝር ልምምድን ኣለዎም፣ ኣባላት ድሕሪ ምምዝጋብ ከርእዩ ይኽእሉ። ሓድሽ እንተኾንኩም ብስልጠና ጀመርቲ ጀምሩ — ኣብ ነጻ ምልላይኩም ኣሰልጣኒ ክሕግዘኩም እዩ።',
    },
  },
  {
    id: 'payment', weight: 1,
    kw: ['pay', 'payment', 'payments', 'card', 'cash', 'bank', 'transfer', 'telebirr', 'invoice', 'receipt', 'ክፍያ', 'መክፈል', 'ለመክፈል', 'ደረሰኝ', 'ባንክ', 'ክፍሊት', 'ምኽፋል', 'ንምኽፋል', 'ቴሌብር'],
    a: {
      en: 'On this demo website payments are only simulated — no real money is taken online and no card or bank details are collected. To pay for a membership, please contact the gym directly on {phone}.',
      am: 'በዚህ የማሳያ ድር ጣቢያ ክፍያዎች የሚመሰሉ ብቻ ናቸው — በመስመር ላይ እውነተኛ ገንዘብ አይወሰድም፣ የካርድም ሆነ የባንክ መረጃ አይሰበሰብም። ለአባልነት ለመክፈል እባክዎ ጂሙን በቀጥታ በ {phone} ያግኙ።',
      ti: 'ኣብዚ ናይ ምርኣይ ድረ-ገጽ ክፍሊታት ምስሊ ጥራይ እዮም — ኣብ መስመር ሓቀኛ ገንዘብ ኣይውሰድን፣ ሓበሬታ ካርድ ወይ ባንክ እውን ኣይእከብን። ንኣባልነት ንምኽፋል በጃኹም ንጂም ብቀጥታ ብ {phone} ርከቡ።',
    },
  },
  {
    id: 'free', weight: 1,
    kw: ['free', 'trial', 'orientation', 'first session', 'discount', 'no joining fee', 'ነጻ', 'ነፃ', 'ትውውቅ', 'ቅናሽ', 'ነጻ ስልጠና', 'ምልላይ', 'ብነጻ'],
    a: {
      en: 'Yes! Your first session is free, and there is no joining fee. Create a free account and book your orientation with a coach. You can cancel anytime.',
      am: 'አዎ! የመጀመሪያ ስልጠናዎ ነጻ ነው፣ የመመዝገቢያ ክፍያም የለም። ነጻ መለያ ይክፈቱና ከአሰልጣኝ ጋር የትውውቅ ቀጠሮ ይያዙ። በማንኛውም ጊዜ ማቋረጥ ይችላሉ።',
      ti: 'እወ! ናይ መጀመርታ ስልጠናኹም ነጻ እዩ፣ ናይ ምዝገባ ክፍሊትውን የለን። ነጻ ሕሳብ ክፈቱን ምስ ኣሰልጣኒ ናይ ምልላይ ቆጸራ ሓዙን። ኣብ ዝደለኹምዎ እዋን ከተቋርጹ ትኽእሉ።',
    },
  },
  {
    id: 'language', weight: 1,
    kw: ['language', 'languages', 'amharic', 'tigrinya', 'tigrigna', 'english', 'translate', 'translation', 'ቋንቋ', 'አማርኛ', 'ትግርኛ', 'እንግሊዝኛ', 'ኣምሓርኛ', 'እንግሊዝኛ', 'ትርጉም'],
    a: {
      en: 'You can change the website language with the small menu at the top of the page: English, አማርኛ (Amharic) or ትግርኛ (Tigrinya). In this chat you can write in any of the three languages and I will answer in the language you use.',
      am: 'የድር ጣቢያውን ቋንቋ በገጹ ላይኛ ክፍል ባለው ትንሽ ምናሌ መቀየር ይችላሉ፦ English፣ አማርኛ ወይም ትግርኛ። በዚህ ውይይት ከሦስቱ ቋንቋዎች በማንኛውም መጻፍ ይችላሉ፣ እኔም በተጠቀሙት ቋንቋ እመልሳለሁ።',
      ti: 'ቋንቋ ድረ-ገጽ ኣብ ላዕለዋይ ክፍሊ ገጽ ብዘሎ ንእሽቶ ዝርዝር ክትቕይርዎ ትኽእሉ፦ English፣ አማርኛ ወይ ትግርኛ። ኣብዚ ዕላል ካብ እዞም ሰለስተ ቋንቋታት ብዝደለኹምዎ ክትጽሕፉ ትኽእሉ፣ ኣነ እውን ብዝተጠቐምኩምሉ ቋንቋ ከምልስ እየ።',
    },
  },
  {
    id: 'about', weight: 0.9,
    kw: ['website', 'system', 'dashboard', 'admin', 'what is this', 'what can', 'how does it work', 'features', 'ድር ጣቢያ', 'ሲስተም', 'ዳሽቦርድ', 'አስተዳዳሪ', 'ድረ-ገጽ', 'ኣመሓዳሪ'],
    a: {
      en: 'This is the website of {gym}. Visitors can read about our programs, coaches and plans, register and log in. After logging in, the gym team uses the dashboard to manage members, trainers, membership plans, workouts, attendance, payments and reports. It is a demo: all data stays in your own browser.',
      am: 'ይህ የ{gym} ድር ጣቢያ ነው። ጎብኚዎች ስለ ፕሮግራሞቻችን፣ አሰልጣኞቻችንና ዕቅዶቻችን ማንበብ፣ መመዝገብና መግባት ይችላሉ። ከገቡ በኋላ የጂም ቡድኑ ዳሽቦርዱን በመጠቀም አባላትን፣ አሰልጣኞችን፣ የአባልነት ዕቅዶችን፣ ስልጠናዎችን፣ ተገኝነትን፣ ክፍያዎችንና ሪፖርቶችን ያስተዳድራል። ይህ ማሳያ ነው፦ ሁሉም መረጃ በእርስዎ አሳሽ ውስጥ ብቻ ይቀመጣል።',
      ti: 'እዚ ናይ {gym} ድረ-ገጽ እዩ። በጻሕቲ ብዛዕባ ፕሮግራማትና፣ ኣሰልጠንትናን መደባትናን ከንብቡ፣ ክምዝገቡን ክኣትዉን ይኽእሉ። ድሕሪ ምእታው ጉጅለ ጂም ዳሽቦርድ ተጠቒሙ ኣባላት፣ ኣሰልጠንቲ፣ መደባት ኣባልነት፣ ስልጠናታት፣ ተሳትፎ፣ ክፍሊታትን ጸብጻባትን የመሓድር። እዚ ናይ ምርኣይ እዩ፦ ኩሉ ሓበሬታ ኣብ ብሮውዘርኩም ጥራይ ይጸንሕ።',
    },
  },
  {
    id: 'thanks', weight: 0.8,
    kw: ['thanks', 'thank you', 'thank u', 'thx', 'great', 'ok thanks', 'አመሰግናለሁ', 'እናመሰግናለን', 'አመሰግናለው', 'አመሰግናለን', 'የቐንየለይ', 'የቐንየልና', 'የቐንየልካ', 'የቐንየልኪ', 'የቐንየልኩም', 'ኣመስግን'],
    a: {
      en: "You're welcome! 💪 Ask me anything else about {gym}.",
      am: 'ምንም አይደለም! 💪 ስለ {gym} ሌላ የሚፈልጉትን ይጠይቁኝ።',
      ti: 'ኣብ ሓገዝ! 💪 ብዛዕባ {gym} ካልእ ዝደለኹምዎ ሕተቱኒ።',
    },
  },
  {
    id: 'greeting', weight: 0.5,
    kw: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'greetings', 'ሰላም', 'ታዲያስ', 'ጤና ይስጥልኝ', 'እንደምን', 'ሰላምታ', 'ከመይ ኣለኹም', 'ከመይ ኣሎኹም', 'ከመይ', 'ደሓን'],
    a: {
      en: "Hello! 👋 I'm the {gym} assistant. Ask me about registering, logging in, membership plans, opening hours, location or trainers — in English, አማርኛ or ትግርኛ.",
      am: 'ሰላም! 👋 እኔ የ{gym} ረዳት ነኝ። ስለ መመዝገብ፣ መግባት፣ የአባልነት ዕቅዶች፣ የሥራ ሰዓት፣ አድራሻ ወይም አሰልጣኞች በእንግሊዝኛ፣ በአማርኛ ወይም በትግርኛ ይጠይቁኝ።',
      ti: 'ሰላም! 👋 ኣነ ናይ {gym} ሓጋዚ እየ። ብዛዕባ ምምዝጋብ፣ ምእታው፣ መደባት ኣባልነት፣ ሰዓት ስራሕ፣ ኣድራሻ ወይ ኣሰልጠንቲ ብእንግሊዝኛ፣ ብኣምሓርኛ ወይ ብትግርኛ ሕተቱኒ።',
    },
  },
];

export const FALLBACK = {
  en: "Sorry, I didn't fully understand that. I can help with: registering, logging in, membership plans & prices, opening hours, location, contact, trainers and programs. You can also call us on {phone}.",
  am: 'ይቅርታ፣ ጥያቄዎን በሚገባ አልተረዳሁም። በእነዚህ ልረዳዎ እችላለሁ፦ መመዝገብ፣ መግባት፣ የአባልነት ዕቅዶችና ዋጋዎች፣ የሥራ ሰዓት፣ አድራሻ፣ ግንኙነት፣ አሰልጣኞችና ፕሮግራሞች። እንዲሁም በ {phone} ይደውሉልን።',
  ti: 'ይቕሬታ፣ ሕቶኹም ብዝግባእ ኣይተረዳእኩን። ኣብዞም ክሕግዘኩም እኽእል እየ፦ ምምዝጋብ፣ ምእታው፣ መደባትን ዋጋታትን ኣባልነት፣ ሰዓት ስራሕ፣ ኣድራሻ፣ ርክብ፣ ኣሰልጠንትን ፕሮግራማትን። ብ {phone} እውን ደውሉልና።',
};

// Suggested questions shown as buttons.
export const SUGGESTIONS = {
  en: ['How do I register?', "I can't log in", 'Membership prices', 'Opening hours', 'Where are you?'],
  am: ['እንዴት መመዝገብ እችላለሁ?', 'መግባት አልቻልኩም', 'የአባልነት ዋጋዎች', 'የሥራ ሰዓት', 'አድራሻችሁ የት ነው?'],
  ti: ['ከመይ ክምዝገብ እኽእል?', 'ክኣቱ ኣይከኣልኩን', 'ዋጋታት ኣባልነት', 'ሰዓት ስራሕ', 'ኣድራሻኹም ኣበይ እዩ?'],
};

/** Fill {placeholders} using live gym data. */
export function fillAnswer(text, ctx) {
  return text.replace(/\{(\w+)\}/g, (_, k) => ctx[k] ?? `{${k}}`);
}

/** Pick the best topic for a message (null when nothing matches). */
export function findIntent(message) {
  const text = ` ${normalize(message)} `;
  let best = null;
  let bestScore = 0;
  for (const intent of INTENTS) {
    let score = 0;
    for (const raw of intent.kw) {
      const k = normalize(raw);
      if (!k) continue;
      const isLatin = /^[a-z' ]+$/.test(k);
      // Latin keywords must match whole words ("hi" must not match "this"); Ge'ez matches as substring.
      const hit = isLatin ? text.includes(` ${k} `) || text.includes(` ${k}s `) : text.includes(k);
      if (hit) score += k.includes(' ') ? 2 : 1;
    }
    score *= intent.weight;
    if (score > bestScore) { best = intent; bestScore = score; }
  }
  return best;
}

/**
 * Main entry. Returns { lang, text, intent }.
 *  - forceLang: use this language (for suggestion buttons, whose language is already known)
 *  - getCtx(lang): returns the live gym data for that language
 */
export function answer(message, { uiLang = 'en', forceLang, getCtx }) {
  const lang = forceLang || detectLanguage(message, uiLang);
  const intent = findIntent(message);
  const raw = intent ? intent.a[lang] : FALLBACK[lang];
  return { lang, text: fillAnswer(raw, getCtx(lang)), intent: intent?.id ?? null };
}

// ---------- Should an external AI answer this? ----------
// Used only when the website is connected to the backend (VITE_API_URL). Questions about fitness,
// nutrition, health and sport go to the AI; questions about the gym itself (prices, hours,
// registering...) stay with the built-in answers, which are exact and free.
const FIT_LATIN = /\b(protein|diet|diets|calorie|calories|carb|carbs|nutrition|supplement|supplements|creatine|muscle|muscles|bulk|bulking|fat|stretch|stretching|injury|injured|pain|sore|soreness|recovery|recover|sleep|squat|squats|deadlift|bench|cardio|hiit|exercise|exercises|warm up|warmup|reps|sets|abs|healthy|eat|eating|food|meal|meals|breakfast|hydration|water|running|yoga|football|soccer|sport|sports|marathon|vitamin|vitamins|stamina|flexibility|posture|how to lose weight|weight loss|lose weight|gain weight)\b/i;
const GYM_LATIN = /\b(price|prices|cost|costs|plan|plans|membership|register|registration|sign up|signup|login|log in|password|account|hours|open|opening|close|closing|address|location|where|phone|call|contact|email|trainer|trainers|coach|coaches|program|programs|join|free|trial|pay|payment|dashboard|website|language)\b/i;
const FIT_GEEZ = ['ፕሮቲን', 'ካሎሪ', 'ምግብ', 'ምግቢ', 'መብላት', 'ምብላዕ', 'ብላዕ', 'ጡንቻ', 'ክብደት', 'ህመም', 'ሕማም', 'ጉዳት', 'ጉድኣት', 'እንቅልፍ', 'ድቃስ', 'ስፖርት', 'ውሃ', 'ቫይታሚን', 'ማሞቅ', 'ዝርጋታ', 'ጤና', 'ጥዕና'];
const GYM_GEEZ = ['ዋጋ', 'ዕቅድ', 'መደብ', 'አባል', 'ኣባል', 'መመዝገብ', 'ምምዝጋብ', 'መግባት', 'ምእታው', 'የይለፍ', 'ቃል-ምስጢር', 'ሰዓት', 'አድራሻ', 'ኣድራሻ', 'ስልክ', 'ተሌፎን', 'አሰልጣኝ', 'ኣሰልጣኒ', 'ፕሮግራም', 'ነጻ', 'ክፍያ', 'ኣታዊ'];

/** true when the message is a general fitness/health/sport question that is not about the gym itself. */
export function wantsAI(message) {
  const text = message.toLowerCase();
  const fit = FIT_LATIN.test(text) || FIT_GEEZ.some((w) => text.includes(w));
  const gym = GYM_LATIN.test(text) || GYM_GEEZ.some((w) => text.includes(w));
  return fit && !gym;
}
