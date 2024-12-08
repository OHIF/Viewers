find platform/app/dist -name "*.js" -exec gzip -9 "{}" \; -exec touch "{}" \;
