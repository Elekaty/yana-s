self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  const text = event.data ? event.data.text() : "Reminder";
  event.waitUntil(self.registration.showNotification("Mochi & Friends", { body: text }));
});
