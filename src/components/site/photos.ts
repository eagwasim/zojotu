/*
 * Licensed stand-in photographs (Unsplash License) until Zojotu has photos of its own bench.
 * Credits: public/images/site/CREDITS.md and the landing page footer.
 */
import watchmakerAtBench from "../../../public/images/site/watchmaker-at-bench.webp";
import handsOnMovement from "../../../public/images/site/hands-on-movement.webp";
import movementCloseup from "../../../public/images/site/movement-closeup.webp";
import movementInHolder from "../../../public/images/site/movement-in-holder.webp";

export const photos = {
  bench: {
    src: watchmakerAtBench,
    alt: "A watchmaker in glasses and a loupe works on an open pocket watch movement held in a movement holder",
  },
  hands: {
    src: handsOnMovement,
    alt: "Close view of hands steadying a watch movement while a fine screwdriver turns a tiny screw",
  },
  movement: {
    src: movementCloseup,
    alt: "Macro view of a mechanical watch movement: steel gears, a brass wheel and red jewel bearings",
  },
  holder: {
    src: movementInHolder,
    alt: "An automatic watch movement clamped in a steel holder on a blue parts tray, with small parts beside it",
  },
} as const;

export const PHOTO_CREDIT = "Photos: Vanishing Point Images, Олександр К on Unsplash";
