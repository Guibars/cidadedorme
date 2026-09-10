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
- Todos os vivos votam. Voto precisa de alvo válido e confirmação; duplicatas não contam, empates não eliminam.
- Álibis reintegrados ao fluxo da partida. Investigação é limitada e permanece disponível após reconectar.
- Reinício cancela temporizadores antigos. Partidas com três pessoas ainda têm julgamento após a primeira noite.
- QR Code local usa o IP de rede. Chave de API de IA não é necessária.

## Verificação

12 testes automatizados de regras/movimento, incluindo os 30 trajetos entre cômodos, e teste de integração de cinco clientes com reconexão, alternativa HTTP e proteção de sessões. TypeScript e build de produção verificados. Prévia inspecionada no navegador integrado em telas de computador e celular.

Não foi feita uma sessão de jogo com cinco aparelhos físicos nem um teste de latência em Wi-Fi real. O mapa é um cenário ilustrado com personagens e controles em canvas 2D; não é um motor de mundo 3D.

## Arte

Ferramenta utilizada: geração de imagem integrada, sem API externa configurada no projeto.

Direção da capa: mansão vitoriana isolada à noite, cinco convidados misteriosos, névoa, luz de lua em azul petróleo, janelas com velas âmbar, porta vermelha, composição cinematográfica com espaço à esquerda para a tipografia. Sem texto na imagem.

Direção do mapa: vista superior ortográfica 8:5, seis cômodos (quarto, cozinha, sala, biblioteca, jardim, porão) ligados por corredores, madeira, mármore, pedra azul, velas e sombras frias. Sem personagens ou texto, com interface e controles renderizados pelo jogo.

Arquivos: `public/art/mansion-night.png` e `public/art/mansion-map.png`.

## Entrega de código

`dist` e `node_modules` são temporários para testes e não fazem parte da entrega final. Instale com `npm ci` e deixe a hospedagem gerar o build. Veja o README e o DEPLOY para detalhes.
