const urls = [
  'http://localhost:3000/assets/images/guia_completo_aulas_tecnologia_2025/guia_page-1.png',
  'http://localhost:3000/assets/images/trilha_tecnologia_computacao_2025/trilha_page-01.png'
];

(async () => {
  for (const u of urls) {
    try {
      const res = await fetch(u);
      console.log(`${u} -> ${res.status}`);
    } catch (err) {
      console.error(`${u} -> ERROR: ${err.message}`);
    }
  }
})();
