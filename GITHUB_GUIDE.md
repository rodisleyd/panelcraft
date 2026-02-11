# Como subir o PanelCraft no GitHub

Siga estes passos no seu terminal (PowerShell ou CMD) dentro da pasta do projeto:

## 1. Criar um novo repositório no GitHub
1. Vá para [github.com/new](https://github.com/new).
2. Dê o nome de **"panelcraft"**.
3. Deixe como **Public** ou **Private** (conforme sua preferência).
4. Clique em **"Create repository"**.
5. Não adicione README ou licença agora, vamos subir o código que já temos.

## 2. Comandos no Terminal
Copie e cole estes comandos um por um no terminal (na pasta `panecraft 1.0`):

```powershell
# Inicializar o Git
git init

# Adicionar todos os arquivos (menos os ignorados como .env e node_modules)
git add .

# Criar o primeiro "pacote" de alterações
git commit -m "feat: versão final estável com PWA e responsividade"

# Definir a branch principal
git branch -M main

# Conectar ao seu repositório (SUBSTITUA PELO SEU LINK DO GITHUB)
git remote add origin https://github.com/SEU_USUARIO/panelcraft.git

# Enviar para o GitHub
git push -u origin main
```

## 3. Conferir
Vá até a página do seu repositório no GitHub e atualize. Você verá todos os seus arquivos lá!

> [!IMPORTANT]
> Eu já atualizei o seu arquivo `.gitignore` para garantir que o arquivo `.env` **não** seja enviado para o GitHub. Isso é fundamental para manter sua chave da API segura!

## 4. Como enviar atualizações no futuro
Sempre que você fizer uma mudança no código e quiser que ela apareça no site (Vercel), rode estes 3 comandos:

```powershell
# 1. Avisar ao Git quais arquivos mudaram
git add .

# 2. Dar um nome para a sua atualização
git commit -m "fiz tal mudança no layout"

# 3. Enviar para o GitHub
git push origin main
```

> [!TIP]
> Assim que você rodar o `git push`, a Vercel vai detectar a mudança e começar a publicar a nova versão do site automaticamente! 🚀
