// Firebase SDK imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    sendEmailVerification,
    sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import {
    getFirestore,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    onSnapshot,
    collection,
    query,
    where,
    addDoc,
    getDocs,
    serverTimestamp,
    orderBy
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// --- Global Variables ---
let app;
let db;
let auth;
let currentUserId = null;
let currentUserEmail = null;
let userDisplayName = null;
let userProfilePicUrl = "https://placehold.co/100x100/A0AEC0/FFFFFF?text=PF"; // Default profile picture
let activeChat = null;
let contacts = [];
let groups = [];
let unsubscribeMessages = null;
let unsubscribeContacts = null;
let unsubscribeGroups = null;
let notifications = [];
let notificationIdCounter = 0;
let resendCooldownTimer = null; // Variable to hold the cooldown timer
const RESEND_COOLDOWN_SECONDS = 60; // Cooldown duration in seconds

// Cloudinary Configuration
const CLOUDINARY_CLOUD_NAME = 'dae8gaaek';
const CLOUDINARY_UPLOAD_PRESET = 'SynergiCode';

// Get app ID and Firebase config from global variables provided by the environment
// Ensure __app_id and __firebase_config are available in the environment
const appId = typeof __app_id !== 'undefined' ? __app_id : 'synergicode';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
    apiKey: "AIzaSyASX4A-fd3tvzWByAkqgdXMB9DbV4r_OLI",
    authDomain: "synergicode.firebaseapp.com",
    projectId: "synergicode",
    storageBucket: "synergicode.firebasestorage.app",
    messagingSenderId: "184895241849",
    appId: "1:184895241849:web:517e25b7535f1530bc9ea8",
    measurementId: "G-Y0CDV2S6XB"
};

// --- DOM Elements ---
const authSection = document.getElementById('auth-section');
const appSection = document.getElementById('app-section');
const authTitle = document.getElementById('auth-title');
const authForm = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authButton = document.getElementById('auth-button');
const toggleAuthButton = document.getElementById('toggle-auth');
const forgotPasswordLink = document.getElementById('forgot-password-link');
const authMessage = document.getElementById('auth-message');

const logoutButton = document.getElementById('logout-button');
const profilePic = document.getElementById('profile-pic');
const profilePicUploadInput = document.getElementById('profile-pic-upload');
const uploadPicButton = document.getElementById('upload-pic-button');
const userDisplayNameElement = document.getElementById('user-display-username');

const emailVerificationStatusSidebar = document.getElementById('email-verification-status-sidebar');
const emailVerifiedText = document.getElementById('email-verified-text');
const resendVerificationEmailSidebarButton = document.getElementById('resend-verification-email-sidebar');

const userPhoneDisplay = document.getElementById('user-phone-display');
const userDobDisplay = document.getElementById('user-dob-display');
const userAgeDisplay = document.getElementById('user-age-display');
const changeUsernameButton = document.getElementById('change-username-button');

const showContactsButton = document.getElementById('show-contacts');
const showGroupsButton = document.getElementById('show-groups');
const addContactButton = document.getElementById('add-contact-button');
const createGroupButton = document.getElementById('create-group-button');
const chatHeader = document.getElementById('chat-header');
const currentChatPic = document.getElementById('current-chat-pic');
const currentChatName = document.getElementById('current-chat-name');
const currentChatStatus = document.getElementById('current-chat-status');
const chatMessagesContainer = document.getElementById('chat-messages-container');
const messageInputArea = document.getElementById('message-input-area');
const attachMediaButton = document.getElementById('attach-media-button');
const chatMediaUploadInput = document.getElementById('chat-media-upload');
const messageInput = document.getElementById('message-input');
const sendMessageButton = document.getElementById('send-message-button');
const noChatSelected = document.getElementById('no-chat-selected');
const contactsListView = document.getElementById('contacts-list-view');
const contactsList = document.getElementById('contacts-list');
const noContactsMessage = document.getElementById('no-contacts-message');
const groupsListView = document.getElementById('groups-list-view');
const groupsList = document.getElementById('groups-list');
const noGroupsMessage = document.getElementById('no-groups-message');

const registerFields = document.getElementById('register-fields');
const usernameInput = document.getElementById('username');
const phoneInput = document.getElementById('phone');
const dobInput = document.getElementById('dob');
const ageInput = document.getElementById('age');

const addContactModal = document.getElementById('add-contact-modal');
const addContactForm = document.getElementById('add-contact-form');
const contactInput = document.getElementById('contact-input');
const cancelAddContactButton = document.getElementById('cancel-add-contact');
const addContactMessage = document.getElementById('add-contact-message');

const createGroupModal = document.getElementById('create-group-modal');
const createGroupForm = document.getElementById('create-group-form');
const groupNameInput = document.getElementById('group-name');
const groupDescriptionInput = document.getElementById('group-description');
const groupPhotoPreview = document.getElementById('group-photo-preview'); // New DOM element
const groupPhotoUploadInput = document.getElementById('group-photo-upload'); // New DOM element
const uploadGroupPicButton = document.getElementById('upload-group-pic-button'); // New DOM element
const groupMemberSelection = document.getElementById('group-member-selection');
const noContactsForGroup = document.getElementById('no-contacts-for-group');
const cancelCreateGroupButton = document.getElementById('cancel-create-group');
const createGroupMessage = document.getElementById('create-group-message');

const messageBox = document.getElementById('message-box');
const messageBoxTitle = document.getElementById('message-box-title');
const messageBoxContent = document.getElementById('message-box-content');
const messageBoxOkButton = document.getElementById('message-box-ok');

const emailSentModal = document.getElementById('email-sent-modal');
const emailSentOkButton = document.getElementById('email-sent-ok');

const forgotPasswordModal = document.getElementById('forgot-password-modal');
const forgotPasswordForm = document.getElementById('forgot-password-form');
const forgotEmailInput = document.getElementById('forgot-email');
const cancelForgotPasswordButton = document.getElementById('cancel-forgot-password');
const forgotPasswordMessage = document.getElementById('forgot-password-message');

const showNotificationsButton = document.getElementById('show-notifications-button');
const notificationBadge = document.getElementById('notification-badge');
const notificationsModal = document.getElementById('notifications-modal');
const notificationsList = document.getElementById('notifications-list');
const noNotificationsMessage = document.getElementById('no-notifications-message');
const clearNotificationsButton = document.getElementById('clear-notifications-button');
const closeNotificationsModalButton = document.getElementById('close-notifications-modal');
const showFriendRequestsButton = document.getElementById('show-friend-requests-button'); // New DOM element

const changeUsernameModal = document.getElementById('change-username-modal');
const changeUsernameForm = document.getElementById('change-username-form');
const newUsernameInput = document.getElementById('new-username-input');
const cancelChangeUsernameButton = document.getElementById('cancel-change-username');
const changeUsernameMessage = document.getElementById('change-username-message');

const mobileSidebarToggle = document.getElementById('mobile-sidebar-toggle');
const sidebar = document.getElementById('sidebar');
const mobileLogoutButton = document.getElementById('mobile-logout-button');
const closeSidebarButton = document.getElementById('close-sidebar-button');
const sidebarOverlay = document.getElementById('sidebar-overlay');


// --- Utility Functions ---

/**
 * Adds a new notification to the notifications array and updates the badge.
 * Añade una nueva notificación al array de notificaciones y actualiza el contador.
 * @param {string} title - The title of the notification. El título de la notificación.
 * @param {string} message - The content of the notification. El contenido de la notificación.
 * @param {'success'|'error'|'info'|'friendRequest'} type - The type of notification. El tipo de notificación.
 * @param {object} [data=null] - Optional data for the notification (e.g., requestId, senderId for friend requests). Datos opcionales para la notificación.
 */
function addNotification(title, message, type = 'info', data = null) {
    notifications.push({
        id: notificationIdCounter++,
        title,
        message,
        type,
        read: false,
        timestamp: new Date(),
        data // Store additional data like requestId, senderId
    });
    updateNotificationBadge();
}

/**
 * Updates the notification badge count.
 * Actualiza el contador de notificaciones.
 */
function updateNotificationBadge() {
    const unreadCount = notifications.filter(n => !n.read).length;
    if (unreadCount > 0) {
        notificationBadge.textContent = unreadCount;
        notificationBadge.classList.remove('hidden');
    } else {
        notificationBadge.classList.add('hidden');
    }
}

/**
 * Displays the notifications modal and renders the notifications.
 * Muestra el modal de notificaciones y renderiza las notificaciones.
 */
function showNotificationsModal() {
    notificationsList.innerHTML = '';
    if (notifications.length === 0) {
        noNotificationsMessage.classList.remove('hidden');
    } else {
        noNotificationsMessage.classList.add('hidden');
        notifications.forEach(n => {
            const li = document.createElement('li');
            li.classList.add('p-3', 'rounded-md', 'shadow-sm');
            
            let bgColor = 'bg-gray-50';
            let textColor = 'text-gray-800';
            let icon = '';
            let actionButtonsHtml = '';

            switch (n.type) {
                case 'success':
                    bgColor = 'bg-green-50';
                    textColor = 'text-green-800';
                    icon = '<i class="fas fa-check-circle mr-2"></i>';
                    break;
                case 'error':
                    bgColor = 'bg-red-50';
                    textColor = 'text-red-800';
                    icon = '<i class="fas fa-times-circle mr-2"></i>';
                    break;
                case 'info':
                    bgColor = 'bg-blue-50';
                    textColor = 'text-blue-800';
                    icon = '<i class="fas fa-info-circle mr-2"></i>';
                    break;
                case 'friendRequest':
                    bgColor = 'bg-blue-50'; // Distinct color for requests
                    textColor = 'text-blue-800';
                    icon = '<i class="fas fa-user-plus mr-2"></i>';
                    if (n.data && n.data.requestId && n.data.senderId) {
                        actionButtonsHtml = `
                            <div class="mt-3 flex justify-end space-x-2">
                                <button class="accept-friend-request px-3 py-1 bg-custom-primary text-white text-sm rounded-md hover:bg-custom-primary-dark" 
                                        data-request-id="${n.data.requestId}" data-sender-id="${n.data.senderId}">Aceptar</button>
                                <button class="deny-friend-request px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-100" 
                                        data-request-id="${n.data.requestId}">Denegar</button>
                            </div>
                        `;
                    }
                    break;
                default:
                    bgColor = 'bg-gray-50';
                    textColor = 'text-gray-800';
                    icon = '<i class="fas fa-info-circle mr-2"></i>';
                    break;
            }

            li.classList.add(bgColor, textColor);
            li.innerHTML = `
                <div class="font-semibold flex items-center mb-1">${icon}${n.title}</div>
                <div class="text-sm">${n.message}</div>
                <div class="text-xs text-right text-gray-500 mt-1">${n.timestamp.toLocaleTimeString()}</div>
                ${actionButtonsHtml}
            `;
            notificationsList.appendChild(li);
            n.read = true; // Mark as read when displayed
        });
    }
    updateNotificationBadge(); // Update badge after marking as read
    notificationsModal.classList.remove('hidden');

    // Add event listeners for new buttons
    notificationsList.querySelectorAll('.accept-friend-request').forEach(button => {
        button.addEventListener('click', async (e) => {
            const requestId = e.target.dataset.requestId;
            const senderId = e.target.dataset.senderId;
            await acceptFriendRequest(requestId, senderId);
            notificationsModal.classList.add('hidden'); // Close modal after action
        });
    });

    notificationsList.querySelectorAll('.deny-friend-request').forEach(button => {
        button.addEventListener('click', async (e) => {
            const requestId = e.target.dataset.requestId;
            await denyFriendRequest(requestId);
            notificationsModal.classList.add('hidden'); // Close modal after action
        });
    });
}

/**
 * Clears all notifications.
 * Borra todas las notificaciones.
 */
function clearAllNotifications() {
    notifications = [];
    showNotificationsModal(); // Re-render to show empty state
}

/**
 * Displays a custom message box instead of alert().
 * Muestra una caja de mensaje personalizada en lugar de alert().
 * @param {string} title - The title of the message box. El título de la caja de mensaje.
 * @param {string} content - The content of the message. El contenido del mensaje.
 */
function showMessageBox(title, content) {
    messageBoxTitle.textContent = title;
    messageBoxContent.textContent = content;
    messageBox.classList.remove('hidden');
}

/**
 * Hides the custom message box.
 * Oculta la caja de mensaje personalizada.
 */
function hideMessageBox() {
    messageBox.classList.add('hidden');
}

/**
 * Displays the custom email sent modal.
 * Muestra el modal personalizado de email enviado.
 */
function showEmailSentModal() {
    emailSentModal.classList.remove('hidden');
}

/**
 * Hides the custom email sent modal.
 * Oculta el modal personalizado de email enviado.
 */
function hideEmailSentModal() {
    emailSentModal.classList.add('hidden');
}

/**
 * Displays the login form.
 * Muestra el formulario de inicio de sesión.
 */
function showLogin() {
    authTitle.textContent = 'Iniciar Sesión';
    authButton.textContent = 'Iniciar Sesión';
    toggleAuthButton.textContent = 'Regístrate';
    authForm.dataset.mode = 'login';
    authMessage.textContent = '';
    registerFields.classList.add('hidden'); // Hide additional fields for login
}

/**
 * Displays the registration form.
 * Muestra el formulario de registro.
 */
function showRegister() {
    authTitle.textContent = 'Registrarse';
    authButton.textContent = 'Registrarse';
    toggleAuthButton.textContent = 'Iniciar Sesión';
    authForm.dataset.mode = 'register';
    authMessage.textContent = '';
    registerFields.classList.remove('hidden'); // Show additional fields for registration
}

// Global map to keep track of rendered message elements by their Firestore document ID
const renderedMessages = new Map();

/**
 * Creates a message DOM element.
 * Crea un elemento DOM de mensaje.
 * @param {object} message - The message object. El objeto del mensaje.
 * @param {string} senderName - The name of the sender. El nombre del remitente.
 * @param {boolean} isCurrentUser - True if the message is from the current user. Verdadero si el mensaje es del usuario actual.
 * @param {string} messageId - The Firestore document ID of the message.
 * @returns {HTMLElement} The created message element. El elemento de mensaje creado.
 */
function createMessageElement(message, senderName, isCurrentUser, messageId) {
    const messageElement = document.createElement('div');
    messageElement.id = `message-${messageId}`; // Assign a unique ID
    messageElement.classList.add('flex', 'mb-2', isCurrentUser ? 'justify-end' : 'justify-start');

    const messageBubble = document.createElement('div');
    if (isCurrentUser) {
        messageBubble.classList.add('bg-custom-secondary-blue', 'text-white');
    } else {
        messageBubble.classList.add('bg-gray-200', 'text-gray-800');
    }
    messageBubble.classList.add('rounded-xl', 'p-3', 'max-w-[70%]');

    const senderNameDiv = document.createElement('div');
    senderNameDiv.classList.add('text-xs', 'font-semibold', 'mb-1', isCurrentUser ? 'text-right' : 'text-left', isCurrentUser ? 'text-blue-200' : 'text-gray-600');
    senderNameDiv.textContent = senderName || 'Desconocido';

    const messageContentContainer = document.createElement('div');
    messageContentContainer.classList.add('text-sm');

    if (message.content) {
        const textNode = document.createElement('p');
        textNode.textContent = message.content;
        messageContentContainer.appendChild(textNode);
    }
    
    if (message.mediaUrl && message.mediaType) {
        if (message.mediaType.startsWith('image')) {
            const img = document.createElement('img');
            img.src = message.mediaUrl;
            img.alt = "Imagen enviada";
            img.classList.add('max-w-full', 'rounded-md', 'mb-1');
            messageContentContainer.appendChild(img);
        } else if (message.mediaType.startsWith('video')) {
            const video = document.createElement('video');
            video.src = message.mediaUrl;
            video.controls = true;
            video.classList.add('max-w-full', 'rounded-md', 'mb-1');
            messageContentContainer.appendChild(video);
        }
    }

    const messageTime = document.createElement('div');
    messageTime.classList.add('text-xs', 'mt-1', isCurrentUser ? 'text-right' : 'text-left', isCurrentUser ? 'text-blue-300' : 'text-gray-500');
    const date = message.timestamp ? new Date(message.timestamp.toDate()) : new Date();
    messageTime.textContent = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    messageBubble.appendChild(senderNameDiv);
    messageBubble.appendChild(messageContentContainer);
    messageBubble.appendChild(messageTime);
    messageElement.appendChild(messageBubble);

    return messageElement;
}


/**
 * Clears messages and hides message input area.
 * Limpia los mensajes y oculta el área de entrada de mensajes.
 */
function clearChatView() {
    chatMessagesContainer.innerHTML = '';
    renderedMessages.clear(); // Clear the map when clearing the view
    messageInputArea.classList.add('hidden');
    noChatSelected.classList.remove('hidden');
    chatHeader.classList.add('hidden');
    if (unsubscribeMessages) {
        unsubscribeMessages(); // Unsubscribe from previous chat messages
    }
    activeChat = null;
}

/**
 * Displays the chat view for a given contact or group.
 * Muestra la vista de chat para un contacto o grupo dado.
 * @param {object} chatInfo - Object containing chat details (id, type, name, pic, status). Objeto que contiene los detalles del chat (id, tipo, nombre, imagen, estado).
 */
async function displayChatView(chatInfo) {
    // Hide lists and show chat area
    contactsListView.classList.add('hidden');
    groupsListView.classList.add('hidden');
    noChatSelected.classList.add('hidden');
    messageInputArea.classList.remove('hidden');
    chatHeader.classList.remove('hidden');

    // Update chat header
    currentChatName.textContent = chatInfo.name;
    currentChatPic.src = chatInfo.pic;
    currentChatStatus.textContent = chatInfo.status || '';

    // Only clear the chat container and renderedMessages map if a new chat is selected
    if (!activeChat || activeChat.id !== chatInfo.id || activeChat.type !== chatInfo.type) {
        chatMessagesContainer.innerHTML = ''; // Clear previous messages
        renderedMessages.clear(); // Clear the map for the new chat
        console.log(`[displayChatView] New chat selected. Cleared chatMessagesContainer and renderedMessages map.`);
    }
    activeChat = chatInfo;

    // Unsubscribe from previous messages listener if active
    if (unsubscribeMessages) {
        unsubscribeMessages();
        console.log(`[displayChatView] Unsubscribed from previous messages listener.`);
    }

    let chatDocRef;
    if (chatInfo.type === 'user') {
        // For direct messages, create a consistent chat ID
        const chatUsers = [currentUserId, chatInfo.id].sort();
        const dmChatId = chatUsers.join('_');
        chatDocRef = doc(db, `artifacts/${appId}/public/data/chats`, dmChatId);
        // Create the chat document if it doesn't exist
        await setDoc(chatDocRef, {
                type: 'dm',
                members: chatUsers
            }, { merge: true }); // Use merge to avoid overwriting existing chat data
        console.log(`[displayChatView - DM] Chat Document Ref Path: ${chatDocRef.path}`);
    } else if (chatInfo.type === 'group') {
        chatDocRef = doc(db, `artifacts/${appId}/public/data/groups`, chatInfo.id);
        console.log(`[displayChatView - Group] Chat Document Ref Path: ${chatDocRef.path}`); // Debug log
    }

    // Listen for messages in this chat
    const messagesCollectionRef = collection(chatDocRef, 'messages');
    const q = query(messagesCollectionRef, orderBy('timestamp')); // Order by timestamp
    console.log(`[displayChatView - Chat] Messages Collection Ref Path: ${messagesCollectionRef.path}`); // Debug log

    unsubscribeMessages = onSnapshot(q, async (snapshot) => {
        console.log(`[displayChatView - Messages] onSnapshot triggered for chat: ${chatInfo.id}, type: ${chatInfo.type}`);
        if (snapshot.empty) {
            console.log("[displayChatView - Messages] No messages found in this chat (snapshot is empty).");
        }

        // Efficiently fetch sender names only if needed
        const senderIds = new Set();
        snapshot.docs.forEach(doc => senderIds.add(doc.data().senderId));
        const senderNamesMap = new Map();
        for (const senderId of senderIds) {
            if (!senderNamesMap.has(senderId)) { // Avoid re-fetching if already in map
                const senderDocRef = doc(db, `artifacts/${appId}/users`, senderId);
                try {
                    const senderDocSnap = await getDoc(senderDocRef);
                    senderNamesMap.set(senderId, senderDocSnap.exists() ? (senderDocSnap.data().username || senderDocSnap.data().email) : 'Desconocido');
                } catch (fetchError) {
                    console.error(`[displayChatView - Messages] Error fetching sender document for ${senderId}:`, fetchError);
                    senderNamesMap.set(senderId, 'Desconocido');
                }
            }
        }
        console.log("[displayChatView - Messages] Sender Names Map:", Object.fromEntries(senderNamesMap));


        snapshot.docChanges().forEach(docChange => {
            const messageData = docChange.doc.data();
            const messageId = docChange.doc.id;
            const senderName = senderNamesMap.get(messageData.senderId);
            const isCurrentUserMessage = messageData.senderId === currentUserId;

            console.log(`[displayChatView - Messages] Doc change type: ${docChange.type}, Message ID: ${messageId}, Old Index: ${docChange.oldIndex}, New Index: ${docChange.newIndex}, Data:`, messageData);

            if (docChange.type === 'added') {
                const newMessageElement = createMessageElement(messageData, senderName, isCurrentUserMessage, messageId);
                // Insert at the correct position based on newIndex
                const nextSibling = chatMessagesContainer.children[docChange.newIndex];
                chatMessagesContainer.insertBefore(newMessageElement, nextSibling);
                renderedMessages.set(messageId, newMessageElement);
                console.log(`[displayChatView - Messages] Added message ID: ${messageId} at index ${docChange.newIndex}`);
            } else if (docChange.type === 'modified') {
                // Remove the old element if it exists
                const existingElement = renderedMessages.get(messageId);
                if (existingElement) {
                    existingElement.remove();
                    renderedMessages.delete(messageId);
                    console.log(`[displayChatView - Messages] Removed old element for modified message ID: ${messageId} from index ${docChange.oldIndex}`);
                }
                // Create and insert the updated element at the new position
                const updatedMessageElement = createMessageElement(messageData, senderName, isCurrentUserMessage, messageId);
                const nextSibling = chatMessagesContainer.children[docChange.newIndex];
                chatMessagesContainer.insertBefore(updatedMessageElement, nextSibling);
                renderedMessages.set(messageId, updatedMessageElement);
                console.log(`[displayChatView - Messages] Re-added modified message ID: ${messageId} at new index ${docChange.newIndex}`);
            } else if (docChange.type === 'removed') {
                const existingElement = renderedMessages.get(messageId);
                if (existingElement) {
                    existingElement.remove();
                    renderedMessages.delete(messageId);
                    console.log(`[displayChatView - Messages] Removed message ID: ${messageId} from index ${docChange.oldIndex}`);
                }
            }
        });

        // After processing all changes, ensure scroll to bottom
        chatMessagesContainer.scrollTop = chatMessagesContainer.scrollHeight;
    }, (error) => {
        console.error("Error listening to messages:", error);
        addNotification('Error de Chat', 'Hubo un problema al cargar los mensajes. Intenta recargar la página.', 'error');
    });

    // Close sidebar on mobile when a chat is selected
    if (window.innerWidth < 768) { // Assuming 768px is the 'md' breakpoint
        sidebar.classList.add('-translate-x-full');
        sidebarOverlay.classList.add('hidden'); // Hide overlay when chat is selected
    }
}

/**
 * Uploads a file to Cloudinary.
 * Sube un archivo a Cloudinary.
 * @param {File} file - The file to upload. El archivo a subir.
 * @returns {Promise<string>} - A promise that resolves with the secure URL of the uploaded file. Una promesa que se resuelve con la URL segura del archivo subido.
 */
async function uploadFileToCloudinary(file) {
    if (CLOUDINARY_CLOUD_NAME === 'YOUR_CLOUDINARY_CLOUD_NAME' || CLOUDINARY_UPLOAD_PRESET === 'YOUR_CLOUDINARY_UPLOAD_PRESET') {
        throw new Error('Configuración de Cloudinary incompleta. Por favor, revisa CLOUDINARY_CLOUD_NAME y CLOUDINARY_UPLOAD_PRESET.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

    const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`, {
        method: 'POST',
        body: formData
    });
    const data = await response.json();

    if (data.secure_url) {
        return data.secure_url;
    } else {
        throw new Error(data.error ? data.error.message : 'Error desconocido al subir el archivo a Cloudinary.');
    }
}

/**
 * Renders the list of contacts.
 * Renderiza la lista de contactos.
 */
function renderContacts() {
    contactsList.innerHTML = '';
    if (contacts.length === 0) {
        noContactsMessage.classList.remove('hidden');
        return;
    }
    noContactsMessage.classList.add('hidden');

    contacts.forEach(contact => {
        const contactElement = document.createElement('li');
        contactElement.classList.add('flex', 'items-center', 'p-3', 'rounded-md', 'hover:bg-gray-200', 'cursor-pointer', 'transition-colors', 'duration-200');
        contactElement.addEventListener('click', () => {
            displayChatView({
                id: contact.uid,
                type: 'user',
                name: contact.username || contact.email, // Use username for display
                pic: contact.profilePicUrl || "https://placehold.co/50x50/E2E8F0/4A5568?text=User",
                status: contact.lastOnline && (Date.now() - contact.lastOnline.toDate().getTime() < 300000) ? 'En línea' : 'Desconectado' // Online if active in last 5 mins
            });
        });

        const statusIndicator = document.createElement('div');
        statusIndicator.classList.add('w-3', 'h-3', 'rounded-full', 'mr-2',
            contact.lastOnline && (Date.now() - contact.lastOnline.toDate().getTime() < 300000) ? 'bg-green-500' : 'bg-gray-400'
        ); // Green for online, gray for offline

        const contactPic = document.createElement('img');
        contactPic.src = contact.profilePicUrl || "https://placehold.co/50x50/E2E8F0/4A5568?text=User";
        contactPic.alt = "Contact Pic";
        contactPic.classList.add('w-10', 'h-10', 'rounded-full', 'object-cover', 'mr-3');

        const contactInfo = document.createElement('div');
        contactInfo.classList.add('flex-grow');

        const contactName = document.createElement('p');
        contactName.classList.add('font-medium', 'text-gray-800');
        contactName.textContent = contact.username || contact.email; // Use username for display

        const contactStatus = document.createElement('p');
        contactStatus.classList.add('text-sm', 'text-gray-500');
        contactStatus.textContent = contact.lastOnline && (Date.now() - contact.lastOnline.toDate().getTime() < 300000) ? 'En línea' : 'Desconectado';

        contactInfo.appendChild(contactName);
        contactInfo.appendChild(contactStatus);
        contactElement.appendChild(statusIndicator);
        contactElement.appendChild(contactPic);
        contactElement.appendChild(contactInfo);
        contactsList.appendChild(contactElement);
    });
}

/**
 * Renders the list of groups.
 * Renderiza la lista de grupos.
 */
function renderGroups() {
    groupsList.innerHTML = '';
    if (groups.length === 0) {
        noGroupsMessage.classList.remove('hidden');
        return;
    }
    noGroupsMessage.classList.add('hidden');

    groups.forEach(group => {
        const groupElement = document.createElement('li');
        groupElement.classList.add('flex', 'items-center', 'p-3', 'rounded-md', 'hover:bg-gray-200', 'cursor-pointer', 'transition-colors', 'duration-200');
        groupElement.addEventListener('click', () => {
            displayChatView({
                id: group.groupId,
                type: 'group',
                name: group.name,
                pic: group.photoUrl || "https://placehold.co/50x50/E2E8F0/4A5568?text=Group", // Use group.photoUrl
                status: `${group.members.length} miembros`
            });
        });

        const groupPic = document.createElement('img');
        groupPic.src = group.photoUrl || "https://placehold.co/50x50/E2E8F0/4A5568?text=Group"; // Use group.photoUrl
        groupPic.alt = "Group Pic";
        groupPic.classList.add('w-10', 'h-10', 'rounded-full', 'object-cover', 'mr-3');

        const groupInfo = document.createElement('div');
        groupInfo.classList.add('flex-grow');

        const groupName = document.createElement('p');
        groupName.classList.add('font-medium', 'text-gray-800');
        groupName.textContent = group.name;

        const groupMembersCount = document.createElement('p');
        groupMembersCount.classList.add('text-sm', 'text-gray-500');
        groupMembersCount.textContent = `${group.members.length} miembros`;

        groupInfo.appendChild(groupName);
        groupInfo.appendChild(groupMembersCount);
        groupElement.appendChild(groupPic);
        groupElement.appendChild(groupInfo);
        groupsList.appendChild(groupElement);
    });
}

/**
 * Listens for changes in the current user's contacts and updates the UI.
 * Escucha cambios en los contactos del usuario actual y actualiza la interfaz de usuario.
 */
function listenForContacts() {
    if (unsubscribeContacts) unsubscribeContacts(); // Unsubscribe from previous listener

    const userDocRef = doc(db, `artifacts/${appId}/users`, currentUserId);
    console.log(`[listenForContacts] Path: artifacts/${appId}/users/${currentUserId}`); // Debug log
    unsubscribeContacts = onSnapshot(userDocRef, async (docSnap) => {
        if (docSnap.exists()) {
            const userData = docSnap.data();
            const contactUids = userData.contacts || [];

            // Fetch details for each contact UID
            const fetchedContacts = [];
            for (const uid of contactUids) {
                const contactRef = doc(db, `artifacts/${appId}/users`, uid);
                const contactSnap = await getDoc(contactRef);
                if (contactSnap.exists()) {
                    fetchedContacts.push({ uid: contactSnap.id, ...contactSnap.data() });
                }
            }
            contacts = fetchedContacts; // Update global contacts array
            renderContacts(); // Re-render contacts list
        } else {
            contacts = [];
            renderContacts();
        }
    }, (error) => {
        console.error("Error listening to user contacts:", error);
        addNotification('Error de Contactos', 'Hubo un problema al cargar tus contactos. Intenta recargar la página.', 'error');
    });
}

/**
 * Listens for changes in the current user's groups and updates the UI.
 * Escucha cambios en los grupos del usuario actual y actualiza la interfaz de usuario.
 */
function listenForGroups() {
    if (unsubscribeGroups) unsubscribeGroups(); // Unsubscribe from previous listener

    const groupsCollectionRef = collection(db, `artifacts/${appId}/public/data/groups`);
    const q = query(groupsCollectionRef, where('members', 'array-contains', currentUserId));
    console.log(`[listenForGroups] Path: artifacts/${appId}/public/data/groups, Query: members array-contains ${currentUserId}`); // Debug log

    unsubscribeGroups = onSnapshot(q, (snapshot) => {
        groups = snapshot.docs.map(doc => ({ groupId: doc.id, ...doc.data() }));
        renderGroups(); // Re-render groups list
    }, (error) => {
        console.error("Error listening to user groups:", error);
        addNotification('Error de Grupos', 'Hubo un problema al cargar tus grupos. Intenta recargar la página.', 'error');
    });
}

/**
 * Listens for incoming friend requests for the current user.
 * Escucha las solicitudes de amistad entrantes para el usuario actual.
 */
function listenForFriendRequests() {
    const friendRequestsRef = collection(db, `artifacts/${appId}/public/data/friendRequests`);
    const q = query(friendRequestsRef, 
                            where('receiverId', '==', currentUserId), 
                            where('status', '==', 'pending'));
    console.log(`[listenForFriendRequests] Path: artifacts/${appId}/public/data/friendRequests, Query: receiverId == ${currentUserId}, status == pending`); // Debug log

    onSnapshot(q, async (snapshot) => {
        // Filter out old friend request notifications from the notifications array
        // This ensures only current pending requests are displayed
        notifications = notifications.filter(n => n.type !== 'friendRequest' || snapshot.docs.some(doc => doc.id === n.data.requestId)); 

        for (const docChange of snapshot.docChanges()) {
            const request = { id: docChange.doc.id, ...docChange.doc.data() };
            if (docChange.type === 'added' && request.status === 'pending') {
                // Fetch sender's username for the notification
                const senderDocRef = doc(db, `artifacts/${appId}/users`, request.senderId);
                const senderDocSnap = await getDoc(senderDocRef);
                const senderName = senderDocSnap.exists() ? (senderDocSnap.data().username || senderDocSnap.data().email) : 'Usuario Desconocido';

                // Add notification only if it's not already there
                if (!notifications.some(n => n.type === 'friendRequest' && n.data.requestId === request.id)) {
                    addNotification(
                        'Nueva Solicitud de Amistad',
                        `${senderName} te ha enviado una solicitud de amistad.`,
                        'friendRequest', // Custom type for friend requests
                        { requestId: request.id, senderId: request.senderId, senderName: senderName }
                    );
                }
            } else if (docChange.type === 'modified') {
                // If a request was modified (e.g., accepted/denied), remove its notification
                if (request.status !== 'pending') {
                    notifications = notifications.filter(n => !(n.type === 'friendRequest' && n.data && n.data.requestId === request.id));
                }
            } else if (docChange.type === 'removed') {
                // If a request is removed, remove its notification
                notifications = notifications.filter(n => !(n.type === 'friendRequest' && n.data && n.data.requestId === request.id));
            }
        }
        updateNotificationBadge();
        // If the notifications modal is open, re-render it
        if (!notificationsModal.classList.contains('hidden')) {
            showNotificationsModal();
        }
    }, (error) => {
        console.error("Error listening to friend requests:", error);
        addNotification('Error de Solicitudes', 'Hubo un problema al cargar las solicitudes de amistad. Asegúrate de que las reglas de seguridad de Firestore estén configuradas correctamente.', 'error');
    });
}

/**
 * Accepts a friend request, adds both users to each other's contacts.
 * Acepta una solicitud de amistad, añade a ambos usuarios a sus contactos.
 * @param {string} requestId - The ID of the friend request document.
 * @param {string} senderId - The UID of the user who sent the request.
 */
async function acceptFriendRequest(requestId, senderId) {
    try {
        const requestDocRef = doc(db, `artifacts/${appId}/public/data/friendRequests`, requestId);
        await updateDoc(requestDocRef, { status: 'accepted' });

        // Add to current user's contacts
        const currentUserDocRef = doc(db, `artifacts/${appId}/users`, currentUserId);
        const currentUserDocSnap = await getDoc(currentUserDocRef);
        if (currentUserDocSnap.exists()) {
            const currentContacts = currentUserDocSnap.data().contacts || [];
            if (!currentContacts.includes(senderId)) {
                await updateDoc(currentUserDocRef, { contacts: [...currentContacts, senderId] });
            }
        }

        // Add to sender's contacts (if not already there)
        const senderUserDocRef = doc(db, `artifacts/${appId}/users`, senderId);
        const senderUserDocSnap = await getDoc(senderUserDocRef);
        if (senderUserDocSnap.exists()) {
            const senderContacts = senderUserDocSnap.data().contacts || [];
            if (!senderContacts.includes(currentUserId)) {
                await updateDoc(senderUserDocRef, { contacts: [...senderContacts, currentUserId] });
            }
        }
        
        const senderDocSnap = await getDoc(senderUserDocRef);
        const senderName = senderDocSnap.exists() ? (senderDocSnap.data().username || senderDocSnap.data().email) : 'Usuario Desconocido';

        addNotification('Solicitud Aceptada', `Has aceptado la solicitud de amistad de ${senderName}. Ahora son contactos.`, 'success');
        // Re-fetch contacts to update the list immediately
        listenForContacts();
    } catch (error) {
        console.error('Error al aceptar solicitud de amistad:', error);
        addNotification('Error', 'No se pudo aceptar la solicitud de amistad.', 'error');
    }
}

/**
 * Denies a friend request, changing its status to 'denied'.
 * Deniega una solicitud de amistad, cambiando su estado a 'denied'.
 * @param {string} requestId - The ID of the friend request document.
 */
async function denyFriendRequest(requestId) {
    try {
        const requestDocRef = doc(db, `artifacts/${appId}/public/data/friendRequests`, requestId);
        await updateDoc(requestDocRef, { status: 'denied' });
        addNotification('Solicitud Denegada', 'Has denegado la solicitud de amistad.', 'info');
    } catch (error) {
        console.error('Error al denegar solicitud de amistad:', error);
        addNotification('Error', 'No se pudo denegar la solicitud de amistad.', 'error');
    }
}

// --- Firebase Initialization and Authentication State Listener ---
// This block will be executed once the DOM is fully loaded.
document.addEventListener('DOMContentLoaded', () => {
    try {
        if (firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_FIREBASE_API_KEY") {
            app = initializeApp(firebaseConfig);
            db = getFirestore(app);
            auth = getAuth(app);

            console.log("Firebase initialized. App ID:", appId); // Debug log for appId

            onAuthStateChanged(auth, async (user) => {
                if (user) {
                    // User is signed in
                    currentUserId = user.uid;
                    currentUserEmail = user.email;
                    
                    console.log("User authenticated. UID:", currentUserId, "Email:", currentUserEmail); // Debug log for authenticated user

                    // Fetch user's profile data from Firestore to get profilePicUrl and new fields
                    const userDocRef = doc(db, `artifacts/${appId}/users`, currentUserId);
                    const userDocSnap = await getDoc(userDocRef);

                    if (userDocSnap.exists()) {
                        const userData = userDocSnap.data();
                        userProfilePicUrl = userData.profilePicUrl || "https://placehold.co/100x100/A0AEC0/FFFFFF?text=PF";
                        profilePic.src = userProfilePicUrl;
                        userDisplayName = userData.username || user.displayName || user.email.split('@')[0];
                        userDisplayNameElement.textContent = userDisplayName;

                        emailVerifiedText.textContent = user.emailVerified ? 'Email Verificado ✅' : 'Email No Verificado ❌';
                        emailVerifiedText.classList.toggle('text-green-600', user.emailVerified);
                        emailVerifiedText.classList.toggle('text-red-600', !user.emailVerified);
                        resendVerificationEmailSidebarButton.classList.toggle('hidden', user.emailVerified);
                        
                        userPhoneDisplay.textContent = userData.phoneNumber ? `Teléfono: ${userData.phoneNumber}` : '';
                        userDobDisplay.textContent = userData.dateOfBirth ? `Nacimiento: ${userData.dateOfBirth}` : '';
                        userAgeDisplay.textContent = userData.age ? `Edad: ${userData.age}` : '';

                        await updateDoc(userDocRef, { lastOnline: serverTimestamp(), emailVerified: user.emailVerified }); 
                    } else {
                        const initialUsername = user.displayName || user.email.split('@')[0];
                        await setDoc(userDocRef, {
                            email: currentUserEmail,
                            username: initialUsername,
                            profilePicUrl: userProfilePicUrl,
                            lastOnline: serverTimestamp(),
                            contacts: [],
                            phoneNumber: null,
                            dateOfBirth: null,
                            age: null,
                            emailVerified: user.emailVerified
                        }, { merge: true });
                        profilePic.src = userProfilePicUrl;
                        userDisplayName = initialUsername;
                        userDisplayNameElement.textContent = userDisplayName;
                        emailVerifiedText.textContent = user.emailVerified ? 'Email Verificado ✅' : 'Email No Verificado ❌';
                        emailVerifiedText.classList.toggle('text-green-600', user.emailVerified);
                        emailVerifiedText.classList.toggle('text-red-600', !user.emailVerified);
                        resendVerificationEmailSidebarButton.classList.toggle('hidden', user.emailVerified);
                    }

                    authSection.classList.add('hidden');
                    appSection.classList.remove('hidden');

                    // Call listeners AFTER currentUserId is confirmed
                    listenForContacts();
                    listenForGroups();
                    listenForFriendRequests(); // Start listening for friend requests

                    showContactsButton.click();

                } else {
                    currentUserId = null;
                    currentUserEmail = null;
                    userDisplayName = null;
                    userProfilePicUrl = "https://placehold.co/100x100/A0AEC0/FFFFFF?text=PF";

                    appSection.classList.add('hidden');
                    authSection.classList.remove('hidden');
                    showLogin();

                    if (unsubscribeMessages) unsubscribeMessages();
                    if (unsubscribeContacts) unsubscribeContacts();
                    if (unsubscribeGroups) unsubscribeGroups();
                    contacts = [];
                    groups = [];
                    clearChatView();
                    notifications = [];
                    updateNotificationBadge();
                }
            });

        } else {
            console.error("Firebase config not found or incomplete. Please ensure your actual Firebase project details are provided.");
            document.getElementById('auth-message').textContent = "Error: Configuración de Firebase no encontrada o incompleta. La aplicación no funcionará correctamente. Por favor, asegúrate de que los valores de Firebase en el código son correctos.";
            document.getElementById('auth-button').disabled = true;
            document.getElementById('toggle-auth').disabled = true;
        }
    } catch (firebaseInitError) {
        console.error("Error during Firebase initialization:", firebaseInitError);
        document.getElementById('auth-message').textContent = `Error crítico al inicializar Firebase: ${firebaseInitError.message}. La aplicación no funcionará.`;
        document.getElementById('auth-button').disabled = true;
        document.getElementById('toggle-auth').disabled = true;
    }
    updateNotificationBadge(); // Initialize badge on load
});

// --- Event Listeners ---
toggleAuthButton.addEventListener('click', () => {
    if (authForm.dataset.mode === 'login') {
        showRegister();
    } else {
        showLogin();
    }
});

authForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value;
    const password = passwordInput.value;
    let username = usernameInput.value.trim();
    authMessage.textContent = '';

    if (authForm.dataset.mode === 'register') {
        const phoneNumber = phoneInput.value.trim();
        const dateOfBirth = dobInput.value;
        const age = parseInt(ageInput.value, 10);

        if (!username) {
            username = `SynergiCode-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await sendEmailVerification(user);
            addNotification('Registro Exitoso', `¡Bienvenido! Se ha enviado un email de verificación a ${email}.`, 'success');
            showEmailSentModal();

            await updateProfile(user, { displayName: username });
            
            const userDocRef = doc(db, `artifacts/${appId}/users`, user.uid);
            await setDoc(userDocRef, {
                email: email,
                username: username,
                profilePicUrl: userProfilePicUrl,
                lastOnline: serverTimestamp(),
                contacts: [],
                phoneNumber: null,
                dateOfBirth: null,
                age: null,
                emailVerified: user.emailVerified
            });
            
        } catch (error) {
            console.error('Error al registrar:', error);
            let errorMessage = 'Error al registrar. Por favor, inténtalo de nuevo.';
            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'Este correo electrónico ya está en uso. Por favor, inicia sesión o usa otro correo.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'El formato del correo electrónico es inválido.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'La contraseña debe tener al menos 6 caracteres.';
                    break;
                default:
                    errorMessage = `Error de registro: ${error.message}`;
                    break;
            }
            authMessage.textContent = errorMessage;
            addNotification('Error de Registro', errorMessage, 'error');
        }
    } else { // Login mode
        try {
            await signInWithEmailAndPassword(auth, email, password);
            addNotification('Inicio de Sesión Exitoso', `¡Bienvenido de nuevo, ${email.split('@')[0]}!`, 'success');
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            let errorMessage = '';
            switch (error.code) {
                case 'auth/invalid-email':
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                case 'auth/invalid-credential':
                    errorMessage = 'Alguien está intentando acceder a tu cuenta o las credenciales son incorrectas.';
                    break;
                default:
                    errorMessage = `Ha ocurrido un error inesperado al iniciar sesión.`;
                    break;
            }
            authMessage.textContent = errorMessage;
            addNotification('Error de Inicio de Sesión', errorMessage, 'error');
        }
    }
});

logoutButton.addEventListener('click', async () => {
    try {
        if (currentUserId) {
            const userDocRef = doc(db, `artifacts/${appId}/users`, currentUserId);
            await updateDoc(userDocRef, { lastOnline: null });
        }
        await signOut(auth);
        addNotification('Sesión Cerrada', 'Has cerrado sesión correctamente.', 'info');
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        addNotification('Error al Cerrar Sesión', `Hubo un problema al cerrar sesión. Inténtalo de nuevo.`, 'error');
    }
});

// Mobile logout button listener
mobileLogoutButton.addEventListener('click', async () => {
    try {
        if (currentUserId) {
            const userDocRef = doc(db, `artifacts/${appId}/users`, currentUserId);
            await updateDoc(userDocRef, { lastOnline: null });
        }
        await signOut(auth);
        addNotification('Sesión Cerrada', 'Has cerrado sesión correctamente.', 'info');
    } catch (error) {
        console.error('Error al cerrar sesión:', error);
        addNotification('Error al Cerrar Sesión', `Hubo un problema al cerrar sesión. Inténtalo de nuevo.`, 'error');
    }
});


sendMessageButton.addEventListener('click', async () => {
    const messageContent = messageInput.value.trim();
    const mediaFile = chatMediaUploadInput.files[0];

    if (messageContent === '' && !mediaFile) {
        console.log("[sendMessageButton] No content or media to send.");
        return;
    }
    if (!activeChat) {
        addNotification('Error', 'Selecciona un chat para enviar mensajes.', 'error');
        console.warn("[sendMessageButton] No active chat selected.");
        return;
    }

    addNotification('Enviando Mensaje', '...');
    console.log(`[sendMessageButton] Attempting to send message to chat: ${activeChat.id}, type: ${activeChat.type}`);

    let mediaUrl = null;
    let mediaType = null;

    if (mediaFile) {
        try {
            console.log("[sendMessageButton] Uploading media file...");
            mediaUrl = await uploadFileToCloudinary(mediaFile);
            mediaType = mediaFile.type;
            addNotification('Subida Exitosa', 'Archivo multimedia subido. Enviando mensaje...', 'success');
            console.log("[sendMessageButton] Media uploaded successfully:", mediaUrl);
        } catch (error) {
            console.error('[sendMessageButton] Error uploading media file:', error);
            addNotification('Error de Subida', `No se pudo subir el archivo.`, 'error');
            return;
        }
    }

    try {
        let chatDocRef;
        if (activeChat.type === 'user') {
            const chatUsers = [currentUserId, activeChat.id].sort();
            const dmChatId = chatUsers.join('_');
            chatDocRef = doc(db, `artifacts/${appId}/public/data/chats`, dmChatId);
            console.log(`[sendMessageButton] DM Chat Doc Ref Path: ${chatDocRef.path}`);
            await setDoc(chatDocRef, {
                type: 'dm',
                members: chatUsers
            }, { merge: true });
        } else if (activeChat.type === 'group') {
            chatDocRef = doc(db, `artifacts/${appId}/public/data/groups`, activeChat.id);
            console.log(`[sendMessageButton] Group Chat Doc Ref Path: ${chatDocRef.path}`);
        }

        const messagesCollectionRef = collection(chatDocRef, 'messages');
        const messageData = {
            senderId: currentUserId,
            content: messageContent,
            mediaUrl: mediaUrl,
            mediaType: mediaType,
            timestamp: serverTimestamp()
        };
        console.log("[sendMessageButton] Adding message to Firestore:", messageData);
        await addDoc(messagesCollectionRef, messageData);
        console.log("[sendMessageButton] Message successfully added to Firestore.");

        messageInput.value = '';
        chatMediaUploadInput.value = '';
        addNotification('Mensaje Enviado', 'Tu mensaje ha sido enviado.', 'success'); // Add success notification here
    } catch (error) {
        console.error('Error al enviar mensaje:', error);
        addNotification('Error al Enviar Mensaje', `No se pudo enviar el mensaje. Por favor, inténtalo de nuevo.`, 'error');
    }
});

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessageButton.click();
    }
});

showContactsButton.addEventListener('click', () => {
    contactsListView.classList.remove('hidden');
    groupsListView.classList.add('hidden');
    clearChatView();
});

showGroupsButton.addEventListener('click', () => {
    groupsListView.classList.remove('hidden');
    contactsListView.classList.add('hidden');
    clearChatView();
});

addContactButton.addEventListener('click', () => {
    addContactModal.classList.remove('hidden');
    addContactMessage.textContent = '';
    contactInput.value = '';
});

cancelAddContactButton.addEventListener('click', () => {
    addContactModal.classList.add('hidden');
});

addContactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = contactInput.value.trim();
    addContactMessage.textContent = '';

    if (input === '') {
        addContactMessage.textContent = 'Por favor, introduce un correo electrónico o un nombre de usuario.';
        return;
    }
    if (input === currentUserEmail || input === userDisplayName) {
        addContactMessage.textContent = 'No puedes enviarte una solicitud de amistad a ti mismo.';
        return;
    }

    try {
        let querySnapshot;
        if (input.includes('@')) {
            const usersRef = collection(db, `artifacts/${appId}/users`);
            const q = query(usersRef, where('email', '==', input));
            querySnapshot = await getDocs(q);
        } else {
            const usersRef = collection(db, `artifacts/${appId}/users`);
            const q = query(usersRef, where('username', '==', input));
            querySnapshot = await getDocs(q);
        }
        

        if (querySnapshot.empty) {
            addContactMessage.textContent = 'Usuario no encontrado. Asegúrate de que el correo o nombre de usuario sea correcto.';
            return;
        }

        const contactDoc = querySnapshot.docs[0];
        const contactUid = contactDoc.id;
        const contactData = contactDoc.data();

        // Check if already contacts
        if (contacts.some(c => c.uid === contactUid)) {
            addContactMessage.textContent = 'Este usuario ya es tu contacto.';
            return;
        }

        // Check for existing pending friend requests (sender -> receiver OR receiver -> sender)
        const friendRequestsRef = collection(db, `artifacts/${appId}/public/data/friendRequests`);
        const q1 = query(friendRequestsRef, 
                         where('senderId', '==', currentUserId), 
                         where('receiverId', '==', contactUid), 
                         where('status', '==', 'pending'));
        const q2 = query(friendRequestsRef, 
                         where('senderId', '==', contactUid), 
                         where('receiverId', '==', currentUserId), 
                         where('status', '==', 'pending'));

        const [snapshot1, snapshot2] = await Promise.all([getDocs(q1), getDocs(q2)]);

        if (!snapshot1.empty || !snapshot2.empty) {
            addContactMessage.textContent = 'Ya existe una solicitud de amistad pendiente con este usuario.';
            addNotification('Solicitud Pendiente', 'Ya tienes una solicitud de amistad pendiente con este usuario o viceversa.', 'info');
            return;
        }

        // Send friend request instead of adding directly
        await addDoc(friendRequestsRef, {
            senderId: currentUserId,
            receiverId: contactUid,
            status: 'pending',
            timestamp: serverTimestamp()
        });
        addNotification('Solicitud Enviada', `Solicitud de amistad enviada a ${contactData.username || contactData.email}.`, 'success');
        addContactModal.classList.add('hidden');
    } catch (error) {
        console.error('Error al añadir contacto (enviar solicitud):', error);
        addContactMessage.textContent = `Hubo un problema al enviar la solicitud. Por favor, inténtalo de nuevo.`;
        addNotification('Error al Enviar Solicitud', `Hubo un problema al enviar la solicitud.`, 'error');
    }
});

uploadGroupPicButton.addEventListener('click', () => {
    groupPhotoUploadInput.click();
});

groupPhotoUploadInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
            groupPhotoPreview.src = event.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        groupPhotoPreview.src = "https://placehold.co/80x80/E2E8F0/4A5568?text=Grupo"; // Reset to default
    }
});

createGroupButton.addEventListener('click', () => {
    createGroupModal.classList.remove('hidden');
    createGroupMessage.textContent = '';
    groupNameInput.value = '';
    groupDescriptionInput.value = '';
    groupPhotoPreview.src = "https://placehold.co/80x80/E2E8F0/4A5568?text=Grupo"; // Reset preview
    groupPhotoUploadInput.value = ''; // Clear file input
    groupMemberSelection.innerHTML = '';
    if (contacts.length === 0) {
        noContactsForGroup.classList.remove('hidden');
        return;
    }
    noContactsForGroup.classList.add('hidden');

    contacts.forEach(contact => {
        const div = document.createElement('div');
        div.classList.add('flex', 'items-center', 'space-x-2');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = `member-${contact.uid}`;
        checkbox.value = contact.uid;
        checkbox.classList.add('rounded', 'text-custom-secondary-blue', 'focus:ring-custom-secondary-blue');
        const label = document.createElement('label');
        label.htmlFor = `member-${contact.uid}`;
        label.classList.add('text-gray-700');
        label.textContent = contact.username || contact.email;
        div.appendChild(checkbox);
        div.appendChild(label);
        groupMemberSelection.appendChild(div);
    });
});

cancelCreateGroupButton.addEventListener('click', () => {
    createGroupModal.classList.add('hidden');
});

createGroupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const groupName = groupNameInput.value.trim();
    const groupDescription = groupDescriptionInput.value.trim();
    const groupPhotoFile = groupPhotoUploadInput.files[0];
    const selectedMembers = Array.from(groupMemberSelection.querySelectorAll('input[type="checkbox"]:checked'))
                               .map(checkbox => checkbox.value);
    createGroupMessage.textContent = '';

    if (groupName === '') {
        createGroupMessage.textContent = 'El nombre del grupo no puede estar vacío.';
        return;
    }

    if (!selectedMembers.includes(currentUserId)) {
        selectedMembers.push(currentUserId);
    }

    let groupPhotoUrl = null;
    if (groupPhotoFile) {
        try {
            groupPhotoUrl = await uploadFileToCloudinary(groupPhotoFile);
            addNotification('Subida Exitosa', 'Foto de grupo subida. Creando grupo...', 'success');
        } catch (error) {
            console.error('Error al subir la foto del grupo:', error);
            addNotification('Error de Subida', `No se pudo subir la foto del grupo.`, 'error');
            return;
        }
    }

    try {
        const groupsCollectionRef = collection(db, `artifacts/${appId}/public/data/groups`);
        await addDoc(groupsCollectionRef, {
            name: groupName,
            description: groupDescription,
            members: selectedMembers,
            adminId: currentUserId,
            photoUrl: groupPhotoUrl, // Save the photo URL
            createdAt: serverTimestamp()
        });
        addNotification('Grupo Creado', `El grupo "${groupName}" ha sido creado exitosamente.`, 'success');
        createGroupModal.classList.add('hidden');
    } catch (error) {
        console.error('Error al crear grupo:', error);
        createGroupMessage.textContent = `Hubo un problema al crear el grupo. Por favor, inténtalo de nuevo.`;
        addNotification('Error al Crear Grupo', `Hubo un problema al crear el grupo.`, 'error');
    }
});

uploadPicButton.addEventListener('click', () => {
    profilePicUploadInput.click();
});

profilePicUploadInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) {
        return;
    }

    addNotification('Subiendo Imagen', 'Tu foto de perfil se está subiendo...', 'info');

    try {
        const newProfilePicUrl = await uploadFileToCloudinary(file);
        const userDocRef = doc(db, `artifacts/${appId}/users`, currentUserId);
        await updateDoc(userDocRef, {
            profilePicUrl: newProfilePicUrl
        });
        profilePic.src = newProfilePicUrl;
        userProfilePicUrl = newProfilePicUrl;
        addNotification('Éxito', 'Foto de perfil actualizada correctamente.', 'success');
    } catch (error) {
        console.error('Error al subir la imagen:', error);
        addNotification('Error de Subida', `No se pudo subir la foto de perfil. Por favor, inténtalo de nuevo.`, 'error');
    } finally {
        profilePicUploadInput.value = '';
    }
});

attachMediaButton.addEventListener('click', () => {
    chatMediaUploadInput.click();
});

messageBoxOkButton.addEventListener('click', hideMessageBox);
emailSentOkButton.addEventListener('click', hideEmailSentModal);

resendVerificationEmailSidebarButton.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (!user) {
        addNotification('Error', 'No hay usuario autenticado para reenviar el email.', 'error');
        return;
    }

    if (resendCooldownTimer) {
        addNotification('Espera', `Ya has solicitado un email de verificación. Por favor, espera ${RESEND_COOLDOWN_SECONDS} segundos antes de intentar de nuevo.`, 'info');
        return;
    }

    // Start cooldown
    resendVerificationEmailSidebarButton.disabled = true;
    let timeLeft = RESEND_COOLDOWN_SECONDS;
    resendVerificationEmailSidebarButton.textContent = `Reenviar Email (${timeLeft}s)`;

    resendCooldownTimer = setInterval(() => {
        timeLeft--;
        if (timeLeft > 0) {
            resendVerificationEmailSidebarButton.textContent = `Reenviar Email (${timeLeft}s)`;
        } else {
            clearInterval(resendCooldownTimer);
            resendCooldownTimer = null;
            resendVerificationEmailSidebarButton.textContent = `Reenviar Email de Verificación`;
            resendVerificationEmailSidebarButton.disabled = false;
        }
    }, 1000);

    try {
        await sendEmailVerification(user);
        addNotification('Email Reenviado', 'Se ha reenviado el email de verificación. Revisa tu bandeja de entrada.', 'success');
    } catch (error) {
        console.error('Error al reenviar email de verificación:', error);
        let errorMessage = `No se pudo reenviar el email de verificación. Por favor, inténtalo de nuevo más tarde.`;
        if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Has solicitado demasiados emails de verificación. Por favor, espera un momento antes de intentarlo de nuevo.';
        }
        addNotification('Error al Reenviar Email', errorMessage, 'error');
        // Even on error, keep the cooldown to prevent rapid retries
    }
});

forgotPasswordLink.addEventListener('click', (e) => {
    e.preventDefault();
    forgotPasswordModal.classList.remove('hidden');
    forgotPasswordMessage.textContent = '';
    forgotEmailInput.value = '';
});

cancelForgotPasswordButton.addEventListener('click', () => {
    forgotPasswordModal.classList.add('hidden');
});

forgotPasswordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const emailToReset = forgotEmailInput.value.trim();
    forgotPasswordMessage.textContent = '';

    try {
        await sendPasswordResetEmail(auth, emailToReset);
        addNotification('Email de Recuperación Enviado', `Se ha enviado un enlace de restablecimiento de contraseña a ${emailToReset}. Revisa tu bandeja de entrada.`, 'success');
        forgotPasswordModal.classList.add('hidden');
    } catch (error) {
        console.error('Error al enviar email de recuperación:', error);
        let errorMessage = `Hubo un problema al enviar el email de recuperación. Asegúrate de que el correo sea correcto.`;
        switch (error.code) {
            case 'auth/invalid-email':
                errorMessage = 'El formato del correo electrónico es inválido.';
                break;
            case 'auth/user-not-found':
                errorMessage = 'No se encontró un usuario con este correo electrónico.';
                break;
            default:
                break;
        }
        forgotPasswordMessage.textContent = errorMessage;
        addNotification('Error de Recuperación', errorMessage, 'error');
    }
});

showNotificationsButton.addEventListener('click', showNotificationsModal);
clearNotificationsButton.addEventListener('click', clearAllNotifications);
closeNotificationsModalButton.addEventListener('click', () => {
    notificationsModal.classList.add('hidden');
});

// New Event Listener for Friend Requests Button
showFriendRequestsButton.addEventListener('click', showNotificationsModal);


changeUsernameButton.addEventListener('click', () => {
    changeUsernameModal.classList.remove('hidden');
    changeUsernameMessage.textContent = '';
    newUsernameInput.value = userDisplayName;
});

cancelChangeUsernameButton.addEventListener('click', () => {
    changeUsernameModal.classList.add('hidden');
});

changeUsernameForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const newUsername = newUsernameInput.value.trim();
    changeUsernameMessage.textContent = '';

    if (newUsername === '') {
        changeUsernameMessage.textContent = 'El nombre de usuario no puede estar vacío.';
        return;
    }
    if (newUsername === userDisplayName) {
        changeUsernameMessage.textContent = 'El nuevo nombre de usuario es el mismo que el actual.';
        return;
    }

    try {
        const usersRef = collection(db, `artifacts/${appId}/users`);
        const q = query(usersRef, where('username', '==', newUsername));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty && querySnapshot.docs[0].id !== currentUserId) {
            changeUsernameMessage.textContent = 'Este nombre de usuario ya está en uso. Por favor, elige otro.';
            return;
        }

        await updateProfile(auth.currentUser, { displayName: newUsername });

        const userDocRef = doc(db, `artifacts/${appId}/users`, currentUserId);
        await updateDoc(userDocRef, {
            username: newUsername
        });

        userDisplayName = newUsername;
        userDisplayNameElement.textContent = newUsername;
        addNotification('Nombre de Usuario Actualizado', `Tu nombre de usuario se ha cambiado a "${newUsername}" correctamente.`, 'success');
        changeUsernameModal.classList.add('hidden');
    } catch (error) {
        console.error('Error al cambiar nombre de usuario:', error);
        let errorMessage = `Hubo un problema al cambiar el nombre de usuario.`;
        if (error.code === 'permission-denied' || (error.message && error.message.includes('Missing or insufficient permissions'))) {
            errorMessage = 'No tienes permisos suficientes para cambiar el nombre de usuario. Asegúrate de que las reglas de seguridad de Firestore estén configuradas correctamente.';
        }
        changeUsernameMessage.textContent = errorMessage;
        addNotification('Error al Cambiar Nombre de Usuario', errorMessage, 'error');
    }
});

mobileSidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('-translate-x-full');
    sidebarOverlay.classList.toggle('hidden');
});

closeSidebarButton.addEventListener('click', () => {
    sidebar.classList.add('-translate-x-full');
    sidebarOverlay.classList.add('hidden');
});

sidebarOverlay.addEventListener('click', () => {
    sidebar.classList.add('-translate-x-full');
    sidebarOverlay.classList.add('hidden');
});
