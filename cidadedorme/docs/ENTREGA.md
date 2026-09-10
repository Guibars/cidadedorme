# Reformulação — setembro de 2026

## Visuais

- Identidade de suspense própria: azul petróleo, dourado envelhecido, vermelho discreto e tipografia cinematográfica.
- Nova arte de capa e planta da Mansão Blackwood em `public/art`.
- Entrada, convites/QR, lobby, identidades, controle noturno, investigação, cena do crime e debate redesenhados.
- Tokens de cor compartilhados pelas demais fases; contraste, foco de teclado, zoom permitido e redução de animações.

## Correções principais

- Uma ação usa WebSocket ou HTTP; não é executada pelos dois ao mesmo tempo.
- Criar/reconectar a TV mantém a mesma sala; sessões de TV e jogador são separadas por aba e modo.
- Animação do mapa usa um loop estável, independente da frequência de atualização, sem renderizar React a cada passo.
- Envio de movimentos a cada 75 ms, agrupamento no servidor e alternativa HTTP com fila limitada.
- Percurso pelas portas, paredes verificadas no servidor, sem passos infinitos depois de soltar o controle ou sair da janela.
- Papéis e investigações privados; dados de movimento noturno não aparecem no telão; informações distantes não são enviadas aos celulares.
- Ataques validados pela distância e paredes. Vítimas não continuam andando ou investigando.
- Só o detetive pode acusar, tanto na interface quanto no servidor. A acusação exige confirmação; duplicatas não contam.
- Álibis reintegrados ao fluxo da partida. Investigação é limitada e permanece disponível após reconectar.
- Reinício cancela temporizadores antigos. Partidas com três pessoas ainda têm julgamento após a primeira noite.
- QR Code local usa o IP de rede. Chave de API de IA não é necessária.

## Verificação da versão anterior

Antes desta revisão de mecânicas: 12 testes automatizados de regras/movimento, incluindo os 30 trajetos entre cômodos, e teste de integração de cinco clientes com reconexão, alternativa HTTP e proteção de sessões. TypeScript e build de produção verificados. Prévia inspecionada no navegador integrado em telas de computador e celular.

Não foi feita uma sessão de jogo com cinco aparelhos físicos nem um teste de latência em Wi-Fi real. O mapa é um cenário ilustrado com personagens e controles em canvas 2D; não é um motor de mundo 3D.

## Arte

Ferramenta utilizada: geração de imagem integrada, sem API externa configurada no projeto.

Direção da capa: mansão vitoriana isolada à noite, cinco convidados misteriosos, névoa, luz de lua em azul petróleo, janelas com velas âmbar, porta vermelha, composição cinematográfica com espaço à esquerda para a tipografia. Sem texto na imagem.

Direção do mapa: vista superior ortográfica 8:5, seis cômodos (quarto, cozinha, sala, biblioteca, jardim, porão) ligados por corredores, madeira, mármore, pedra azul, velas e sombras frias. Sem personagens ou texto, com interface e controles renderizados pelo jogo.

Arquivos: `public/art/mansion-night.png` e `public/art/mansion-map.png`.

## Entrega de código

`dist` e `node_modules` são temporários para testes e não fazem parte da entrega final. Instale com `npm ci` e deixe a hospedagem gerar o build. Veja o README e o DEPLOY para detalhes.


## Revisão de exploração e interação

- Noites de 90 segundos com duas tarefas por convidado, sequências nos cômodos e objetivo coletivo para recuperar o horário do ataque.
- Encontros privados com nome, local e horário; visibilidade respeita paredes e apagões. Voltar ao quarto não apaga os registros.
- Preparo de 12 segundos para atacar, vítima relatável no local e sino de emergência na sala, uma vez por partida.
- Apagão de 18 segundos, visão reduzida e reparo coletivo de três fusíveis no porão.
- Acusação exclusiva do detetive e sucessão do distintivo em caso de morte.
- Partida de duas pessoas e dois bots, com detetive inicial humano. Bots percorrem rotas reutilizadas, realizam tarefas, relatam vítimas e respondem a perguntas no debate.
- Áudio procedural com vento, passos, trilha e sino; volume geral, clima suave/sombrio e preferência de vibração. Avisos visuais independem do suporte à vibração.
- Atualizações privadas periódicas limitadas e proteção contra acúmulo de dados em conexões lentas.

**Esta revisão foi somente editada: sem testes, compilação, servidor ou navegador, por solicitação do usuário. Os resultados de verificação acima pertencem à versão anterior e não validam as novas mecânicas.**
