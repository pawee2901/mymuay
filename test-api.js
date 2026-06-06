const CLOUD_RUN_URL = "https://getemails-wfudlrftlq-uc.a.run.app/getEmails";

async function test() {
  const queryParams = new URLSearchParams({
    senderEmail: "MajmundarDelilah1764@hotmail.com",
    appCode: "GPT"
  });

  console.log("Fetching: " + `${CLOUD_RUN_URL}?${queryParams}`);
  const res = await fetch(`${CLOUD_RUN_URL}?${queryParams}`);
  const data = await res.json();
  console.log("Status:", res.status);
  console.log("Response:", JSON.stringify(data).substring(0, 500));
}

test();
