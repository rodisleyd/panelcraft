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

Depois que o código estiver lá, você pode seguir para o deploy na Vercel usando o guia que criamos antes.
