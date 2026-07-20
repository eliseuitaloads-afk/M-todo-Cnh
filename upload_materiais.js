const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://mfsmobustnbdjffsvxne.supabase.co';

// Recebe a chave service_role do argumento da linha de comando
const SERVICE_ROLE_KEY = process.argv[2];

if (!SERVICE_ROLE_KEY) {
  console.error('\n[ERRO] Voce precisa fornecer a chave service_role do Supabase!');
  console.log('\nComo usar:');
  console.log('node upload_materiais.js <SUA_CHAVE_SERVICE_ROLE_AQUI>\n');
  process.exit(1);
}

const filesToUpload = [
  { local: '25 Pegadinhas Que Mais Reprovam.pdf', remote: '25-pegadinhas-que-mais-reprovam.pdf' },
  { local: '25 Quest\u00f5es De Legisla\u00e7\u00e3o.pdf', remote: '25-questoes-de-legislacao.pdf' },
  { local: '30 Perguntas Mais Cobradas.pdf', remote: '30-perguntas-mais-cobradas.pdf' },
  { local: 'Checklist Premium Detran 2026.pdf', remote: 'checklist-premium-detran-2026.pdf' },
  { local: 'Mapas Mentais Das Placas.pdf', remote: 'mapas-mentais-das-placas.pdf' },
  { local: 'Simulados Completos.pdf', remote: 'simulados-completos.pdf' }
];

const basePath = 'C:\\Users\\Usu\u00e1rio\\OneDrive\\Documentos\\Arquivos Cnh\\M\u00e9todos Completos';

async function run() {
  console.log('1. Garantindo a existencia do bucket "materiais" como PUBLICO...');
  try {
    const resBucket = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      method: 'POST',
      headers: {
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        id: 'materiais',
        name: 'materiais',
        public: true,
        file_size_limit: null,
        allowed_mime_types: null
      })
    });
    
    const bucketData = await resBucket.json();
    if (resBucket.ok) {
      console.log('-> Bucket "materiais" criado com sucesso!');
    } else if (bucketData.message && bucketData.message.includes('already exists')) {
      console.log('-> Bucket "materiais" ja existe no Storage.');
    } else {
      console.log('-> Resposta da criacao do bucket:', bucketData);
    }
  } catch (err) {
    console.error('-> Erro ao gerenciar bucket:', err);
  }

  console.log('\n2. Iniciando uploads dos PDFs...');
  for (const file of filesToUpload) {
    const localPath = path.join(basePath, file.local);
    if (!fs.existsSync(localPath)) {
      console.error(`\n[ERRO] Arquivo local nao encontrado: "${localPath}"`);
      continue;
    }

    const fileSizeMB = (fs.statSync(localPath).size / (1024 * 1024)).toFixed(2);
    console.log(`\nLendo "${file.local}" (${fileSizeMB} MB)...`);
    const fileBuffer = fs.readFileSync(localPath);

    console.log(`Enviando para o Storage como "${file.remote}"...`);
    try {
      const resUpload = await fetch(`${SUPABASE_URL}/storage/v1/object/materiais/${file.remote}`, {
        method: 'POST',
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/pdf',
          'x-upsert': 'true'
        },
        body: fileBuffer
      });
      
      const uploadData = await resUpload.json();
      if (resUpload.ok) {
        console.log(`-> UPLOAD SUCESSO: ${file.remote}`);
      } else {
        console.error(`-> ERRO NO UPLOAD:`, uploadData);
      }
    } catch (err) {
      console.error(`-> Falha de rede ao enviar ${file.remote}:`, err);
    }
  }
  
  console.log('\nProcesso finalizado!');
}

run();
