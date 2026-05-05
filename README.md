<img width="1080" height="324" alt="Banners(1)" src="https://github.com/user-attachments/assets/dbfc6d84-08d8-43d6-9aea-43649fff2565" />

# CommonGround

**Find places everyone can reach.**

A travel-time isochrone explorer that helps groups find meetup spots, offices, and amenities that are reachable from multiple starting locations.

## Features

- Add any address, postcode, or landmark worldwide (default view: Singapore)
- 4 travel modes: Public Transport, Walking, Cycling, Driving
- Time bands: 10, 15, 30, 45, 60, 90, 120, 180 minutes
- Multi-location overlap analysis — see where everyone's reachable areas intersect
- Place discovery inside reachable zones (food, cafes, gyms, parks, malls, hotels, and more)
- Free-text search ("kway chap", "dim sum", "coworking")
- Dark mode, persistent state across sessions

## Tech stack

- [Next.js](https://nextjs.org) + TypeScript + Tailwind CSS
- [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript) — map, geocoding, places
- [TravelTime API](https://traveltime.com) — travel-time isochrone polygons
- [Turf.js](https://turfjs.org) — polygon intersection and spatial filtering
- [Vercel Analytics](https://vercel.com/analytics)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API keys

Add to `.env.local`:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=   # Maps JS API + Places API + Geocoding API
NEXT_PUBLIC_TRAVELTIME_APP_ID=     # traveltime.com
NEXT_PUBLIC_TRAVELTIME_API_KEY=
```

Without keys the app runs in demo mode with mock isochrones.
