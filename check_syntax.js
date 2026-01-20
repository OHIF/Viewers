try {
  require('./platform/ui/tailwind.config.js');
  console.log('Syntax OK');
} catch (e) {
  console.error(e);
}
