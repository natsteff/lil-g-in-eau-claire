# Gameplay queue

## Expand the residential route

**Implemented in the local prototype.** Keep the run at street level. Expand the existing residential sections into three before Downtown and three after it. Duplicate Residential A and B as starting points and vary the houses and backdrop details so each stretch feels distinct.

Apartment → Garage → Residential A1 → A2 → A3 → Downtown → Residential B1 → B2 → B3 → 3rd & Vine → Delivery.

## Add residential traffic

**Implemented in the local prototype.** Replace some character encounters with moving vehicles on residential streets only. Keep a mix of characters and vehicles across the six sections. Candidate sprites include a pickup, electric scooter riders, a semi with trailer, a police car, and a bus.

- Lil’ G can jump over traffic or land on top. Landing and standing on a moving vehicle are safe, and the vehicle carries him along until he steps or jumps off.
- A vehicle damages Lil’ G only on a body impact, such as a side collision. A safe landing should never register a hit.
- Give each vehicle a collision shape that matches its visible top and body. Check the longer semi and trailer for fair jumps and consistent landings.

## Introduce Mega Jump

**Implemented in the local prototype.** Place a special pickup on the first residential section, before the first encounter that benefits from a higher jump. Proposed pickup art is a spring labeled **Mega Jump**. It signals a stronger jump more directly than the jetpack.

After pickup, a quick second press of Space during a jump triggers a higher jump. Support the same quick double press on the mobile Jump button. Show a short prompt on pickup and provide a safe stretch to try the move. The exact timing window and jump height are tuning decisions.

## Give the seagull a swooping patrol

**Implemented in the local prototype.** Keep ground enemies aligned with Lil’ G’s walking surface. The seagull is the exception. It normally flies above him, patrols left and right, and periodically swoops down into his path before climbing again. Keep its collision area aligned with the visible bird throughout the swoop.
