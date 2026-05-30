Fair Draw is a lightweight single-page app for picking a random winner from a list of people in a way that's transparent and verifiable — so the person running the draw can prove they didn't cheat.
The core idea is that the random selection is deterministic: the winner is always derived from the names and their order, never from a fresh random roll each time. If you share the list with someone else, they'll always get the same result. This makes it useful in situations where fairness needs to be demonstrable — like picking who gets a slot, a task, or a prize from a sign-up list.
How you use it:

Type names in one at a time, in the order people signed up or requested something
Reorder them by dragging the handle on the left of each row if needed
Hit Draw a winner — the result is highlighted in the list and shown in a winner card
Copy the share link and send it to anyone who wants to verify the outcome

Under the hood the selection uses a djb2 hash of the ordered name list as a seed for a mulberry32 PRNG. Because the seed comes entirely from the data, the same list always produces the same winner. The hex seed value is shown on the result card so anyone can inspect it.
The share link encodes the full ordered list as base64 in the URL's ?d= parameter. Anyone opening that link sees the identical list and can run the draw themselves to confirm the result — no server, no database, no trust required.