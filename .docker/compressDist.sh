find platform/app/dist -name "*.js" -exec gzip -9 "{}" \; -exec touch "{}" \;
find platform/app/dist -name "*.map" -exec gzip -9 "{}" \; -exec touch "{}" \;
find platform/app/dist -name "*.css" -exec gzip -9 "{}" \; -exec touch "{}" \;
find platform/app/dist -name "*.svg" -exec gzip -9 "{}" \; -exec touch "{}" \;
