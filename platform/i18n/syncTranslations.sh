cd src/locales/
npx locize --config-path ../../.locize sync --ver latest --update-values true --reference-language-only false
cd ../../
node ./writeLocaleIndexFiles.js
