async function main() {
  try {
    const res = await fetch('http://localhost:3000/api/admin/deposit-settings');
    const data = await res.json();
    console.log('Local Server Status:', res.status);
    console.log('Local Server Response:', JSON.stringify(data, null, 2));
  } catch (err) {
    console.error('Error connecting to local server:', err.message);
  }
}
main();
