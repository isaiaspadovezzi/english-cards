ENGLISH CARDS — PRIMEIROS PASSOS

O que vem neste pacote:
- index.html: estrutura do aplicativo
- css/style.css: visual e adaptação para celular
- js/config.js: URL e chave publicável do Supabase
- js/app.js: login, cards, favoritos, revisões, modo escuta e importação/exportação CSV
- sql/seguranca.sql: políticas RLS iniciais para vocabulário

IMPORTANTE — antes de publicar:
1. Abra js/config.js e substitua:
   COLE_AQUI_A_URL_DO_PROJETO
   COLE_AQUI_A_CHAVE_PUBLICAVEL
   Use apenas a URL do projeto e a chave Publishable (sb_publishable_...).
   NUNCA coloque a chave Secret (sb_secret_...) no site.
2. No Supabase Authentication > URL Configuration:
   - Site URL: a URL publicada pelo GitHub Pages
   - Redirect URLs: adicione também a URL publicada pelo GitHub Pages
3. As tabelas vocabulary_cards, card_shares, card_favorites e card_reviews devem existir.
4. Execute sql/seguranca.sql no SQL Editor do Supabase para configurar as políticas da tabela vocabulary_cards.
   Se o script disser que uma política já existe, não execute repetidamente; revise as políticas existentes.
5. Confirme que RLS está ativado em todas as tabelas e teste com duas contas diferentes antes de inserir vocabulário real.
6. No GitHub, envie a estrutura de arquivos mantendo os nomes e pastas exatamente como estão.

Limitações desta primeira versão:
- A detecção automática da expressão-chave é básica: se não preencher o campo, usa o texto inglês completo como destaque. Você pode corrigir manualmente o campo “Expressão-chave”.
- O preenchimento automático de tradução e exemplos a partir de uma palavra nova ainda precisa de integração com um serviço de dicionário/IA; esta versão permite preencher e importar os campos.
- O modo escuta usa a voz do navegador; reprodução em segundo plano/tela bloqueada depende do dispositivo e navegador.
- O compartilhamento entre contas precisa da interface e dos testes de segurança na próxima etapa.
