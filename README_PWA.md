# PWA Gestão Militar - Configuração Standalone

## 📱 Diferença entre Atalho e App Instalado

### ❌ Atalho do Chrome (Problema anterior)
- Ícone do Chrome sobreposto no canto inferior direito
- Abre no navegador com barra de endereço visível
- Não aparece na gaveta de apps do Android
- Não funciona offline

### ✅ App Standalone (Solução implementada)
- Ícone limpo, sem sobreposição do Chrome
- Abre em tela cheia, sem UI do navegador
- Aparece na gaveta de apps (app drawer)
- Funciona offline com Service Worker
- Integrado ao sistema como app nativo

## 🔧 Arquivos Modificados

1. **manifest.json** - Configuração PWA completa
   - `display: "standalone"` - App independente
   - `display_override` - Fallback para minimal-ui
   - Ícones com `purpose: "any maskable"` - Suporte a ícones adaptáveis
   - `scope: "."` - Define escopo do PWA
   - `handle_links: "preferred"` - Abre links no app instalado
   - `launch_handler` - Reutiliza instância existente

2. **index.html** - Meta tags otimizadas
   - `mobile-web-app-capable: yes`
   - `apple-mobile-web-app-capable: yes`
   - Múltiplos tamanhos de ícones
   - Cores do tema configuradas

3. **anotacoes.html** - Meta tags PWA
4. **fo-sistema.html** - Meta tags PWA  
5. **login.html** - Meta tags PWA
6. **sw.js** - Service Worker otimizado

## 📋 Requisitos para Instalação Correta

### No Android:
1. **Use o Chrome** (não Edge, Firefox ou outros)
2. Acesse o site via **HTTPS** (obrigatório)
3. Toque no menu (3 pontos) → "Instalar aplicativo" ou "Adicionar à tela inicial"
4. O app aparecerá na **gaveta de apps** (não só na home)

### No iOS (Safari):
1. Toque no botão "Compartilhar"
2. Selecione "Adicionar à Tela de Início"
3. O app abrirá em modo standalone

## 🎯 Como Verificar se Está Correto

✅ **App instalado corretamente:**
- Ícone aparece na gaveta de apps do Android
- Não tem ícone do Chrome sobreposto
- Abre sem barra de endereço do navegador
- Aparece em "Configurações > Apps"

❌ **Apenas atalho (incorreto):**
- Só aparece na tela inicial
- Tem ícone do Chrome sobreposto
- Abre no navegador com barra de endereço

## 🚀 Deploy

### GitHub Pages (Recomendado):
1. Faça upload de todos os arquivos
2. Acesse via HTTPS: `https://seuusuario.github.io/repositorio/`
3. Instale pelo Chrome no Android

### Outros servidores:
- Certifique-se de servir via **HTTPS**
- O Service Worker requer HTTPS para funcionar

## 🔍 Troubleshooting

### Ícone do Chrome ainda aparece:
1. Limpe os dados do Chrome (Configurações > Apps > Chrome > Armazenamento)
2. Desinstale qualquer versão anterior do app
3. Reinicie o Chrome
4. Tente instalar novamente

### App não aparece na gaveta de apps:
- Verifique se está usando Chrome (não Edge/Firefox)
- Confirme que o manifest.json está acessível
- Verifique no DevTools > Application > Manifest

### Service Worker não registra:
- Site deve estar em HTTPS
- Verifique no DevTools > Application > Service Workers
- Limpe o cache e recarregue

## 📚 Recursos

- [MDN: Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)
- [web.dev: PWA checklist](https://web.dev/pwa-checklist/)
- [Can I use: Web App Manifest](https://caniuse.com/web-app-manifest)

---
**Versão:** 3.0.0 Standalone
**Data:** Março 2026
