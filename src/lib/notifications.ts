export const WELCOME_TEMPLATE = {
  title: "Prachurjo 👀",
  body: "Thanks Sir Amake enable korar jonno 😊"
};

export const NOTIFICATION_TEMPLATES = [
  "Bhai, apni ki vule gelen amader? Ekbar ashen na! 🥺",
  "Knock Knock! Ke ashe? Ekta mojar tool ache apnar jonno! 😂",
  "Boss, cha khaben? Naki amader site e ektu ghure asben? ☕",
  "Janen ki? Ajker dine apni ekta valo kaj korte paren... Prachurjo te click kore! 🚀",
  "Areh! Apni ekhono ekhane? Jan, ektu ghure ashen Prachurjo theke! 🏃‍♂️",
  "Phone e eto ki dekhen? Amader site e ashen, onek kisu ache! 👀",
  "Warning: Ekhane click korle apni heshe fela-r somvabona ache! ⚠️😆",
  "Apnar internet bill kintu waste hocche, amader tool use na korle! 💸",
  "Ektu break nin boss! Click kore dekhen ki surprise ache. 🎁",
  "Hello sir! Apnar ekta urgent notification esheche... (Mithha kotha, just apnake miss korchilam) 😜",
  "Jibone ki ba paben? Tar theke bhalo Prachurjo theke 2-4 ta tool use kore nin! 🛠️",
  "Sunchhen? Apnar jonno ekta special joke ache, kintu ekhane bolbo na. Click korun! 🤐",
  "Apni ki jantenn... Prachurjo ekhon aro fast? Na janle check korun! ⚡",
  "Eka eka ki koren? Ashen ektu productive kisu kori! 💻",
  "Bhai click koren, amar developer ke bolbo amar salary baraite! 🙏😂",
  "Miss me? Ami kintu apnake onek miss korchi! 🥺",
  "Apnar thumbnail ki ekhono normal? Ashen AI diye optimize kori! 🤖",
  "Othe bhai! Onek shuye thakso, ebar ektu kaj koro! 🥱",
  "Jokhon keu thake na pashe, Prachurjo thake apnar sathe! ❤️ Click korun!",
  "Areh boss! Ekta joss update asche, na dekhle miss! 🔥",
  "Tring Tring! Apnar jonno ekta notun message... Prachurjo er pokkho theke! 📞",
  "Ki bhabchen? Click korbo ki korbo na? Korei felun na! 🤔",
  "Bhai ektu help koren, ekhane click korle amar battery charge hoy! 🔋😅",
  "Ajker din ta kemon gelo? Ashen Prachurjo te ektu mood bhalo kori! 🌈"
];

// Initialize SW and setup scheduling
export const initNotifications = async () => {
  if (!('serviceWorker' in navigator) || !('Notification' in window)) {
    return;
  }

  // Register service worker if not already registered
  try {
    await navigator.serviceWorker.register('/sw.js');
  } catch (error) {
    console.error('Service Worker registration failed:', error);
  }

  if (Notification.permission === 'granted') {
    startScheduler();
  }
};

export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) return false;

  const permission = await Notification.requestPermission();
  if (permission === 'granted') {
    // Check if we already sent the welcome notification previously
    const hasSentWelcome = localStorage.getItem('has_sent_welcome');
    if (!hasSentWelcome) {
      sendNotification(WELCOME_TEMPLATE.title, WELCOME_TEMPLATE.body);
      localStorage.setItem('has_sent_welcome', 'true');
    }
    startScheduler();
    return true;
  }
  return false;
};

// Scheduler intervals (check every minute to see if an hour has passed)
let schedulerInterval: number | null = null;

const startScheduler = () => {
  if (schedulerInterval) return; // Already running

  // Check immediately on start
  checkAndSendHourlyNotification();

  // Then check every 60 seconds
  schedulerInterval = window.setInterval(() => {
    checkAndSendHourlyNotification();
  }, 60 * 1000);
};

const checkAndSendHourlyNotification = () => {
  const lastTime = localStorage.getItem('last_notification_time');
  const currentIndex = parseInt(localStorage.getItem('notification_index') || '0');
  
  const now = Date.now();
  const oneHour = 60 * 60 * 1000; // 1 Hour in milliseconds
  
  // If never sent before, or 1 hour has passed since last notification
  if (!lastTime || (now - parseInt(lastTime)) >= oneHour) {
    // Pick the template based on current index
    const templateBody = NOTIFICATION_TEMPLATES[currentIndex % NOTIFICATION_TEMPLATES.length];
    
    sendNotification("Prachurjo 👀", templateBody);
    
    // Update local storage tracking
    localStorage.setItem('last_notification_time', now.toString());
    localStorage.setItem('notification_index', (currentIndex + 1).toString());
  }
};

const sendNotification = (title: string, body: string) => {
  if (Notification.permission === 'granted') {
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(title, {
        body,
        icon: '/favicon-32x32.png',
        badge: '/favicon-32x32.png',
        requireInteraction: true, // Requires user to click/dismiss
        data: { url: window.location.origin }
      });
    });
  }
};
