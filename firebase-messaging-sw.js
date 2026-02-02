// Importar scripts do Firebase
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

// Configuração do Firebase
firebase.initializeApp({
    apiKey: "AIzaSyCJXxaG8R5-VmkoGA7PyFcyfcvBAk92yTc",
    authDomain: "portal-fila-payhub.firebaseapp.com",
    projectId: "portal-fila-payhub",
    storageBucket: "portal-fila-payhub.firebasestorage.app",
    messagingSenderId: "28871537008",
    appId: "1:28871537008:web:38d6ac22721f40a7d61fb5"
});

const messaging = firebase.messaging();

// Lidar com notificações em segundo plano
messaging.onBackgroundMessage((payload) => {
    console.log('Mensagem em background:', payload);
    
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/icon.png'
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});