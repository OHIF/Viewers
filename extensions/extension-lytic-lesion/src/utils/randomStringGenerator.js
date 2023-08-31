function generateRandomString() {
  const characters = '0123456789abcdef';
  let randomString = '';

  for (let i = 0; i < 32; i++) {
    if (i === 8 || i === 13 || i === 18 || i === 23) {
      randomString += '-';
    } else {
      randomString += characters[Math.floor(Math.random() * characters.length)];
    }
  }

  return randomString;
}
