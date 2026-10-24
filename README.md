# PlugPakkam

Find a plug near you to charge your EV. Homes, shops and offices share their charger or a normal plug socket, and EV owners nearby can find it, call or WhatsApp the owner and go charge.

Built for 2-wheelers first and for small towns in Tamil Nadu. Tamil and English.

## Features

- Map of shared plugs and public charging stations across Tamil Nadu, nearest 5 first, more as you zoom out
- Search any town or area in English or Tamil
- Filters for shared plugs or stations, vehicle and plug type
- Place page with call, WhatsApp and directions
- Hosts sign up with mobile OTP, add their place with a map pin, price per hour and UPI or cash, pause sharing for the day
- New places are checked by an admin before they show on the map, alerts on Telegram
- Report a problem on any place
- Installable on the phone (PWA)

## Run locally

```
cp .env.example .env.local
npm install
npm run seed
npm run import-stations
npm run create-admin -- 9xxxxxxxxx yourpassword
npm run dev
```

In dev the OTP is printed in the terminal instead of sent by SMS.

## Tech

Next.js (App Router), MongoDB with Mongoose (2dsphere geo queries), Leaflet with OpenStreetMap, jose sessions, Fast2SMS for OTP, Telegram bot alerts, Cloudinary for photos, CSS modules.

Station data © OpenStreetMap contributors.
