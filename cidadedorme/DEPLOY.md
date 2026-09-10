# Atualização do jogo no servidor

A entrega contém o código e as imagens. `node_modules` e `dist` não precisam ser enviados ao GitHub.

## Configuração do serviço existente

O jogo precisa de um processo Node.js com HTTP e WebSocket habilitados. Use Node.js 22 ou superior e um único processo/instância.

```sh
npm ci
npm run build
npm start
```

O build gera `dist` no próprio servidor. A inicialização usa o modo de produção. O serviço pode definir a porta pela variável `PORT`; o padrão é 3000. A rota de saúde é `/api/health`, e a conexão WebSocket usa `/ws`.

Se houver um proxy, ele deve encaminhar conexões WebSocket e manter a aplicação no mesmo domínio da página. Para jogar pela internet, abra o endereço HTTPS do serviço na TV e nos celulares.

## O que enviar ao GitHub

Envie os arquivos de código e configuração, o `package-lock.json`, os testes e a pasta `public/art`. Mantenha `.gitignore`. Não envie pastas de dependências, arquivos de ambiente com segredos ou a pasta de build.

Atualize pelo seu fluxo normal no GitHub e deixe o serviço executar a instalação e o build novamente. Nenhuma publicação foi feita automaticamente nesta reformulação.

## Rede local

Em desenvolvimento (`npm run dev`), abra `http://localhost:3000` no computador. O QR Code usa um endereço IPv4 da rede local, quando disponível. Se houver VPN ou mais de uma interface, abra a página usando o IP correto do computador antes de gerar o convite. Os celulares precisam estar na mesma rede e o firewall precisa permitir a porta da aplicação.

## Estado das salas

As salas existem em memória. Um deploy ou reinício interrompe partidas em andamento. Não use múltiplas instâncias sem implementar armazenamento e distribuição compartilhados. Salas sem conexões e sem atividade expiram após uma hora.
