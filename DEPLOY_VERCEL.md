# Guia de Implantação na Vercel - PanelCraft

Para colocar o seu aplicativo no ar (produção) usando a Vercel, siga este passo a passo:

## 1. Preparar o Repositório
Certifique-se de que o seu código está em um repositório no **GitHub**, **GitLab** ou **Bitbucket**.

## 2. Importar na Vercel
1. Acesse [vercel.com](https://vercel.com) e faça login.
2. Clique em **"Add New"** > **"Project"**.
3. Selecione o repositório do **PanelCraft**.
4. A Vercel deve detectar automaticamente que é um projeto **Vite**.

## 3. Configurar Variáveis de Ambiente (CRUCIAL)
O PanelCraft depende de chaves da API para funcionar. No painel de importação, expanda a seção **"Environment Variables"** e adicione as seguintes:

### API do Gemini (IA)
- `VITE_GEMINI_API_KEY`: Sua chave da API do Google AI Studio.

### Firebase (Colaboração em Tempo Real)
Adicione todas as chaves do seu projeto Firebase (encontradas no seu console do Firebase):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_DATABASE_URL`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

> [!IMPORTANT]
> Certifique-se de usar o prefixo `VITE_` para todas as variáveis, pois o Vite as utiliza para expor os valores ao código do navegador.

## 4. Deploy
1. Clique em **"Deploy"**.
2. Aguarde alguns minutos enquanto a Vercel compila e publica seu site.
3. Pronto! Você receberá uma URL (ex: `panelcraft.vercel.app`) para acessar de qualquer lugar.

## 5. Dicas de Produção
- **Domínio Personalizado**: Na aba "Settings" > "Domains" da Vercel, você pode adicionar um domínio próprio (ex: `panelcraft.com.br`).
- **PWA**: Como já configuramos o `manifest.json` e o `sw.js` na pasta `public`, o site já estará "instalável" assim que estiver no ar via HTTPS (que a Vercel fornece automaticamente).
