const url = 'https://yuhrisaktbfnuzjklqqu.supabase.co/rest/v1/churches?select=*';
const headers = {
  'apikey': 'sb_publishable_VsM7Mb-zJ6vPfpFduN4ytQ__fZZ2qhD',
  'Authorization': 'Bearer sb_publishable_VsM7Mb-zJ6vPfpFduN4ytQ__fZZ2qhD'
};

fetch(url, { headers })
  .then(res => res.json())
  .then(data => {
    console.log("CHURCHES:", data.length);
  });

const membersUrl = 'https://yuhrisaktbfnuzjklqqu.supabase.co/rest/v1/members?select=*';
fetch(membersUrl, { headers })
  .then(res => res.json())
  .then(data => {
    console.log("MEMBERS:", data.length);
  });
