# VeriLit ko Hostinger par deploy karna

## Files
- `index.html` — poora tool (search, DOI verify, citation check, references). Sirf yeh file upload karein to tool chal jata hai.
- `api/write.php` — optional. Isse tool khud review likh deta hai. Bina iske "Copy prompt" wala tareeqa chalta hai.
- `api/config.sample.php` — isko `config.php` naam se copy karein aur API key daalein.
- `api/.htaccess` — `config.php` ko browser se chhupata hai.

## Steps (hPanel File Manager)
1. Pehle staging ya subdomain banayen, jaise `lit.yourdomain.com`.
2. File Manager mein us ki `public_html` kholein aur `verilit.zip` upload karke Extract karein.
3. Browser mein site kholein. Search aur DOI verification foran kaam karenge.
4. Auto-writing ke liye: `api/config.sample.php` ko copy karke `api/config.php` banayen, aur `ANTHROPIC_API_KEY` mein apni key daalein (console.anthropic.com se).
5. Step 3 mein "Write here automatically" option ab on ho jayega.

## Zaroori baatein
- Har review aap ke API account se charge hota hai. `VERILIT_HOURLY_LIMIT` har visitor ke liye ghanta-wise limit hai.
- Agar review likhte waqt "timeout" aaye to Hostinger ka PHP `max_execution_time` 300 karein, ya chhoti length chunein.
- Semantic Scholar bina key ke aksar limit laga deta hai. Tool phir sirf OpenAlex se chalta hai.
