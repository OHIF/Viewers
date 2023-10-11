const languagesMap = {
  ar: 'Arabic',
  am: 'Amharic',
  bg: 'Bulgarian',
  bn: 'Bengali',
  ca: 'Catalan',
  cs: 'Czech',
  da: 'Danish',
  de: 'German',
  el: 'Greek',
  en: 'English',
  'en-GB': 'English (Great Britain)',
  'en-US': 'English (USA)',
  es: 'Spanish',
  et: 'Estonian',
  fa: 'Persian',
  fi: 'Finnish',
  fil: 'Filipino',
  fr: 'French',
  gu: 'Gujarati',
  he: 'Hebrew',
  hi: 'Hindi',
  hr: 'Croatian',
  hu: 'Hungarian',
  id: 'Indonesian',
  it: 'Italian',
  ja: 'Japanese',
  'ja-JP': 'Japanese (Japan)',
  kn: 'Kannada',
  ko: 'Korean',
  lt: 'Lithuanian',
  lv: 'Latvian',
  ml: 'Malayalam',
  mr: 'Marathi',
  ms: 'Malay',
  nl: 'Dutch',
  no: 'Norwegian',
  pl: 'Polish',
  'pt-BR': 'Portuguese (Brazil)',
  'pt-PT': 'Portuguese (Portugal)',
  ro: 'Romanian',
  ru: 'Russian',
  sk: 'Slovak',
  sl: 'Slovenian',
  sr: 'Serbian',
  sv: 'Swedish',
  sw: 'Swahili',
  ta: 'Tamil',
  te: 'Telugu',
  th: 'Thai',
  tr: 'Turkish',
  'tr-TR': 'Turkish (Turkey)',
  uk: 'Ukrainian',
  vi: 'Vietnamese',
  zh: 'Chinese',
  'zh-CN': 'Chinese (China)',
  'zh-TW': 'Chinese (Taiwan)',
  'test-LNG': 'Test Language',
};

const getLanguageLabel = language => {
  return languagesMap[language];
};

export default function getAvailableLanguagesInfo(locales) {
  const availableLanguagesInfo = [];

  Object.keys(locales).forEach(key => {
    availableLanguagesInfo.push({
      value: key,
      label: getLanguageLabel(key) || key,
    });
  });

  return availableLanguagesInfo;
}

export { getAvailableLanguagesInfo, getLanguageLabel };
