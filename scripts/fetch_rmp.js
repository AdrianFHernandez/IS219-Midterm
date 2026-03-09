(async () => {
  try {
    const res = await fetch('https://www.ratemyprofessors.com/');
    console.log('Status:', res.status, res.statusText);
    const text = await res.text();
    console.log('\n--- Body snippet (first 1200 chars) ---\n');
    console.log(text.slice(0, 1200));
  } catch (err) {
    console.error('Fetch error:', err);
    process.exitCode = 1;
  }
})();
