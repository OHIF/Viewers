rm -rf src/locales/
cd src/locales/
npx locize --config-path ../../.locize download --ver latest
node ./writeLocaleIndexFiles.js
