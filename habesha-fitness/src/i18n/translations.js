// Translations for the PUBLIC website (landing, login, register) and the chat assistant.
// Languages: en = English, am = አማርኛ (Amharic), ti = ትግርኛ (Tigrinya).
//
// UI[lang][key]   -> fixed interface text. Supports {placeholders}.
// DATA[lang][en]  -> translations of sample content that comes from data (programs,
//                    plans, coaches…), looked up by its English text. Anything that is
//                    not listed (e.g. a plan you create yourself) is shown as typed.
//
// NOTE: Amharic and Tigrinya were written carefully but should be proof-read by a
// native speaker before real launch.

export const LANGUAGES = [
  { code: 'en', label: 'English', short: 'EN' },
  { code: 'am', label: 'አማርኛ', short: 'አማ' },
  { code: 'ti', label: 'ትግርኛ', short: 'ትግ' },
];

export const UI = {
  en: {
    navPrograms: 'Programs', navTrainers: 'Trainers', navMembership: 'Membership', navReviews: 'Reviews', navContact: 'Contact',
    login: 'Log in', join: 'Join now', dashboard: 'Dashboard', openDashboard: 'Open dashboard', menuOpen: 'Open menu', menuClose: 'Close menu',
    language: 'Language',
    heroEyebrow: '{gym} · Premium fitness club',
    heroA: 'TRANSFORM YOUR BODY.', heroB: 'ELEVATE YOUR LIFE.',
    heroText: "Professional coaching, world-class equipment and a community that pushes you further. Whether you're stepping into a gym for the first time or preparing for the stage, we build the plan around you.",
    joinNow: 'Join Now', explore: 'Explore Programs',
    point1: 'No joining fee', point2: 'Free orientation', point3: 'Cancel anytime',
    badgeTitle: '6 programs', badgeSub: 'for every goal',
    stat1: 'Active members', stat2: 'Expert coaches', stat3: 'Weekly classes', stat4: 'Years of results',
    progEyebrow: 'Featured programs', progTitle: 'Training built for your goal', progSub: 'Structured plans designed by our coaches, with clear schedules and progression.',
    progJoinAll: 'Join to access all 6 programs', weeksN: '{n} weeks', perWeek: '{n}×/week',
    teamEyebrow: 'Our team', teamTitle: "Coaches who've been where you want to go", yearsExp: '{n} years experience',
    plansEyebrow: 'Membership', plansTitle: 'Simple plans, no surprises', plansSub: 'Pick the plan that fits your routine. Upgrade or pause whenever you need.',
    popular: 'Most popular', perMonth: 'month', perMonths: '{n} months', getPlan: 'Get {name}',
    revEyebrow: 'Testimonials', revTitle: 'Real members, real progress', revNote: 'Sample testimonials for demonstration purposes.',
    ctaTitle: 'Your first session is on us.', ctaText: 'Create a free account and book your orientation with a coach.',
    footAbout: 'Premium strength and conditioning for people who take their training seriously.',
    footVisit: 'Visit us', footContact: 'Contact', footExplore: 'Explore', footLogin: 'Member / admin login',
    footRights: 'Demo website — sample content only.',
    authTagline: 'Stronger every day.', authSub: 'Manage members, coaches, workouts and payments from one premium dashboard.',
    backToSite: 'Back to website', demoTitle: 'Demo mode.', demoText: 'Authentication runs only in your browser and is not secure. Never enter a real password.',
    welcomeBack: 'Welcome back', loginSub: 'Log in to manage your gym.', newHere: 'New here?', createAccount: 'Create an account',
    demoAdmin: 'Demo admin', fillIn: 'Fill in', email: 'Email', password: 'Password', passwordPh: 'Your password', remember: 'Remember me',
    forgot: 'Forgot password?', loginBtn: 'Log in', resetTitle: 'Reset your password',
    resetText: 'Enter your account email. This is a simulation — no email will be sent.', sendReset: 'Send reset link', cancel: 'Cancel',
    welcomeToast: 'Welcome back!', resetToast: 'Demo only: no email was sent. In a real system a reset link would be emailed.',
    regTitle: 'Create your account', regSub: 'Join the club and start training.', fullName: 'Full name', phone: 'Phone number', gender: 'Gender',
    select: 'Select…', female: 'Female', male: 'Male', other: 'Other', pwPh: '8+ characters', pwHint: 'Letters and numbers',
    confirmPw: 'Confirm password', confirmPh: 'Repeat password', createBtn: 'Create account', haveAccount: 'Already have an account?', loginLink: 'Log in',
    regSuccess: 'Account created. Welcome to the club!',
    errEmailReq: 'Email is required', errEmail: 'Enter a valid email address', errPwReq: 'Password is required',
    errName: 'Enter your full name (at least 3 characters)', errPhone: 'Enter a valid phone number', errGender: 'Please select a gender',
    errMismatch: 'Passwords do not match',
    // chat
    chatTitle: 'Habesha Assistant', chatSub: 'Ask in English, አማርኛ or ትግርኛ', chatOpen: 'Open chat assistant', chatClose: 'Close chat',
    chatPlaceholder: 'Type your question…', chatSend: 'Send', chatNote: 'Automated assistant for common questions.',
  },

  am: {
    navPrograms: 'ፕሮግራሞች', navTrainers: 'አሰልጣኞች', navMembership: 'አባልነት', navReviews: 'አስተያየቶች', navContact: 'አድራሻ',
    login: 'ግባ', join: 'ተቀላቀል', dashboard: 'ዳሽቦርድ', openDashboard: 'ዳሽቦርድ ክፈት', menuOpen: 'ምናሌ ክፈት', menuClose: 'ምናሌ ዝጋ',
    language: 'ቋንቋ',
    heroEyebrow: '{gym} · ዘመናዊ የአካል ብቃት ማዕከል',
    heroA: 'አካልዎን ይቀይሩ።', heroB: 'ሕይወትዎን ያሳድጉ።',
    heroText: 'ሙያዊ ስልጠና፣ ዘመናዊ መሣሪያዎችና ወደ ፊት የሚገፋዎ ማኅበረሰብ። ጂም ለመጀመሪያ ጊዜ እየገቡም ይሁን ለውድድር እየተዘጋጁ፣ እቅዱን በእርስዎ ዙሪያ እንቀርጻለን።',
    joinNow: 'አሁን ይቀላቀሉ', explore: 'ፕሮግራሞችን ይመልከቱ',
    point1: 'የመመዝገቢያ ክፍያ የለም', point2: 'ነጻ ትውውቅ', point3: 'በማንኛውም ጊዜ ማቋረጥ ይቻላል',
    badgeTitle: '6 ፕሮግራሞች', badgeSub: 'ለእያንዳንዱ ግብ',
    stat1: 'ንቁ አባላት', stat2: 'ባለሙያ አሰልጣኞች', stat3: 'ሳምንታዊ ክፍሎች', stat4: 'የስኬት ዓመታት',
    progEyebrow: 'ተመራጭ ፕሮግራሞች', progTitle: 'ለግብዎ የተዘጋጀ ስልጠና', progSub: 'በአሰልጣኞቻችን የተዘጋጁ፣ ግልጽ መርሐ ግብርና ሂደት ያላቸው እቅዶች።',
    progJoinAll: 'ሁሉንም 6 ፕሮግራሞች ለማግኘት ይቀላቀሉ', weeksN: '{n} ሳምንታት', perWeek: '{n}×/በሳምንት',
    teamEyebrow: 'ቡድናችን', teamTitle: 'ሊደርሱበት የሚፈልጉት ደረጃ የደረሱ አሰልጣኞች', yearsExp: '{n} ዓመት ልምድ',
    plansEyebrow: 'አባልነት', plansTitle: 'ቀላል ዕቅዶች፣ ድብቅ ወጪ የለም', plansSub: 'ከአኗኗርዎ ጋር የሚሄደውን ዕቅድ ይምረጡ። በፈለጉት ጊዜ ማሻሻል ወይም ማቆም ይችላሉ።',
    popular: 'ተወዳጅ', perMonth: 'ወር', perMonths: '{n} ወራት', getPlan: '{name} ይውሰዱ',
    revEyebrow: 'አስተያየቶች', revTitle: 'እውነተኛ አባላት፣ እውነተኛ ለውጥ', revNote: 'ናሙና አስተያየቶች ለማሳያ ብቻ።',
    ctaTitle: 'የመጀመሪያ ስልጠናዎ በነጻ።', ctaText: 'ነጻ መለያ ይክፈቱና ከአሰልጣኝ ጋር የትውውቅ ቀጠሮ ይያዙ።',
    footAbout: 'ስልጠናቸውን በቁም ነገር ለሚይዙ ሰዎች ዘመናዊ የጥንካሬና የአካል ብቃት ማዕከል።',
    footVisit: 'ይጎብኙን', footContact: 'አድራሻ', footExplore: 'ያስሱ', footLogin: 'የአባል / አስተዳዳሪ መግቢያ',
    footRights: 'የማሳያ ድር ጣቢያ — ናሙና ይዘት ብቻ።',
    authTagline: 'በየቀኑ ይበልጥ ጠንካራ።', authSub: 'አባላትን፣ አሰልጣኞችን፣ ስልጠናዎችንና ክፍያዎችን ከአንድ ዘመናዊ ዳሽቦርድ ያስተዳድሩ።',
    backToSite: 'ወደ ድር ጣቢያው ተመለስ', demoTitle: 'የማሳያ ሁነታ።', demoText: 'ማረጋገጫው በአሳሽዎ ውስጥ ብቻ የሚሰራ ሲሆን ደህንነቱ የተጠበቀ አይደለም። እውነተኛ የይለፍ ቃልዎን በጭራሽ አያስገቡ።',
    welcomeBack: 'እንኳን በደህና ተመለሱ', loginSub: 'ጂምዎን ለማስተዳደር ይግቡ።', newHere: 'አዲስ ነዎት?', createAccount: 'መለያ ይክፈቱ',
    demoAdmin: 'የማሳያ አስተዳዳሪ', fillIn: 'ሙላ', email: 'ኢሜይል', password: 'የይለፍ ቃል', passwordPh: 'የይለፍ ቃልዎ', remember: 'አስታውሰኝ',
    forgot: 'የይለፍ ቃል ረሱ?', loginBtn: 'ግባ', resetTitle: 'የይለፍ ቃልዎን ዳግም ያስጀምሩ',
    resetText: 'የመለያዎን ኢሜይል ያስገቡ። ይህ ማስመሰያ ነው — ምንም ኢሜይል አይላክም።', sendReset: 'የማስጀመሪያ አገናኝ ላክ', cancel: 'ሰርዝ',
    welcomeToast: 'እንኳን ደህና መጡ!', resetToast: 'ለማሳያ ብቻ፦ ምንም ኢሜይል አልተላከም። በእውነተኛ ሥርዓት የማስጀመሪያ አገናኝ በኢሜይል ይላካል።',
    regTitle: 'መለያ ይክፈቱ', regSub: 'ክለቡን ይቀላቀሉና ስልጠና ይጀምሩ።', fullName: 'ሙሉ ስም', phone: 'ስልክ ቁጥር', gender: 'ፆታ',
    select: 'ይምረጡ…', female: 'ሴት', male: 'ወንድ', other: 'ሌላ', pwPh: 'ቢያንስ 8 ቁምፊዎች', pwHint: 'ፊደልና ቁጥር',
    confirmPw: 'የይለፍ ቃል ያረጋግጡ', confirmPh: 'የይለፍ ቃሉን ይድገሙ', createBtn: 'መለያ ክፈት', haveAccount: 'መለያ አለዎት?', loginLink: 'ይግቡ',
    regSuccess: 'መለያ ተፈጥሯል። ወደ ክለቡ እንኳን በደህና መጡ!',
    errEmailReq: 'ኢሜይል ያስፈልጋል', errEmail: 'ትክክለኛ ኢሜይል አድራሻ ያስገቡ', errPwReq: 'የይለፍ ቃል ያስፈልጋል',
    errName: 'ሙሉ ስምዎን ያስገቡ (ቢያንስ 3 ፊደላት)', errPhone: 'ትክክለኛ ስልክ ቁጥር ያስገቡ', errGender: 'እባክዎ ፆታ ይምረጡ',
    errMismatch: 'የይለፍ ቃሎቹ አይመሳሰሉም',
    chatTitle: 'የ Habesha ረዳት', chatSub: 'በእንግሊዝኛ፣ አማርኛ ወይም ትግርኛ ይጠይቁ', chatOpen: 'የውይይት ረዳት ክፈት', chatClose: 'ውይይቱን ዝጋ',
    chatPlaceholder: 'ጥያቄዎን ይጻፉ…', chatSend: 'ላክ', chatNote: 'ለተለመዱ ጥያቄዎች የሚመልስ አውቶማቲክ ረዳት።',
  },

  ti: {
    navPrograms: 'ፕሮግራማት', navTrainers: 'ኣሰልጠንቲ', navMembership: 'ኣባልነት', navReviews: 'ርእይቶታት', navContact: 'ርክብ',
    login: 'እቶ', join: 'ተሓወስ', dashboard: 'ዳሽቦርድ', openDashboard: 'ዳሽቦርድ ክፈት', menuOpen: 'ዝርዝር ክፈት', menuClose: 'ዝርዝር ዕጸው',
    language: 'ቋንቋ',
    heroEyebrow: '{gym} · ዘመናዊ ማእከል ኣካላዊ ብቕዓት',
    heroA: 'ኣካልኩም ቀይሩ።', heroB: 'ህይወትኩም ኣዕብዩ።',
    heroText: 'ሞያዊ ስልጠና፣ ዘመናዊ መሳሪሒታትን ንቕድሚት ዝድፍኣኩም ሕብረተሰብን። ንመጀመርታ ግዜ ናብ ጂም እትኣትዉ ዲኹም ወይ ንውድድር እትዳለዉ፣ እቲ መደብ ኣብ ዙርያኹም ንሰርሕ።',
    joinNow: 'ሕጂ ተሓወሱ', explore: 'ፕሮግራማት ርኣዩ',
    point1: 'ናይ ምዝገባ ክፍሊት የለን', point2: 'ነጻ ምልላይ', point3: 'ኣብ ዝደለኹምዎ እዋን ምቁራጽ ይከኣል',
    badgeTitle: '6 ፕሮግራማት', badgeSub: 'ንነፍሲ ወከፍ ዕላማ',
    stat1: 'ንጡፋት ኣባላት', stat2: 'ክኢላ ኣሰልጠንቲ', stat3: 'ሰሙናዊ ክፍልታት', stat4: 'ዓመታት ዓወት',
    progEyebrow: 'ዝተመረጹ ፕሮግራማት', progTitle: 'ንዕላማኹም ዝተዳለወ ስልጠና', progSub: 'ብኣሰልጠንትና ዝተዳለዉ፣ ንጹር ሰሌዳን ምዕባለን ዘለዎም መደባት።',
    progJoinAll: 'ንኹሎም 6 ፕሮግራማት ንምርካብ ተሓወሱ', weeksN: '{n} ሰሙናት', perWeek: '{n}×/ሰሙን',
    teamEyebrow: 'ጉጅለና', teamTitle: 'ናብ ዝደለኹምዎ ደረጃ ዝበጽሑ ኣሰልጠንቲ', yearsExp: '{n} ዓመት ተመክሮ',
    plansEyebrow: 'ኣባልነት', plansTitle: 'ቀሊል መደባት፣ ሕቡእ ወጻኢ የለን', plansSub: 'ምስ መስርሕ መዓልትኹም ዝሰማማዕ መደብ ምረጹ። ኣብ ዝደለኹምዎ እዋን ከተማዕብሉ ወይ ከተቋርጹ ትኽእሉ።',
    popular: 'ዝያዳ ዝተመረጸ', perMonth: 'ወርሒ', perMonths: '{n} ኣዋርሕ', getPlan: '{name} ውሰዱ',
    revEyebrow: 'ርእይቶታት', revTitle: 'ሓቀኛ ኣባላት፣ ሓቀኛ ለውጢ', revNote: 'ናሙና ርእይቶታት ንምርኣይ ጥራይ።',
    ctaTitle: 'ናይ መጀመርታ ስልጠናኹም ብነጻ።', ctaText: 'ነጻ ሕሳብ ክፈቱን ምስ ኣሰልጣኒ ናይ ምልላይ ቆጸራ ሓዙ።',
    footAbout: 'ስልጠኖም ብጥንቃቐ ንዝሕዙ ሰባት ዘመናዊ ናይ ጽንዓትን ኣካላዊ ብቕዓትን ማእከል።',
    footVisit: 'ብጽሑና', footContact: 'ርክብ', footExplore: 'ርኣዩ', footLogin: 'ናይ ኣባል / ኣመሓዳሪ መእተዊ',
    footRights: 'ናይ ምርኣይ ድረ-ገጽ — ናሙና ትሕዝቶ ጥራይ።',
    authTagline: 'ኣብ ነፍሲ ወከፍ መዓልቲ ዝያዳ ጽኑዕ።', authSub: 'ኣባላት፣ ኣሰልጠንቲ፣ ስልጠናታትን ክፍሊታትን ካብ ሓደ ዘመናዊ ዳሽቦርድ ኣመሓድሩ።',
    backToSite: 'ናብ ድረ-ገጽ ተመለስ', demoTitle: 'ናይ ምርኣይ ኩነታት።', demoText: 'ምርግጋጽ ኣብ ብሮውዘርኩም ጥራይ ይሰርሕ፣ ውሑስ ኣይኮነን። ሓቀኛ ቃል-ምስጢርኩም ፈጺምኩም ኣይተእትዉ።',
    welcomeBack: 'እንኳዕ ብደሓን ተመለስኩም', loginSub: 'ጂምኩም ንምምሕዳር እቶ።', newHere: 'ሓድሽ ዲኹም?', createAccount: 'ሕሳብ ክፈቱ',
    demoAdmin: 'ናይ ምርኣይ ኣመሓዳሪ', fillIn: 'ምላእ', email: 'ኢመይል', password: 'ቃል-ምስጢር', passwordPh: 'ቃል-ምስጢርኩም', remember: 'ዘክረኒ',
    forgot: 'ቃል-ምስጢር ረሲዕኩም?', loginBtn: 'እቶ', resetTitle: 'ቃል-ምስጢርኩም ዳግማይ ኣጀምሩ',
    resetText: 'ናይ ሕሳብኩም ኢመይል የእትዉ። እዚ ምስሊ ጥራይ እዩ — ዝለኣኸ ኢመይል የለን።', sendReset: 'ናይ ምሕዳስ ሊንክ ለኣኽ', cancel: 'ሰርዝ',
    welcomeToast: 'እንኳዕ ብደሓን መጻእኩም!', resetToast: 'ንምርኣይ ጥራይ፦ ዝተለኣኸ ኢመይል የለን። ኣብ ሓቀኛ ስርዓት ናይ ምሕዳስ ሊንክ ብኢመይል ይለኣኽ።',
    regTitle: 'ሕሳብ ክፈቱ', regSub: 'ንክለብ ተሓወሱን ስልጠና ጀምሩን።', fullName: 'ምሉእ ስም', phone: 'ቁጽሪ ተሌፎን', gender: 'ጾታ',
    select: 'ምረጹ…', female: 'ኣንስተይቲ', male: 'ተባዕታይ', other: 'ካልእ', pwPh: 'ብውሑዱ 8 ፊደላት', pwHint: 'ፊደላትን ቁጽርታትን',
    confirmPw: 'ቃል-ምስጢር ኣረጋግጹ', confirmPh: 'ቃል-ምስጢር ደጋግምዎ', createBtn: 'ሕሳብ ክፈት', haveAccount: 'ሕሳብ ኣሎኩም ዶ?', loginLink: 'እቶ',
    regSuccess: 'ሕሳብ ተፈጢሩ። ናብ ክለብ እንኳዕ ብደሓን መጻእኩም!',
    errEmailReq: 'ኢመይል የድሊ', errEmail: 'ቅኑዕ ናይ ኢመይል ኣድራሻ የእትዉ', errPwReq: 'ቃል-ምስጢር የድሊ',
    errName: 'ምሉእ ስምኩም የእትዉ (ብውሑዱ 3 ፊደላት)', errPhone: 'ቅኑዕ ቁጽሪ ተሌፎን የእትዉ', errGender: 'በጃኹም ጾታ ምረጹ',
    errMismatch: 'ቃላት-ምስጢር ኣይተመሳሰሉን',
    chatTitle: 'ናይ Habesha ሓጋዚ', chatSub: 'ብእንግሊዝኛ፣ ኣምሓርኛ ወይ ትግርኛ ሕተቱ', chatOpen: 'ናይ ዕላል ሓጋዚ ክፈት', chatClose: 'ዕላል ዕጸው',
    chatPlaceholder: 'ሕቶኹም ጽሓፉ…', chatSend: 'ለኣኽ', chatNote: 'ንተደጋጋሚ ሕቶታት ዝመልስ ኣውቶማቲክ ሓጋዚ።',
  },
};

// ---- Translations of data-driven English text -------------------------------------
export const DATA = {
  am: {
    // errors that come from the demo auth layer
    'Incorrect email or password.': 'ኢሜይሉ ወይም የይለፍ ቃሉ የተሳሳተ ነው።',
    'An account with this email already exists.': 'በዚህ ኢሜይል መለያ አስቀድሞ አለ።',
    'Use at least 8 characters': 'ቢያንስ 8 ቁምፊዎች ይጠቀሙ',
    'Include both letters and numbers': 'ፊደልና ቁጥር ያካትቱ',
    // contact info
    'Near Romanat Square, Mekelle, Tigray, Ethiopia': 'ሮማናት አደባባይ አቅራቢያ፣ መቀሌ፣ ትግራይ፣ ኢትዮጵያ',
    'Mon–Fri 5:00–23:00 · Sat–Sun 7:00–20:00': 'ሰኞ–አርብ 5:00–23:00 · ቅዳሜ–እሑድ 7:00–20:00',
    // levels
    Beginner: 'ጀማሪ', Intermediate: 'መካከለኛ', Advanced: 'ከፍተኛ',
    // programs
    'Muscle Building': 'ጡንቻ ግንባታ', 'Weight Loss': 'ክብደት መቀነስ', 'Strength Training': 'የጥንካሬ ስልጠና',
    'A hypertrophy-focused split built around progressive overload, controlled tempo and enough volume to add lean size week after week.':
      'ጡንቻን ለማሳደግ የተነደፈ፣ ቀስ በቀስ ጭነትን በመጨመር፣ በተቆጣጠረ ፍጥነትና በቂ የልምምድ መጠን ሳምንት በሳምንት የጡንቻ መጠንን የሚጨምር ክፍፍል።',
    'Strength circuits plus conditioning to raise daily energy expenditure while protecting muscle. Includes weekly check-ins with a coach.':
      'ጡንቻን እየጠበቁ ዕለታዊ የኃይል ፍጆታን ለመጨመር የጥንካሬ ዙሮችና የአካል ብቃት ልምምድ። ከአሰልጣኝ ጋር ሳምንታዊ ግምገማን ያካትታል።',
    'Heavy compound lifting on a wave-loaded plan to build raw strength in the squat, bench, deadlift and overhead press.':
      'በስኳት፣ በቤንች፣ በዴድሊፍትና በኦቨርሄድ ፕሬስ ጥሬ ጥንካሬን ለመገንባት የሚረዳ ከባድ የተቀናጀ ክብደት ማንሳት።',
    // plans
    Basic: 'መሠረታዊ', Standard: 'መደበኛ', Premium: 'ፕሪሚየም',
    'Full gym floor access': 'ሙሉ የጂም አዳራሽ አጠቃቀም', 'Locker room & showers': 'መቀየሪያ ክፍልና ሻወር', 'Free orientation session': 'ነጻ የትውውቅ ክፍለ ጊዜ',
    'Access to open cardio zone': 'ክፍት የካርዲዮ ቦታ አጠቃቀም', 'Everything in Basic': 'በመሠረታዊ ያሉት ሁሉ', 'Unlimited group classes': 'ያልተገደቡ የቡድን ክፍሎች',
    'Monthly body composition scan': 'ወርሃዊ የሰውነት ስብጥር ምርመራ', 'Workout program of your choice': 'የመረጡት የልምምድ ፕሮግራም', '1 guest pass per month': 'በወር 1 የእንግዳ መግቢያ',
    'Everything in Standard': 'በመደበኛ ያሉት ሁሉ', '4 personal training sessions / month': 'በወር 4 የግል ስልጠና ክፍለ ጊዜዎች', 'Nutrition coaching plan': 'የአመጋገብ ምክር ዕቅድ',
    'Sauna & recovery lounge': 'ሳውና እና የማገገሚያ ክፍል', 'Priority class booking': 'ቅድሚያ የክፍል ቦታ ማስያዝ', 'Free towel service': 'ነጻ የፎጣ አገልግሎት',
    // coaches
    'Bodybuilding & Hypertrophy': 'የሰውነት ግንባታ እና ጡንቻ ማሳደግ', 'Strength & Physique': 'ጥንካሬ እና የሰውነት ቅርጽ', 'Personal Training & Fat Loss': 'የግል ስልጠና እና ስብ መቀነስ',
    'Powerlifting & Conditioning': 'ፓወርሊፍቲንግ እና የአካል ብቃት', 'Cardio & Mobility': 'ካርዲዮ እና እንቅስቃሴ', 'Beginner Coaching': 'የጀማሪዎች ስልጠና',
    // testimonials
    'Member for 2 years': 'የ2 ዓመት አባል', 'Strength program': 'የጥንካሬ ፕሮግራም', 'Premium member': 'የፕሪሚየም አባል',
    'I came in to lose weight and stayed for the community. The coaches track my progress and keep me honest every single week.':
      'ክብደት ለመቀነስ መጥቼ ለማኅበረሰቡ ቀረሁ። አሰልጣኞቹ እድገቴን ይከታተላሉ፣ በየሳምንቱም በትክክለኛው መንገድ እንድቆይ ያደርጉኛል።',
    'The strength program changed how I train. My squat is up 40 kg and I finally understand proper technique.':
      'የጥንካሬ ፕሮግራሙ የምሰለጥንበትን መንገድ ቀይሮታል። ስኳቴ በ40 ኪ.ግ ጨምሯል፣ ትክክለኛውን ቴክኒክም በመጨረሻ ተረድቻለሁ።',
    'Premium is worth every cent — personal sessions, recovery lounge, and equipment that is always in great shape.':
      'ፕሪሚየም የከፈልኩትን ሁሉ ዋጋ አለው — የግል ክፍለ ጊዜዎች፣ የማገገሚያ ክፍልና ሁልጊዜ በጥሩ ሁኔታ ላይ ያሉ መሣሪያዎች።',
  },

  ti: {
    'Incorrect email or password.': 'ኢመይል ወይ ቃል-ምስጢር ጌጋ እዩ።',
    'An account with this email already exists.': 'ብዚ ኢመይል ሕሳብ ቅድሚ ሕጂ ኣሎ።',
    'Use at least 8 characters': 'ብውሑዱ 8 ፊደላት ተጠቐሙ',
    'Include both letters and numbers': 'ፊደላትን ቁጽርታትን ሓዙ',
    'Near Romanat Square, Mekelle, Tigray, Ethiopia': 'ኣብ ጥቓ ሮማናት ኣደባባይ፣ መቐለ፣ ትግራይ፣ ኢትዮጵያ',
    'Mon–Fri 5:00–23:00 · Sat–Sun 7:00–20:00': 'ሰኑይ–ዓርቢ 5:00–23:00 · ቀዳም–ሰንበት 7:00–20:00',
    Beginner: 'ጀማሪ', Intermediate: 'ማእከላይ', Advanced: 'ላዕለዋይ',
    'Muscle Building': 'ጭዋዳ ምህናጽ', 'Weight Loss': 'ክብደት ምቅናስ', 'Strength Training': 'ስልጠና ጽንዓት',
    'A hypertrophy-focused split built around progressive overload, controlled tempo and enough volume to add lean size week after week.':
      'ጭዋዳ ንምዕባይ ዝተዳለወ፣ ቀስ ብቐስ ጾር ብምውሳኽ፣ ብዝተቆጻጸረ ቅልጣፈን ብጥጡሕ መጠን ልምምድን ሰሙን ብሰሙን መጠን ጭዋዳ ዘዕቢ ምምቕራሕ።',
    'Strength circuits plus conditioning to raise daily energy expenditure while protecting muscle. Includes weekly check-ins with a coach.':
      'ጭዋዳ እናሕለዉ ናይ መዓልታዊ ሓይሊ ወጻኢ ንምውሳኽ ዝሕግዝ ናይ ጽንዓት ዙርያታትን ኣካላዊ ልምምድን። ምስ ኣሰልጣኒ ሰሙናዊ ምግምጋም ይሓዝ።',
    'Heavy compound lifting on a wave-loaded plan to build raw strength in the squat, bench, deadlift and overhead press.':
      'ኣብ ስኳት፣ ቤንች፣ ዴድሊፍትን ኦቨርሄድ ፕረስን ንጹር ጽንዓት ንምህናጽ ዝሕግዝ ክቡድ ሓፈሻዊ ክብደት ምእዳግ።',
    Basic: 'መሰረታዊ', Standard: 'ንቡር', Premium: 'ፕሪሚየም',
    'Full gym floor access': 'ምሉእ ናይ ጂም ኣዳራሽ ምጥቃም', 'Locker room & showers': 'ናይ ክዳን ምቕያር ክፍልን ሻወርን', 'Free orientation session': 'ነጻ ናይ ምልላይ ክፍለ-ግዜ',
    'Access to open cardio zone': 'ክፉት ናይ ካርዲዮ ቦታ ምጥቃም', 'Everything in Basic': 'ኣብ መሰረታዊ ዘለዉ ኩሎም', 'Unlimited group classes': 'ዘይተወሰኑ ናይ ጉጅለ ክፍልታት',
    'Monthly body composition scan': 'ወርሓዊ ናይ ኣካል ውዳበ ምርመራ', 'Workout program of your choice': 'ዝመረጽኩሞ ናይ ልምምድ ፕሮግራም', '1 guest pass per month': 'ኣብ ወርሒ 1 ናይ እንግዳ መእተዊ',
    'Everything in Standard': 'ኣብ ንቡር ዘለዉ ኩሎም', '4 personal training sessions / month': 'ኣብ ወርሒ 4 ናይ ውልቂ ስልጠና ክፍለ-ግዜታት', 'Nutrition coaching plan': 'ናይ ኣመጋግባ ምኽሪ መደብ',
    'Sauna & recovery lounge': 'ሳውናን ናይ ምምላስ ክፍልን', 'Priority class booking': 'ቀዳምነት ናይ ክፍሊ ቆጸራ', 'Free towel service': 'ነጻ ናይ ፎጣ ኣገልግሎት',
    'Bodybuilding & Hypertrophy': 'ምህናጽ ኣካልን ምዕባይ ጭዋዳን', 'Strength & Physique': 'ጽንዓትን ቅርጺ ኣካልን', 'Personal Training & Fat Loss': 'ውልቃዊ ስልጠናን ስብሒ ምቅናስን',
    'Powerlifting & Conditioning': 'ፓወርሊፍቲንግን ኣካላዊ ብቕዓትን', 'Cardio & Mobility': 'ካርዲዮን እንቅስቃስን', 'Beginner Coaching': 'ስልጠና ጀመርቲ',
    'Member for 2 years': 'ኣባል ንዓመታት 2', 'Strength program': 'ናይ ጽንዓት ፕሮግራም', 'Premium member': 'ናይ ፕሪሚየም ኣባል',
    'I came in to lose weight and stayed for the community. The coaches track my progress and keep me honest every single week.':
      'ክብደተይ ክቕንስ መጺኣ ንሕብረተሰብ ተሪፈ። ኣሰልጠንቲ ምዕባለይ ይከታተሉ፣ ነፍሲ ወከፍ ሰሙን ኣብ ቅኑዕ መንገዲ ከም ዝጸንሕ የገብሩኒ።',
    'The strength program changed how I train. My squat is up 40 kg and I finally understand proper technique.':
      'ናይ ጽንዓት ፕሮግራም ዝስልጥነሉ መንገዲ ቀይሩዎ። ስኳተይ ብ40 ኪ.ግ ወሲኹ፣ ቅኑዕ ቴክኒክ እውን ኣብ መወዳእታ ተረዲኤዮ።',
    'Premium is worth every cent — personal sessions, recovery lounge, and equipment that is always in great shape.':
      'ፕሪሚየም ዝኸፈልክዎ ዘበለ ዋጋ ኣለዎ — ውልቃዊ ክፍለ-ግዜታት፣ ናይ ምምላስ ክፍልን ኩሉ ግዜ ብጽቡቕ ኩነታት ዘለዉ መሳሪሒታትን።',
  },
};

/** Translate sample data text (by its English text) into a specific language. Unknown text is returned unchanged. */
export const trIn = (lang, text) => (lang === 'en' ? text : DATA[lang]?.[text] ?? text);
