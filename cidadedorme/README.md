# O Infiltrado — Mansão Blackwood

Jogo de dedução social inspirado em Cidade Dorme. Uma TV ou computador conduz a partida; cada jogador usa o próprio celular para receber seu papel, explorar a mansão e votar.

## Rodar no computador

Requer Node.js 22 ou superior.

```sh
npm ci
npm run dev
```

Abra `http://localhost:3000`. Crie uma sala e conecte de 3 a 5 jogadores pelo QR Code, ou complete a sala com bots. Para celulares na rede local, mantenha o computador e os aparelhos no mesmo Wi-Fi. O QR usa o endereço de rede do computador quando a página está aberta em localhost. O firewall precisa permitir a porta 3000. Não é necessário configurar chave de API.

## Partida

1. Um infiltrado, um detetive e inocentes recebem identidades secretas.
2. Todos exploram a mansão em silêncio durante a noite. Toque no mapa, segure as setas ou use WASD. Os personagens passam pelas portas; a visão de outros jogadores é limitada à proximidade.
3. O infiltrado tem um ataque por noite, a até 85 unidades e sem paredes entre os personagens. O detetive pode investigar uma pessoa em segredo. Ele também pode morrer.
4. Ao amanhecer, os sobreviventes registram um álibi. Mentir sobre o papel e sobre onde estava faz parte do jogo.
5. O grupo confronta os depoimentos. Todos os vivos votam, e só votos confirmados entram na contagem. Empate ou abstenção geral não eliminam ninguém.
6. O grupo vence se eliminar o infiltrado. O infiltrado vence se eliminar todos os adversários ou sobreviver ao julgamento da terceira rodada.

Os bots usam decisões simples e aleatórias, sem serviço externo de IA. Recomenda-se jogar com pessoas para aproveitar o blefe e o debate.

## Testar

```sh
npm test
npm run lint
npm run build
npm start
```

Com o servidor rodando, em outro terminal:

```sh
npm run test:integration
```

Os testes cobrem rotas entre cômodos, paredes, velocidade de movimento, ataques, sigilo, investigação, votos, reinício e cinco conexões simultâneas com reconexão e alternativa HTTP.

## Atualizar pelo GitHub

Envie a pasta de código, incluindo `src`, `server`, `public`, `tests`, `package.json` e `package-lock.json`. **Não envie `node_modules` nem `dist`.** As duas pastas são geradas automaticamente durante a instalação e o build e estão no `.gitignore`.

No serviço que já hospeda o jogo, use:

- Instalação/build: `npm ci && npm run build`
- Inicialização: `npm start`
- Versão de Node.js: 22 ou superior

Veja [DEPLOY.md](DEPLOY.md). O GitHub guarda o código; GitHub Pages sozinho não executa o servidor multiplayer.

## Limites atuais

As salas ficam na memória de um único processo. Reiniciar o servidor encerra partidas; não há persistência ou sincronização entre múltiplas instâncias. Celulares devem manter a página aberta. Redes que interrompem conexões podem causar pausas, mesmo com reconexão e alternativa HTTP. Os testes não substituem uma partida com vários aparelhos físicos.

Arte original gerada para este projeto em `public/art`. Registro de alterações e verificações: [docs/ENTREGA.md](docs/ENTREGA.md).
