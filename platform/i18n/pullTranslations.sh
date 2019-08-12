rm -rf src/locales/
mkdir -p src/locales/
cd src/locales/
npx locize --config-path ../../.locize download --ver latest
cd ../../
node ./writeLocaleIndexFiles.js
