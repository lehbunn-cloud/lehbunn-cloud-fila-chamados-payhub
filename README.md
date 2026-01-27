# Portal de Fila de Chamados - Payhub

Sistema de gerenciamento de fila de atendimento para a equipe N1/N2.

## Configuração

### 1. Firebase
1. Crie um projeto no [Firebase Console](https://console.firebase.google.com)
2. Ative Authentication (Email/Password) e Firestore
3. Copie as configurações para `firebase-config.js`

### 2. Instalação
```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login no Firebase
firebase login

# Inicializar projeto
firebase init
