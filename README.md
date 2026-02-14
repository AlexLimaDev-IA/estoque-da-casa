<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1emUwoX9XuBiJv5Qy-geE8PEiHRMCa30h

## Deployment na Vercel

Este projeto está pronto para ser implantado na Vercel.

### Pré-requisitos
Certifique-se de configurar as seguintes variáveis de ambiente no painel da Vercel após importar o projeto:

- `VITE_SUPABASE_URL`: A URL do seu projeto Supabase.
- `VITE_SUPABASE_ANON_KEY`: A chave pública (anon key) do seu projeto Supabase.
- `GEMINI_API_KEY`: (Opcional) Sua chave de API do Gemini, se utilizada.

### Como implantar
1. Faça um fork ou push deste repositório para o GitHub.
2. Acesse [Vercel](https://vercel.com) e importe o projeto.
3. A Vercel deve detectar automaticamente que é um projeto Vite.
4. Adicione as variáveis de ambiente listadas acima.
5. Clique em "Deploy".

## Instalação Local

**Prerequisites:**  Node.js


l dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
