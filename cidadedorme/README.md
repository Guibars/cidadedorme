# O Infiltrado — Mansão Blackwood

Jogo de dedução social inspirado em Cidade Dorme. Uma TV ou computador conduz a partida; cada jogador usa o próprio celular para receber seu papel, explorar a mansão, cumprir tarefas e apresentar seu álibi. Só o detetive pode acusar.

## Rodar no computador

Requer Node.js 22 ou superior.

```sh
npm ci
npm run dev
```

Abra `http://localhost:3000`. Crie uma sala e conecte de 3 a 5 jogadores pelo QR Code, ou complete a sala com bots. Para celulares na rede local, mantenha o computador e os aparelhos no mesmo Wi-Fi. O QR usa o endereço de rede do computador quando a página está aberta em localhost. O firewall precisa permitir a porta 3000. Não é necessário configurar chave de API.

## Partida

1. Um infiltrado, um detetive e inocentes recebem identidades secretas. Todos podem blefar.
2. A noite dura 90 segundos. Explore pelas portas usando toque, setas ou WASD. A visão é limitada por distância e paredes; encontros ficam registrados no seu caderno.
3. Cada convidado recebe duas tarefas em cômodos diferentes. Repita as sequências no local. A meta coletiva recupera o horário do ataque para comparar com os relatos. O infiltrado também pode fazer tarefas.
4. O infiltrado ataca uma vez por noite, após 12 segundos, a até 85 unidades e sem paredes no caminho. Pode provocar um apagão de 18 segundos; sobreviventes restauram a energia reparando 3 fusíveis no porão.
5. Vítimas ficam no local do ataque. Quem se aproximar pode relatar a descoberta e convocar a reunião. O sino da sala permite uma reunião de emergência por partida, depois de 15 segundos de exploração.
6. O detetive consulta os encontros de uma pessoa por noite; o relatório não revela papéis. Na reunião, sobreviventes registram um álibi e debatem em voz alta.
7. **Só o detetive escolhe e confirma uma acusação.** Os outros participantes dão relatos e se defendem. Sem confirmação, ninguém é preso. Se o detetive morrer, um inocente assume o distintivo, com preferência por humanos.
8. O grupo vence prendendo o infiltrado. O infiltrado vence se eliminar todos os adversários ou sobreviver ao julgamento da terceira rodada.

### Duas pessoas + dois bots

Entrem com os dois celulares e usem **Adicionar 2 bots** no lobby da TV. O detetive inicial é sorteado entre os humanos. Bots fazem tarefas, seguem rotas pelas portas, reparam apagões e relatam vítimas próximas. Seus depoimentos usam os próprios encontros; o infiltrado pode inventar um álibi. No debate, os humanos podem perguntar aos bots onde estavam e quem viram. Não é necessária uma API de IA.

### Som e vibração

A barra **Ambiente** permite silenciar, ajustar o volume, escolher clima suave ou sombrio e desligar a vibração. As preferências ficam salvas neste navegador. Vento, passos, trilha grave e sino acompanham o telão. Os celulares usam avisos visuais, vibrações e cliques discretos; eventos pessoais não tocam sons que identifiquem papéis. A vibração depende do suporte do aparelho/navegador. Os avisos visuais permanecem disponíveis sem ela.

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

A suíte existente inclui rotas, paredes, movimento, sigilo, investigação, acusação exclusiva do detetive, reinício e reconexão. **Nesta revisão, nenhum teste, compilação ou servidor foi executado, conforme solicitado.** As novas mecânicas precisam ser experimentadas na sua publicação.

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
